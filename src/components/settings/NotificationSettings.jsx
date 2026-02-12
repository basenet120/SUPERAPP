import { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Moon, 
  Clock,
  Info,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const notificationTypes = [
  { id: 'booking_confirmed', label: 'Booking Confirmed', description: 'When a new booking is confirmed' },
  { id: 'booking_cancelled', label: 'Booking Cancelled', description: 'When a booking is cancelled' },
  { id: 'payment_received', label: 'Payment Received', description: 'When a payment is successfully processed' },
  { id: 'payment_failed', label: 'Payment Failed', description: 'When a payment fails to process' },
  { id: 'coi_uploaded', label: 'COI Uploaded', description: 'When a Certificate of Insurance is uploaded' },
  { id: 'quote_approved', label: 'Quote Approved', description: 'When a client approves a quote' },
  { id: 'quote_declined', label: 'Quote Declined', description: 'When a client declines a quote' },
  { id: 'equipment_conflict', label: 'Equipment Conflict', description: 'When there is a scheduling conflict' },
  { id: 'mention', label: 'Mentions', description: 'When someone mentions you in chat' },
  { id: 'system_alert', label: 'System Alerts', description: 'Important system notifications' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
];

const weekDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    fetchPreferences();
    checkPushSupport();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPushSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(supported);
    
    if (supported) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setPushEnabled(!!subscription);
        });
      });
    }
  };

  const handleToggle = (channel, type) => {
    const key = `${channel}_${type}`;
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleQuietHoursToggle = () => {
    setPreferences(prev => ({
      ...prev,
      quiet_hours_enabled: !prev.quiet_hours_enabled
    }));
  };

  const handleDigestToggle = (type) => {
    const key = type === 'daily' ? 'digest_daily_enabled' : 'digest_weekly_enabled';
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        setSaveStatus({ type: 'success', message: 'Preferences saved successfully' });
      } else {
        setSaveStatus({ type: 'error', message: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID key from server
        const response = await fetch('/api/notifications/vapid-key');
        const { publicKey } = await response.json();
        
        if (!publicKey) {
          alert('Push notifications are not configured on the server');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });

        setPushEnabled(true);
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      alert('Failed to enable push notifications');
    }
  };

  const disablePush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        setPushEnabled(false);
      }
    } catch (error) {
      console.error('Error disabling push:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
        <p className="text-primary-600">Failed to load notification settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Notification Settings</h1>
        <p className="text-primary-500 mt-1">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Push Notifications Setup */}
      {pushSupported && (
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900">Push Notifications</h3>
                <p className="text-sm text-primary-500 mt-1">
                  Receive notifications on your device even when the app is closed
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-primary-400">
                  <Info className="w-3 h-3" />
                  <span>Requires browser permission</span>
                </div>
              </div>
            </div>
            <Button
              variant={pushEnabled ? 'outline' : 'primary'}
              onClick={pushEnabled ? disablePush : requestPushPermission}
            >
              {pushEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </Card>
      )}

      {/* Notification Channels */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-primary-900 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Channels
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-200">
                <th className="text-left px-6 py-3 text-sm font-medium text-primary-700">Notification Type</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-primary-700 w-32">
                  <div className="flex flex-col items-center">
                    <Bell className="w-4 h-4 mb-1" />
                    <span className="text-xs">In-App</span>
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-primary-700 w-32">
                  <div className="flex flex-col items-center">
                    <Mail className="w-4 h-4 mb-1" />
                    <span className="text-xs">Email</span>
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-primary-700 w-32">
                  <div className="flex flex-col items-center">
                    <Smartphone className="w-4 h-4 mb-1" />
                    <span className="text-xs">Push</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {notificationTypes.map((type) => (
                <tr key={type.id} className="hover:bg-primary-50/50">
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-primary-900">{type.label}</p>
                      <p className="text-xs text-primary-500">{type.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences[`inapp_${type.id}`]}
                        onChange={() => handleToggle('inapp', type.id)}
                      />
                      <div className="w-9 h-5 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences[`email_${type.id}`]}
                        onChange={() => handleToggle('email', type.id)}
                      />
                      <div className="w-9 h-5 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences[`push_${type.id}`]}
                        onChange={() => handleToggle('push', type.id)}
                        disabled={!pushEnabled}
                      />
                      <div className={`w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${pushEnabled ? 'bg-primary-200 peer-checked:bg-brand-500 peer-checked:after:translate-x-full' : 'bg-primary-100 cursor-not-allowed'}`}></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Moon className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary-900">Quiet Hours</h3>
                <p className="text-sm text-primary-500 mt-1">
                  Pause push notifications during specific hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.quiet_hours_enabled}
                  onChange={handleQuietHoursToggle}
                />
                <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>
            
            {preferences.quiet_hours_enabled && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => handleSelectChange('quiet_hours_start', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => handleSelectChange('quiet_hours_end', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">Timezone</label>
                  <select
                    value={preferences.quiet_hours_timezone}
                    onChange={(e) => handleSelectChange('quiet_hours_timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-primary-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Digest Emails */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="font-semibold text-primary-900">Digest Emails</h3>
              <p className="text-sm text-primary-500 mt-1">
                Receive summaries of your notifications on a schedule
              </p>
            </div>

            {/* Daily Digest */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <h4 className="font-medium text-primary-900">Daily Digest</h4>
                <p className="text-xs text-primary-500">Summary of unread notifications</p>
              </div>
              <div className="flex items-center gap-4">
                {preferences.digest_daily_enabled && (
                  <input
                    type="time"
                    value={preferences.digest_daily_time}
                    onChange={(e) => handleSelectChange('digest_daily_time', e.target.value)}
                    className="px-2 py-1 border border-primary-200 rounded text-sm"
                  />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.digest_daily_enabled}
                    onChange={() => handleDigestToggle('daily')}
                  />
                  <div className="w-9 h-5 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <div>
                <h4 className="font-medium text-primary-900">Weekly Digest</h4>
                <p className="text-xs text-primary-500">Weekly summary of all activity</p>
              </div>
              <div className="flex items-center gap-4">
                {preferences.digest_weekly_enabled && (
                  <>
                    <select
                      value={preferences.digest_weekly_day}
                      onChange={(e) => handleSelectChange('digest_weekly_day', e.target.value)}
                      className="px-2 py-1 border border-primary-200 rounded text-sm"
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={preferences.digest_weekly_time}
                      onChange={(e) => handleSelectChange('digest_weekly_time', e.target.value)}
                      className="px-2 py-1 border border-primary-200 rounded text-sm"
                    />
                  </>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={preferences.digest_weekly_enabled}
                    onChange={() => handleDigestToggle('weekly')}
                  />
                  <div className="w-9 h-5 bg-primary-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {saveStatus && (
          <div className={`flex items-center gap-2 ${saveStatus.type === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
            {saveStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm">{saveStatus.message}</span>
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <Button
            variant="primary"
            onClick={savePreferences}
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Settings, 
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  AtSign,
  Package,
  X,
  Loader2
} from 'lucide-react';

const iconMap = {
  booking_confirmed: Calendar,
  booking_cancelled: Calendar,
  payment_received: DollarSign,
  payment_failed: DollarSign,
  coi_uploaded: FileText,
  quote_approved: FileText,
  quote_declined: FileText,
  equipment_conflict: Package,
  mention: AtSign,
  system_alert: AlertTriangle,
  digest_daily: Bell,
  digest_weekly: Bell
};

const priorityColors = {
  low: 'bg-primary-100 text-primary-600',
  normal: 'bg-brand-100 text-brand-600',
  high: 'bg-warning-100 text-warning-600',
  urgent: 'bg-danger-100 text-danger-600'
};

export function NotificationBell({ notifications: initialNotifications = [], unreadCount: initialUnread = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Update when props change
  useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnread);
  }, [initialNotifications, initialUnread]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id, event) => {
    event?.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id, event) => {
    event?.stopPropagation();
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const wasUnread = notifications.find(n => n.id === id)?.read === false;
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
    setIsOpen(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-primary-500 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full animate-pulse" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="fixed sm:absolute right-0 top-0 sm:top-full sm:mt-2 w-full sm:w-96 h-full sm:h-auto sm:max-h-[80vh] bg-white sm:rounded-xl shadow-dropdown border-0 sm:border border-primary-200 z-50 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary-200">
              <h3 className="font-semibold text-primary-900">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-primary-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="p-1.5 text-primary-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings/notifications' }));
                    setIsOpen(false);
                  }}
                  className="p-1.5 text-primary-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-primary-500 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-12 h-12 text-primary-300 mb-3" strokeWidth={1.5} />
                  <p className="text-primary-500 text-sm">No notifications yet</p>
                  <p className="text-primary-400 text-xs mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-primary-100">
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type] || Bell;
                    const isUnread = !notification.read;
                    
                    return (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`group relative p-4 cursor-pointer transition-colors hover:bg-primary-50 ${
                          isUnread ? 'bg-brand-50/50' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            priorityColors[notification.priority] || priorityColors.normal
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-sm font-medium ${
                                isUnread ? 'text-primary-900' : 'text-primary-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-primary-400 whitespace-nowrap">
                                {formatTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className={`text-sm mt-0.5 line-clamp-2 ${
                              isUnread ? 'text-primary-700' : 'text-primary-500'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {isUnread && (
                            <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        
                        {/* Actions on hover */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {isUnread && (
                            <button
                              onClick={(e) => markAsRead(notification.id, e)}
                              className="p-1 text-primary-400 hover:text-brand-600 hover:bg-brand-100 rounded"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-1 text-primary-400 hover:text-danger-600 hover:bg-danger-100 rounded"
                            title="Delete"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-primary-200 bg-primary-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, Wrench, Clock, Package, CheckCircle, 
  Filter, Bell, Settings, X, ChevronDown, ChevronUp,
  Calendar, ArrowRight, AlertCircle
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'

// Mock alert data
const generateMockAlerts = () => [
  {
    id: 1,
    type: 'low_stock',
    severity: 'high',
    title: 'Low Stock Alert: Sony A7S III',
    message: 'Only 1 unit remaining. Reorder threshold: 3 units.',
    equipmentId: 'cam-001',
    equipmentName: 'Sony A7S III',
    currentStock: 1,
    threshold: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    status: 'active',
    suggestedAction: 'Place order for 5 units'
  },
  {
    id: 2,
    type: 'maintenance_due',
    severity: 'medium',
    title: 'Maintenance Due: DJI Ronin RS3 Pro',
    message: 'Scheduled maintenance overdue by 5 days.',
    equipmentId: 'gimbal-001',
    equipmentName: 'DJI Ronin RS3 Pro',
    lastMaintenance: '2025-10-15',
    nextMaintenance: '2026-01-15',
    daysOverdue: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    status: 'active',
    suggestedAction: 'Schedule maintenance appointment'
  },
  {
    id: 3,
    type: 'overdue_return',
    severity: 'high',
    title: 'Overdue Return: Aputure 600D Kit',
    message: 'Equipment was due back yesterday. Client: Acme Productions',
    equipmentId: 'light-003',
    equipmentName: 'Aputure 600D Kit',
    bookingId: 'BK-2026-0042',
    clientName: 'Acme Productions',
    dueDate: '2026-02-11',
    daysOverdue: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    status: 'active',
    suggestedAction: 'Contact client immediately'
  },
  {
    id: 4,
    type: 'low_stock',
    severity: 'medium',
    title: 'Low Stock Alert: Canon RF 24-70mm f/2.8',
    message: '2 units remaining. Reorder threshold: 3 units.',
    equipmentId: 'lens-002',
    equipmentName: 'Canon RF 24-70mm f/2.8',
    currentStock: 2,
    threshold: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    status: 'active',
    suggestedAction: 'Place order for 3 units'
  },
  {
    id: 5,
    type: 'maintenance_due',
    severity: 'low',
    title: 'Upcoming Maintenance: Sigma 35mm f/1.4',
    message: 'Maintenance due in 7 days.',
    equipmentId: 'lens-005',
    equipmentName: 'Sigma 35mm f/1.4',
    lastMaintenance: '2025-11-01',
    nextMaintenance: '2026-02-19',
    daysUntil: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    status: 'active',
    suggestedAction: 'Schedule maintenance'
  },
  {
    id: 6,
    type: 'overdue_return',
    severity: 'medium',
    title: 'Overdue Return: Sennheiser MKH 416',
    message: 'Equipment was due back 3 days ago. Client: SoundWorks Studio',
    equipmentId: 'mic-001',
    equipmentName: 'Sennheiser MKH 416',
    bookingId: 'BK-2026-0038',
    clientName: 'SoundWorks Studio',
    dueDate: '2026-02-09',
    daysOverdue: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    status: 'acknowledged',
    suggestedAction: 'Follow up with client'
  }
]

const ALERT_TYPES = {
  low_stock: { label: 'Low Stock', icon: Package, color: 'orange' },
  maintenance_due: { label: 'Maintenance', icon: Wrench, color: 'blue' },
  overdue_return: { label: 'Overdue', icon: Clock, color: 'red' }
}

const SEVERITY_COLORS = {
  high: 'red',
  medium: 'orange',
  low: 'yellow'
}

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState(generateMockAlerts())
  const [filter, setFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [expandedAlert, setExpandedAlert] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    lowStock: true,
    lowStockThreshold: 3,
    maintenanceDue: true,
    maintenanceAdvanceDays: 7,
    overdueReturns: true,
    emailNotifications: true,
    pushNotifications: false,
    dailyDigest: true
  })

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.type !== filter) return false
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false
    return true
  })

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length
  const lowStockCount = alerts.filter(a => a.type === 'low_stock' && a.status === 'active').length
  const maintenanceCount = alerts.filter(a => a.type === 'maintenance_due' && a.status === 'active').length
  const overdueCount = alerts.filter(a => a.type === 'overdue_return' && a.status === 'active').length

  const handleAcknowledge = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ))
  }

  const handleResolve = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ))
  }

  const handleDismiss = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-base-900">Inventory Alerts</h2>
          <p className="text-base-500 mt-1">Monitor low stock, maintenance, and overdue returns</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            <span className="relative">
              Notifications
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-500">Overdue Returns</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-500">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-500">Maintenance Due</p>
              <p className="text-2xl font-bold text-blue-600">{maintenanceCount}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-base-500">Total Active</p>
              <p className="text-2xl font-bold text-green-600">{activeAlertsCount}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-base-400" />
          <span className="text-sm text-base-500">Filter:</span>
        </div>
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'low_stock', label: 'Low Stock' },
            { id: 'maintenance_due', label: 'Maintenance' },
            { id: 'overdue_return', label: 'Overdue' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-white border border-base-200 text-base-600 hover:bg-base-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-base-200" />
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Severity' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSeverityFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                severityFilter === s.id
                  ? 'bg-red-100 text-red-700'
                  : 'bg-white border border-base-200 text-base-600 hover:bg-base-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-base-900">All Clear!</h3>
            <p className="text-base-500">No alerts match your current filters.</p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const typeConfig = ALERT_TYPES[alert.type]
            const TypeIcon = typeConfig.icon
            const isExpanded = expandedAlert === alert.id
            const severityColor = SEVERITY_COLORS[alert.severity]

            return (
              <Card
                key={alert.id}
                className={`overflow-hidden transition-all ${
                  alert.status === 'resolved' ? 'opacity-60' : ''
                } ${isExpanded ? 'ring-2 ring-brand-500' : ''}`}
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-${typeConfig.color}-100`}>
                      <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-600`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-base-900">{alert.title}</h4>
                          <p className="text-sm text-base-500 mt-1">{alert.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={severityColor}>
                            {alert.severity}
                          </Badge>
                          <Badge variant={alert.status === 'active' ? 'default' : 'secondary'}>
                            {alert.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-base-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                        {alert.equipmentName && (
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {alert.equipmentName}
                          </span>
                        )}
                        {alert.clientName && (
                          <span>Client: {alert.clientName}</span>
                        )}
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <div className="text-base-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-base-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Alert-specific details */}
                      <div>
                        <h5 className="text-sm font-semibold text-base-900 mb-3">Details</h5>
                        <div className="space-y-2 text-sm">
                          {alert.type === 'low_stock' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-base-500">Current Stock:</span>
                                <span className="font-medium">{alert.currentStock} units</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-base-500">Reorder Threshold:</span>
                                <span className="font-medium">{alert.threshold} units</span>
                              </div>
                            </>
                          )}
                          {alert.type === 'maintenance_due' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-base-500">Last Maintenance:</span>
                                <span className="font-medium">{alert.lastMaintenance}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-base-500">Next Due:</span>
                                <span className="font-medium">{alert.nextMaintenance}</span>
                              </div>
                              {alert.daysOverdue && (
                                <div className="flex justify-between text-red-600">
                                  <span>Days Overdue:</span>
                                  <span className="font-bold">{alert.daysOverdue} days</span>
                                </div>
                              )}
                              {alert.daysUntil && (
                                <div className="flex justify-between text-orange-600">
                                  <span>Days Until Due:</span>
                                  <span className="font-bold">{alert.daysUntil} days</span>
                                </div>
                              )}
                            </>
                          )}
                          {alert.type === 'overdue_return' && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-base-500">Booking ID:</span>
                                <span className="font-medium">{alert.bookingId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-base-500">Due Date:</span>
                                <span className="font-medium">{alert.dueDate}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Days Overdue:</span>
                                <span className="font-bold">{alert.daysOverdue} days</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Suggested Action */}
                      <div>
                        <h5 className="text-sm font-semibold text-base-900 mb-3">Suggested Action</h5>
                        <div className="bg-brand-50 rounded-lg p-3 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-brand-700">{alert.suggestedAction}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-base-200">
                      {alert.status === 'active' && (
                        <Button variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                          Acknowledge
                        </Button>
                      )}
                      {alert.status !== 'resolved' && (
                        <Button onClick={() => handleResolve(alert.id)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Resolved
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => handleDismiss(alert.id)}>
                        <X className="w-4 h-4 mr-2" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alert Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Low Stock Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-base-900">Low Stock Alerts</h4>
                  <p className="text-sm text-base-500">Get notified when inventory is running low</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.lowStock}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStock: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-base-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                </label>
              </div>
              {notificationSettings.lowStock && (
                <div className="pl-4 border-l-2 border-base-200">
                  <label className="text-sm text-base-700">Alert when stock falls below:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={notificationSettings.lowStockThreshold}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockThreshold: parseInt(e.target.value) || 1 })}
                    className="input-field w-24 mt-1"
                  />
                  <span className="text-sm text-base-500 ml-2">units</span>
                </div>
              )}
            </div>

            {/* Maintenance Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-base-900">Maintenance Alerts</h4>
                  <p className="text-sm text-base-500">Get notified about upcoming maintenance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.maintenanceDue}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, maintenanceDue: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-base-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
                </label>
              </div>
              {notificationSettings.maintenanceDue && (
                <div className="pl-4 border-l-2 border-base-200">
                  <label className="text-sm text-base-700">Alert days before due date:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={notificationSettings.maintenanceAdvanceDays}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, maintenanceAdvanceDays: parseInt(e.target.value) || 7 })}
                    className="input-field w-24 mt-1"
                  />
                  <span className="text-sm text-base-500 ml-2">days</span>
                </div>
              )}
            </div>

            {/* Overdue Settings */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-base-900">Overdue Return Alerts</h4>
                <p className="text-sm text-base-500">Get notified when equipment is not returned on time</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.overdueReturns}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, overdueReturns: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-base-200 peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
              </label>
            </div>

            {/* Notification Channels */}
            <div className="border-t border-base-200 pt-4">
              <h4 className="font-medium text-base-900 mb-3">Notification Channels</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-base-300 focus:ring-brand-500"
                  />
                  <span className="text-sm text-base-700">Email notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-base-300 focus:ring-brand-500"
                  />
                  <span className="text-sm text-base-700">Push notifications</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.dailyDigest}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, dailyDigest: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded border-base-300 focus:ring-brand-500"
                  />
                  <span className="text-sm text-base-700">Daily digest email</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setSettingsOpen(false)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

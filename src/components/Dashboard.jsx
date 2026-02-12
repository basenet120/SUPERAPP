import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { useDashboardStats, useRecentActivity, useBookings } from '../hooks/useQueries'
import { Badge } from './ui/Badge'
import { useState, useEffect } from 'react'

function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activities, isLoading: activitiesLoading } = useRecentActivity(10)
  const { data: bookings, isLoading: bookingsLoading } = useBookings({ 
    status: 'confirmed,pending', 
    limit: 5,
    sort: 'startDate'
  })

  // Get user's first name or default
  const userName = 'Alon' // Will come from auth context

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Monthly Revenue',
      value: stats?.monthlyRevenue || 0,
      change: stats?.revenueChange || '+0%',
      trend: stats?.revenueTrend || 'up',
      icon: DollarSign,
      subtitle: 'vs last month',
      iconBg: 'bg-brand-50',
      iconColor: 'text-brand-600',
      format: (v) => `$${Number(v).toLocaleString()}`
    },
    {
      title: 'Active Bookings',
      value: stats?.activeBookings || 0,
      change: stats?.bookingChange || '+0',
      trend: stats?.bookingTrend || 'up',
      icon: Calendar,
      subtitle: 'this week',
      iconBg: 'bg-accent-50',
      iconColor: 'text-accent-600',
      format: (v) => v
    },
    {
      title: 'New Leads',
      value: stats?.newLeads || 0,
      change: stats?.leadsChange || '-0',
      trend: stats?.leadsTrend || 'down',
      icon: Users,
      subtitle: 'vs last week',
      iconBg: 'bg-warning-50',
      iconColor: 'text-warning-600',
      format: (v) => v
    },
    {
      title: 'Equipment Util',
      value: stats?.equipmentUtilization || 0,
      change: stats?.utilizationChange || '+0%',
      trend: stats?.utilizationTrend || 'up',
      icon: Package,
      subtitle: 'studio avg',
      iconBg: 'bg-success-50',
      iconColor: 'text-success-600',
      format: (v) => `${v}%`
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="page-title">{getGreeting()}, {userName}</h1>
        <p className="page-subtitle">Here's what's happening at Base today.</p>
      </div>
      
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Feed */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-primary-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                <h3 className="section-title mb-0">Recent Activity</h3>
              </div>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                View all
              </button>
            </div>
            <div className="p-5">
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : activities?.length === 0 ? (
                <div className="text-center py-8 text-primary-500">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {activities?.map((activity) => (
                    <ActivityItem 
                      key={activity.id}
                      type={activity.type}
                      title={activity.title}
                      description={activity.description}
                      time={activity.createdAt}
                      status={activity.status}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Upcoming Bookings */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-primary-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                <h3 className="section-title mb-0">Upcoming Bookings</h3>
              </div>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                View calendar
              </button>
            </div>
            <div className="p-5">
              {bookingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : bookings?.length === 0 ? (
                <div className="text-center py-8 text-primary-500">
                  No upcoming bookings
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings?.map((booking) => (
                    <BookingRow 
                      key={booking.id}
                      client={booking.clientName}
                      project={booking.projectName}
                      date={format(new Date(booking.startDate), 'MMM d')}
                      time={`${format(new Date(booking.startDate), 'h:mm a')} - ${format(new Date(booking.endDate), 'h:mm a')}`}
                      status={booking.status}
                      amount={`$${Number(booking.totalAmount).toLocaleString()}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="p-5 border-b border-primary-100">
              <h3 className="section-title mb-0">Quick Actions</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <QuickActionButton 
                  label="New Booking" 
                  icon={Calendar}
                  color="bg-brand-600 hover:bg-brand-700"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'bookings' }))}
                />
                <QuickActionButton 
                  label="Create Invoice" 
                  icon={FileText}
                  color="bg-accent-600 hover:bg-accent-700"
                  onClick={() => toast.info('Invoicing coming soon!')}
                />
                <QuickActionButton 
                  label="Add Contact" 
                  icon={Users}
                  color="bg-primary-700 hover:bg-primary-800"
                  onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'crm' }))}
                />
                <QuickActionButton 
                  label="View Equipment" 
                  icon={Package}
                  color="bg-primary-700 hover:bg-primary-800"
                  onClick={() => toast.info('Equipment module coming soon!')}
                />
              </div>
            </div>
          </div>
          
          {/* Tasks */}
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-primary-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                <h3 className="section-title mb-0">Tasks</h3>
              </div>
              <span className="text-xs font-medium text-primary-500 bg-primary-100 px-2 py-1 rounded-full">
                {stats?.completedTasks || 0} of {stats?.totalTasks || 0}
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {stats?.tasks?.slice(0, 5).map((task) => (
                  <TaskItem 
                    key={task.id} 
                    text={task.text} 
                    completed={task.completed} 
                  />
                )) || (
                  <div className="text-center py-4 text-primary-500 text-sm">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Pipeline Overview */}
          <div className="card">
            <div className="p-5 border-b border-primary-100">
              <h3 className="section-title mb-0">Sales Pipeline</h3>
            </div>
            <div className="p-5 space-y-4">
              {stats?.pipeline?.map((stage) => (
                <PipelineStage 
                  key={stage.name}
                  stage={stage.name}
                  count={stage.count}
                  value={stage.value}
                  color={stage.color}
                  total={stats.pipelineTotal || 1}
                />
              )) || (
                <div className="text-center py-4 text-primary-500 text-sm">
                  No pipeline data
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, trend, icon: Icon, subtitle, iconBg, iconColor, format }) {
  const isPositive = trend === 'up'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] font-medium text-primary-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary-900 tracking-tight font-tabular">
            {format ? format(value) : value}
          </p>
        </div>
        <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
          <TrendIcon className="w-4 h-4" />
          {change}
        </span>
        <span className="text-sm text-primary-400">{subtitle}</span>
      </div>
    </div>
  )
}

function ActivityItem({ type, title, description, time, status }) {
  const statusIcons = {
    confirmed: <CheckCircle className="w-5 h-5 text-success-500" strokeWidth={1.5} />,
    success: <CheckCircle className="w-5 h-5 text-success-500" strokeWidth={1.5} />,
    completed: <CheckCircle className="w-5 h-5 text-success-500" strokeWidth={1.5} />,
    pending: <Clock className="w-5 h-5 text-warning-500" strokeWidth={1.5} />,
    warning: <AlertCircle className="w-5 h-5 text-danger-500" strokeWidth={1.5} />,
    error: <AlertCircle className="w-5 h-5 text-danger-500" strokeWidth={1.5} />,
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
  
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors group cursor-pointer">
      <div className="mt-0.5 flex-shrink-0">
        {statusIcons[status] || statusIcons.pending}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary-900 group-hover:text-brand-600 transition-colors">{title}</p>
        <p className="text-sm text-primary-500 truncate">{description}</p>
      </div>
      <span className="text-xs text-primary-400 whitespace-nowrap flex-shrink-0">
        {timeAgo(time)}
      </span>
    </div>
  )
}

function BookingRow({ client, project, date, time, status, amount }) {
  const statusBadge = status === 'confirmed' 
    ? <Badge variant="success">Confirmed</Badge>
    : <Badge variant="warning">Pending</Badge>

  return (
    <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100 hover:border-brand-200 transition-colors group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
          {client?.[0] || '?'}
        </div>
        <div>
          <p className="font-semibold text-primary-900 group-hover:text-brand-600 transition-colors">{client}</p>
          <p className="text-sm text-primary-500">{project}</p>
          <p className="text-xs text-primary-400 mt-0.5">{date} • {time}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-primary-900 font-tabular">{amount}</p>
        <div className="mt-1">{statusBadge}</div>
      </div>
    </div>
  )
}

function QuickActionButton({ label, icon: Icon, color, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${color}`}
    >
      <Icon className="w-5 h-5" strokeWidth={1.5} />
      {label}
    </button>
  )
}

function TaskItem({ text, completed }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${completed ? 'bg-brand-600 border-brand-600' : 'border-primary-300 hover:border-brand-400'}`}>
        {completed && <CheckCircle className="w-3.5 h-3.5 text-white" strokeWidth={2} />}
      </div>
      <span className={`text-sm transition-colors ${completed ? 'text-primary-400 line-through' : 'text-primary-700 group-hover:text-primary-900'}`}>
        {text}
      </span>
    </div>
  )
}

function PipelineStage({ stage, count, value, color, total }) {
  const percentage = Math.round((count / total) * 100)
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-semibold text-primary-700">{stage}</span>
        <div className="flex items-center gap-2">
          <span className="text-primary-500">{count} deals</span>
          <span className="font-semibold text-primary-900">${Number(value).toLocaleString()}</span>
        </div>
      </div>
      <div className="h-2.5 bg-primary-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default Dashboard

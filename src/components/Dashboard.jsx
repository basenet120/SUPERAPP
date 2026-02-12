import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Package,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Plus,
  FileText,
  Video
} from 'lucide-react'
import { Badge } from './ui/Badge'

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="page-title">Good morning, Alon</h1>
        <p className="page-subtitle">Here's what's happening at Base today.</p>
      </div>
      
      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          title="Monthly Revenue"
          value="$24,500"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          subtitle="vs last month"
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
        />
        <StatCard 
          title="Active Bookings"
          value="8"
          change="+2"
          trend="up"
          icon={Calendar}
          subtitle="this week"
          iconBg="bg-accent-50"
          iconColor="text-accent-600"
        />
        <StatCard 
          title="New Leads"
          value="12"
          change="-3"
          trend="down"
          icon={Users}
          subtitle="vs last week"
          iconBg="bg-warning-50"
          iconColor="text-warning-600"
        />
        <StatCard 
          title="Equipment Util"
          value="78%"
          change="+5%"
          trend="up"
          icon={Package}
          subtitle="studio avg"
          iconBg="bg-success-50"
          iconColor="text-success-600"
        />
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
              <div className="space-y-3">
                <ActivityItem 
                  type="booking"
                  title="New studio booking confirmed"
                  description="Nike Production - Feb 15-16, 2024"
                  time="2 hours ago"
                  status="confirmed"
                />
                <ActivityItem 
                  type="invoice"
                  title="Invoice #1042 paid"
                  description="HBO Documentary Project - $8,500"
                  time="4 hours ago"
                  status="success"
                />
                <ActivityItem 
                  type="lead"
                  title="New lead from website"
                  description="Apple Event Production - inquiry received"
                  time="6 hours ago"
                  status="pending"
                />
                <ActivityItem 
                  type="equipment"
                  title="Equipment maintenance due"
                  description="Drone fleet - 3 units need inspection"
                  time="1 day ago"
                  status="warning"
                />
              </div>
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
              <div className="space-y-3">
                <BookingRow 
                  client="Netflix"
                  project="Documentary Interview"
                  date="Today"
                  time="2:00 PM - 6:00 PM"
                  status="confirmed"
                  amount="$2,400"
                />
                <BookingRow 
                  client="Spotify"
                  project="Podcast Recording"
                  date="Tomorrow"
                  time="10:00 AM - 2:00 PM"
                  status="confirmed"
                  amount="$1,800"
                />
                <BookingRow 
                  client="Meta"
                  project="Product Demo Video"
                  date="Feb 14"
                  time="9:00 AM - 5:00 PM"
                  status="pending"
                  amount="$4,200"
                />
              </div>
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
                />
                <QuickActionButton 
                  label="Create Invoice" 
                  icon={FileText}
                  color="bg-accent-600 hover:bg-accent-700"
                />
                <QuickActionButton 
                  label="Add Contact" 
                  icon={Users}
                  color="bg-primary-700 hover:bg-primary-800"
                />
                <QuickActionButton 
                  label="Log Expense" 
                  icon={DollarSign}
                  color="bg-primary-700 hover:bg-primary-800"
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
              <span className="text-xs font-medium text-primary-500 bg-primary-100 px-2 py-1 rounded-full">3 of 8</span>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <TaskItem text="Send quote to Apple" completed={false} />
                <TaskItem text="Review drone maintenance logs" completed={false} />
                <TaskItem text="Invoice Netflix project" completed={true} />
                <TaskItem text="Update equipment availability" completed={true} />
                <TaskItem text="Follow up with Spotify lead" completed={true} />
              </div>
            </div>
          </div>
          
          {/* Pipeline Overview */}
          <div className="card">
            <div className="p-5 border-b border-primary-100">
              <h3 className="section-title mb-0">Sales Pipeline</h3>
            </div>
            <div className="p-5 space-y-4">
              <PipelineStage 
                stage="Qualified"
                count={4}
                value="$42,000"
                color="bg-brand-500"
                total={7}
              />
              <PipelineStage 
                stage="Proposal Sent"
                count={2}
                value="$28,500"
                color="bg-accent-500"
                total={7}
              />
              <PipelineStage 
                stage="Negotiation"
                count={1}
                value="$15,000"
                color="bg-warning-500"
                total={7}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, trend, icon: Icon, subtitle, iconBg, iconColor }) {
  const isPositive = trend === 'up'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] font-medium text-primary-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-primary-900 tracking-tight font-tabular">{value}</p>
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
    pending: <Clock className="w-5 h-5 text-warning-500" strokeWidth={1.5} />,
    warning: <AlertCircle className="w-5 h-5 text-danger-500" strokeWidth={1.5} />,
  }

  const typeIcons = {
    booking: <Calendar className="w-4 h-4" />,
    invoice: <DollarSign className="w-4 h-4" />,
    lead: <Users className="w-4 h-4" />,
    equipment: <Package className="w-4 h-4" />,
  }
  
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-primary-50 rounded-lg transition-colors group cursor-pointer">
      <div className="mt-0.5 flex-shrink-0">
        {statusIcons[status]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary-900 group-hover:text-brand-600 transition-colors">{title}</p>
        <p className="text-sm text-primary-500 truncate">{description}</p>
      </div>
      <span className="text-xs text-primary-400 whitespace-nowrap flex-shrink-0">{time}</span>
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
          {client[0]}
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

function QuickActionButton({ label, icon: Icon, color }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] ${color}`}>
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
          <span className="font-semibold text-primary-900">{value}</span>
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

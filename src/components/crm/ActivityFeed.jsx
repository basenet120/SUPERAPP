import { useState } from 'react'
import { 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react'

const activityTypes = {
  call: { icon: Phone, color: 'bg-blue-100 text-blue-600', label: 'Call' },
  email: { icon: Mail, color: 'bg-purple-100 text-purple-600', label: 'Email' },
  meeting: { icon: Calendar, color: 'bg-green-100 text-green-600', label: 'Meeting' },
  note: { icon: FileText, color: 'bg-amber-100 text-amber-600', label: 'Note' },
  task: { icon: CheckCircle, color: 'bg-teal-100 text-teal-600', label: 'Task' },
}

const sampleActivities = [
  {
    id: 1,
    type: 'call',
    title: 'Initial consultation call',
    description: 'Discussed project requirements and budget. Client is interested in full production package.',
    date: '2024-02-10',
    time: '2:30 PM',
    user: 'Alon',
    duration: '45 min'
  },
  {
    id: 2,
    type: 'email',
    title: 'Sent proposal',
    description: 'Emailed detailed proposal with pricing breakdown and timeline.',
    date: '2024-02-09',
    time: '11:15 AM',
    user: 'Abby',
  },
  {
    id: 3,
    type: 'meeting',
    title: 'Studio tour',
    description: 'Showed client around the facility. They were impressed with the lighting setup.',
    date: '2024-02-08',
    time: '10:00 AM',
    user: 'Eyal',
    duration: '1 hour'
  },
  {
    id: 4,
    type: 'note',
    title: 'Follow-up required',
    description: 'Client mentioned they need to get budget approval from their marketing director.',
    date: '2024-02-07',
    time: '4:45 PM',
    user: 'Phil',
  },
  {
    id: 5,
    type: 'task',
    title: 'Prepare contract',
    description: 'Draft production agreement with standard terms.',
    date: '2024-02-06',
    time: '9:00 AM',
    user: 'Alon',
    completed: true
  },
]

function ActivityFeed({ contactId }) {
  const [activities] = useState(sampleActivities)
  const [filter, setFilter] = useState('all')

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter)

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {['all', 'call', 'email', 'meeting', 'note', 'task'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === type
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => {
          const config = activityTypes[activity.type]
          const Icon = config.icon
          
          return (
            <div key={activity.id} className="flex gap-4 group">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">{activity.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{activity.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.date} at {activity.time}
                      </span>
                      <span>by {activity.user}</span>
                      {activity.duration && (
                        <span>• {activity.duration}</span>
                      )}
                    </div>
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredActivities.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <p>No activities found</p>
          </div>
        )}
      </div>

      {/* Add activity button */}
      <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors">
        + Log Activity
      </button>
    </div>
  )
}

export default ActivityFeed
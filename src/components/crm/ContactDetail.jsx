import { useState } from 'react'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Tag, 
  Edit2, 
  Calendar,
  Clock,
  PhoneCall,
  Mail as MailIcon,
  MessageSquare,
  Video,
  FileText,
  User,
  Plus
} from 'lucide-react'
import ActivityFeed from './ActivityFeed'

const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-base-100 text-base-600',
  lead: 'bg-amber-100 text-amber-700',
}

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  lead: 'Lead',
}

function ContactDetail({ contact, activities, onBack, onEdit, onAddActivity, getContactById }) {
  const [activeTab, setActiveTab] = useState('activity')

  const tabs = [
    { id: 'activity', label: 'Activity', count: activities.length },
    { id: 'info', label: 'Details' },
  ]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-base-600 hover:text-base-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to contacts
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-base-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center font-semibold text-2xl flex-shrink-0">
            {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-base-900 mb-1">{contact.name}</h1>
                <p className="text-base-500">{contact.role} at {contact.company}</p>
              </div>
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[contact.status]}`}>
                  {statusLabels[contact.status]}
                </span>
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-base-300 rounded-lg text-sm font-medium text-base-700 hover:bg-base-50 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-base-500" />
                </div>
                <div>
                  <p className="text-xs text-base-500">Email</p>
                  <a href={`mailto:${contact.email}`} className="text-sm font-medium text-brand-600 hover:text-brand-700 truncate block max-w-[150px]">
                    {contact.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-base-500" />
                </div>
                <div>
                  <p className="text-xs text-base-500">Phone</p>
                  <a href={`tel:${contact.phone}`} className="text-sm font-medium text-base-900">
                    {contact.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-base-500" />
                </div>
                <div>
                  <p className="text-xs text-base-500">Company</p>
                  <p className="text-sm font-medium text-base-900">{contact.company}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-base-500" />
                </div>
                <div>
                  <p className="text-xs text-base-500">Last Contact</p>
                  <p className="text-sm font-medium text-base-900">{contact.lastContact}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-base-100">
              <Tag className="w-4 h-4 text-base-400" />
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-brand-50 text-brand-700 text-sm rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-base-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                         ${activeTab === tab.id 
                           ? 'border-brand-600 text-brand-700' 
                           : 'border-transparent text-base-600 hover:text-base-900 hover:border-base-300'}`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="px-2 py-0.5 bg-base-100 text-base-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'activity' && (
          <ActivityFeed
            activities={activities}
            contactId={contact.id}
            onAddActivity={onAddActivity}
          />
        )}

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl border border-base-200 p-6">
            <h3 className="text-lg font-semibold text-base-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Full Name</label>
                <p className="text-base-900">{contact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Email Address</label>
                <p className="text-base-900">{contact.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Phone Number</label>
                <p className="text-base-900">{contact.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Company</label>
                <p className="text-base-900">{contact.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Job Title</label>
                <p className="text-base-900">{contact.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Status</label>
                <p className="text-base-900 capitalize">{contact.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-base-100 text-base-700 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-500 mb-1">Last Contact Date</label>
                <p className="text-base-900">{contact.lastContact}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactDetail

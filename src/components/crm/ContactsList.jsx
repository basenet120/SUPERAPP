import { useState } from 'react'
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Phone, 
  Building2, 
  Tag,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import ContactDetail from './ContactDetail'
import ContactForm from './ContactForm'

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

function ContactsList({ 
  contacts, 
  companies, 
  activities, 
  onAddContact, 
  onUpdateContact, 
  onDeleteContact,
  onAddActivity,
  getContactById 
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [selectedContact, setSelectedContact] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(null)

  // Get all unique tags
  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
    const matchesTag = tagFilter === 'all' || (contact.tags && contact.tags.includes(tagFilter))
    
    return matchesSearch && matchesStatus && matchesTag
  })

  const handleAddClick = () => {
    setEditingContact(null)
    setShowForm(true)
  }

  const handleEditClick = (contact, e) => {
    e.stopPropagation()
    setEditingContact(contact)
    setShowForm(true)
    setDropdownOpen(null)
  }

  const handleDeleteClick = (contactId, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this contact?')) {
      onDeleteContact(contactId)
    }
    setDropdownOpen(null)
  }

  const handleFormSubmit = (contactData) => {
    if (editingContact) {
      onUpdateContact({ ...contactData, id: editingContact.id })
    } else {
      onAddContact(contactData)
    }
    setShowForm(false)
    setEditingContact(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingContact(null)
  }

  const toggleDropdown = (contactId, e) => {
    e.stopPropagation()
    setDropdownOpen(dropdownOpen === contactId ? null : contactId)
  }

  if (selectedContact) {
    return (
      <ContactDetail
        contact={selectedContact}
        activities={activities.filter(a => a.contactId === selectedContact.id)}
        onBack={() => setSelectedContact(null)}
        onEdit={() => {
          setEditingContact(selectedContact)
          setShowForm(true)
        }}
        onAddActivity={onAddActivity}
        getContactById={getContactById}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>

            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3 py-2 border border-base-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Results count */}
      <div className="text-sm text-base-500">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="bg-white rounded-xl border border-base-200 p-5 hover:shadow-md hover:border-brand-200 transition-all cursor-pointer group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center font-semibold text-lg">
                {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="relative">
                <button
                  onClick={(e) => toggleDropdown(contact.id, e)}
                  className="p-1.5 text-base-400 hover:text-base-600 hover:bg-base-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {dropdownOpen === contact.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setDropdownOpen(null)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-base-200 py-1 z-20">
                      <button
                        onClick={(e) => handleEditClick(contact, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-base-700 hover:bg-base-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(contact.id, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info */}
            <h3 className="font-semibold text-base-900 mb-1 truncate">{contact.name}</h3>
            <p className="text-sm text-base-500 mb-3">{contact.role}</p>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-base-600">
                <Building2 className="w-4 h-4 text-base-400 flex-shrink-0" />
                <span className="truncate">{contact.company}</span>
              </div>
              <div className="flex items-center gap-2 text-base-600">
                <Mail className="w-4 h-4 text-base-400 flex-shrink-0" />
                <span className="truncate">{contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-base-600">
                <Phone className="w-4 h-4 text-base-400 flex-shrink-0" />
                <span>{contact.phone}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-100">
              <div className="flex flex-wrap gap-1">
                {contact.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-base-100 text-base-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {contact.tags.length > 2 && (
                  <span className="px-2 py-0.5 bg-base-100 text-base-600 text-xs rounded-full">
                    +{contact.tags.length - 2}
                  </span>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[contact.status]}`}>
                {statusLabels[contact.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-base-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-base-400" />
          </div>
          <h3 className="text-lg font-medium text-base-900 mb-1">No contacts found</h3>
          <p className="text-base-500 mb-4">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
              setTagFilter('all')
            }}
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Contact Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <ContactForm
              contact={editingContact}
              companies={companies}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactsList

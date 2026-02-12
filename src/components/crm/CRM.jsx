import { useState } from 'react'
import { Users, Building2, BarChart3 } from 'lucide-react'
import ContactsList from './ContactsList'
import CompaniesList from './CompaniesList'
import Pipeline from './Pipeline'

const tabs = [
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'leads', label: 'Pipeline', icon: BarChart3 },
]

// Sample data
const sampleContacts = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah@nike.com', phone: '+1 (555) 123-4567', company: 'Nike', role: 'Production Manager', tags: ['VIP', 'Enterprise'], status: 'active', lastContact: '2024-02-10' },
  { id: 2, name: 'Michael Chen', email: 'm.chen@apple.com', phone: '+1 (555) 234-5678', company: 'Apple', role: 'Creative Director', tags: ['Enterprise', 'Referral'], status: 'active', lastContact: '2024-02-09' },
  { id: 3, name: 'Jessica Williams', email: 'jwilliams@spotify.com', phone: '+1 (555) 345-6789', company: 'Spotify', role: 'Audio Engineer', tags: ['Music'], status: 'active', lastContact: '2024-02-08' },
  { id: 4, name: 'David Park', email: 'dpark@netflix.com', phone: '+1 (555) 456-7890', company: 'Netflix', role: 'Video Producer', tags: ['Enterprise', 'TV'], status: 'inactive', lastContact: '2024-01-15' },
  { id: 5, name: 'Emily Rodriguez', email: 'emily.r@meta.com', phone: '+1 (555) 567-8901', company: 'Meta', role: 'Content Lead', tags: ['Social'], status: 'active', lastContact: '2024-02-11' },
  { id: 6, name: 'James Thompson', email: 'jthompson@hbo.com', phone: '+1 (555) 678-9012', company: 'HBO', role: 'Director', tags: ['Enterprise', 'TV'], status: 'active', lastContact: '2024-02-07' },
  { id: 7, name: 'Lisa Kim', email: 'lkim@amazon.com', phone: '+1 (555) 789-0123', company: 'Amazon', role: 'Marketing Manager', tags: ['E-commerce'], status: 'lead', lastContact: '2024-02-05' },
  { id: 8, name: 'Robert Garcia', email: 'rgarcia@google.com', phone: '+1 (555) 890-1234', company: 'Google', role: 'Events Coordinator', tags: ['Tech'], status: 'active', lastContact: '2024-02-10' },
]

const sampleCompanies = [
  { id: 1, name: 'Nike', industry: 'Apparel & Sportswear', size: '10,000+', address: 'One Bowerman Drive, Beaverton, OR', website: 'nike.com' },
  { id: 2, name: 'Apple', industry: 'Technology', size: '10,000+', address: 'One Apple Park Way, Cupertino, CA', website: 'apple.com' },
  { id: 3, name: 'Spotify', industry: 'Music Streaming', size: '5,001-10,000', address: '4 World Trade Center, New York, NY', website: 'spotify.com' },
  { id: 4, name: 'Netflix', industry: 'Entertainment', size: '10,000+', address: '121 Albright Way, Los Gatos, CA', website: 'netflix.com' },
  { id: 5, name: 'Meta', industry: 'Technology', size: '10,000+', address: '1 Hacker Way, Menlo Park, CA', website: 'meta.com' },
  { id: 6, name: 'HBO', industry: 'Entertainment', size: '1,001-5,000', address: '30 Hudson Yards, New York, NY', website: 'hbo.com' },
]

const sampleLeads = [
  { id: 1, contactId: 7, source: 'Website', stage: 'qualified', value: 45000, probability: 70, createdAt: '2024-01-20' },
  { id: 2, contactId: 3, source: 'Referral', stage: 'proposal', value: 28000, probability: 60, createdAt: '2024-01-25' },
  { id: 3, contactId: 1, source: 'Existing Client', stage: 'negotiation', value: 65000, probability: 80, createdAt: '2024-02-01' },
  { id: 4, contactId: 5, source: 'Cold Outreach', stage: 'new', value: 15000, probability: 20, createdAt: '2024-02-08' },
  { id: 5, contactId: 8, source: 'Website', stage: 'proposal', value: 35000, probability: 55, createdAt: '2024-02-05' },
]

const sampleActivities = [
  { id: 1, contactId: 1, type: 'call', subject: 'Follow-up call', description: 'Discussed upcoming campaign requirements', date: '2024-02-10 14:30', user: 'Alon' },
  { id: 2, contactId: 1, type: 'email', subject: 'Quote sent', description: 'Sent production quote for Q1 projects', date: '2024-02-09 10:15', user: 'Alon' },
  { id: 3, contactId: 1, type: 'meeting', subject: 'Initial consultation', description: 'Studio tour and capability presentation', date: '2024-02-05 15:00', user: 'Sarah' },
  { id: 4, contactId: 2, type: 'call', subject: 'Technical discussion', description: 'Went over equipment specifications', date: '2024-02-09 11:00', user: 'Alon' },
  { id: 5, contactId: 2, type: 'email', subject: 'Availability check', description: 'Confirmed studio availability for March', date: '2024-02-08 09:45', user: 'Alon' },
  { id: 6, contactId: 3, type: 'meeting', subject: 'Project kickoff', description: 'Started new podcast series production', date: '2024-02-08 13:00', user: 'Sarah' },
  { id: 7, contactId: 5, type: 'call', subject: 'Introduction call', description: 'First contact, discussed potential collaboration', date: '2024-02-11 10:00', user: 'Alon' },
  { id: 8, contactId: 4, type: 'email', subject: 'Re-engagement', description: 'Checking in after 3 weeks of no contact', date: '2024-02-11 16:20', user: 'Sarah' },
]

function CRM() {
  const [activeTab, setActiveTab] = useState('contacts')
  const [contacts, setContacts] = useState(sampleContacts)
  const [companies, setCompanies] = useState(sampleCompanies)
  const [leads, setLeads] = useState(sampleLeads)
  const [activities, setActivities] = useState(sampleActivities)

  const handleAddContact = (contact) => {
    const newContact = { ...contact, id: Date.now() }
    setContacts([newContact, ...contacts])
  }

  const handleUpdateContact = (updatedContact) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c))
  }

  const handleDeleteContact = (contactId) => {
    setContacts(contacts.filter(c => c.id !== contactId))
  }

  const handleAddCompany = (company) => {
    const newCompany = { ...company, id: Date.now() }
    setCompanies([newCompany, ...companies])
  }

  const handleUpdateCompany = (updatedCompany) => {
    setCompanies(companies.map(c => c.id === updatedCompany.id ? updatedCompany : c))
  }

  const handleDeleteCompany = (companyId) => {
    setCompanies(companies.filter(c => c.id !== companyId))
  }

  const handleAddActivity = (activity) => {
    const newActivity = { ...activity, id: Date.now() }
    setActivities([newActivity, ...activities])
  }

  const handleMoveLead = (leadId, newStage) => {
    setLeads(leads.map(l => l.id === leadId ? { ...l, stage: newStage } : l))
  }

  const getContactById = (id) => contacts.find(c => c.id === id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-900 mb-1">CRM</h1>
          <p className="text-base-500">Manage contacts, companies, and sales pipeline</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-base-200">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                           ${isActive 
                             ? 'border-brand-600 text-brand-700' 
                             : 'border-transparent text-base-600 hover:text-base-900 hover:border-base-300'}`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'contacts' && (
          <ContactsList
            contacts={contacts}
            companies={companies}
            activities={activities}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onAddActivity={handleAddActivity}
            getContactById={getContactById}
          />
        )}
        {activeTab === 'companies' && (
          <CompaniesList
            companies={companies}
            contacts={contacts}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onDeleteCompany={handleDeleteCompany}
          />
        )}
        {activeTab === 'leads' && (
          <Pipeline
            leads={leads}
            contacts={contacts}
            onMoveLead={handleMoveLead}
          />
        )}
      </div>
    </div>
  )
}

export default CRM

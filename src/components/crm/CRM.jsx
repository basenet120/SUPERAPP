import { useState } from 'react'
import { Users, Building2, BarChart3, Loader2 } from 'lucide-react'
import { useContacts, useCompanies, useDeals, useCreateContact, useUpdateContact, useDeleteContact, useCreateCompany, useUpdateCompany, useDeleteCompany, useUpdateDealStage } from '../../hooks/useQueries'
import ContactsList from './ContactsList'
import CompaniesList from './CompaniesList'
import Pipeline from './Pipeline'

const tabs = [
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'leads', label: 'Pipeline', icon: BarChart3 },
]

function CRM() {
  const [activeTab, setActiveTab] = useState('contacts')
  
  // Fetch data from API
  const { data: contacts = [], isLoading: contactsLoading } = useContacts()
  const { data: companies = [], isLoading: companiesLoading } = useCompanies()
  const { data: deals = [], isLoading: dealsLoading } = useDeals()

  // Mutations
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()
  const deleteCompany = useDeleteCompany()
  const updateDealStage = useUpdateDealStage()

  const handleAddContact = (contact) => {
    createContact.mutate(contact)
  }

  const handleUpdateContact = (updatedContact) => {
    updateContact.mutate({ id: updatedContact.id, data: updatedContact })
  }

  const handleDeleteContact = (contactId) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContact.mutate(contactId)
    }
  }

  const handleAddCompany = (company) => {
    createCompany.mutate(company)
  }

  const handleUpdateCompany = (updatedCompany) => {
    updateCompany.mutate({ id: updatedCompany.id, data: updatedCompany })
  }

  const handleDeleteCompany = (companyId) => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteCompany.mutate(companyId)
    }
  }

  const handleMoveLead = (leadId, newStage) => {
    updateDealStage.mutate({ id: leadId, stage: newStage })
  }

  const isLoading = contactsLoading || companiesLoading || dealsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    )
  }

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
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
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
            leads={deals}
            contacts={contacts}
            onMoveLead={handleMoveLead}
          />
        )}
      </div>
    </div>
  )
}

export default CRM

import { useState } from 'react'
import { DollarSign, Users, MoreHorizontal, Plus, Filter } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

const stages = [
  { id: 'new', name: 'New Lead', color: 'bg-slate-500' },
  { id: 'qualified', name: 'Qualified', color: 'bg-brand-500' },
  { id: 'proposal', name: 'Proposal Sent', color: 'bg-accent-500' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-warning-500' },
  { id: 'closed', name: 'Closed Won', color: 'bg-success-500' },
]

const sampleDeals = [
  {
    id: 1,
    company: 'Nike',
    title: 'Campaign Production',
    value: 45000,
    stage: 'negotiation',
    probability: 75,
    contacts: ['Sarah Johnson'],
    lastActivity: '2 days ago',
    expectedClose: '2024-03-15'
  },
  {
    id: 2,
    company: 'Apple',
    title: 'Product Launch Video',
    value: 28000,
    stage: 'proposal',
    probability: 50,
    contacts: ['Michael Chen'],
    lastActivity: '1 week ago',
    expectedClose: '2024-03-01'
  },
  {
    id: 3,
    company: 'Spotify',
    title: 'Studio Sessions',
    value: 18500,
    stage: 'qualified',
    probability: 40,
    contacts: ['Jessica Williams'],
    lastActivity: '3 days ago',
    expectedClose: '2024-02-28'
  },
  {
    id: 4,
    company: 'Netflix',
    title: 'Documentary Series',
    value: 62000,
    stage: 'closed',
    probability: 100,
    contacts: ['David Park'],
    lastActivity: 'Yesterday',
    expectedClose: '2024-02-10'
  },
  {
    id: 5,
    company: 'Meta',
    title: 'Event Coverage',
    value: 15000,
    stage: 'new',
    probability: 20,
    contacts: ['Emily Rodriguez'],
    lastActivity: 'Just now',
    expectedClose: '2024-04-01'
  },
]

function Pipeline() {
  const [deals] = useState(sampleDeals)
  const [selectedStage, setSelectedStage] = useState(null)

  const getStageDeals = (stageId) => deals.filter(deal => deal.stage === stageId)

  const getTotalValue = (stageId) => {
    return getStageDeals(stageId).reduce((sum, deal) => sum + deal.value, 0)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales Pipeline</h2>
          <p className="text-slate-500 mt-1">Track and manage your deals</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageDeals = getStageDeals(stage.id)
          const totalValue = getTotalValue(stage.id)
          
          return (
            <Card key={stage.id} className="text-center">
              <div className={`w-3 h-3 ${stage.color} rounded-full mx-auto mb-2`} />
              <p className="text-sm font-medium text-slate-600">{stage.name}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stageDeals.length}</p>
              <p className="text-xs text-slate-500 mt-1">{formatCurrency(totalValue)}</p>
            </Card>
          )
        })}
      </div>

      {/* Pipeline Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageDeals = getStageDeals(stage.id)
          
          return (
            <div key={stage.id} className="space-y-3">
              {/* Stage Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${stage.color} rounded-full`} />
                  <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                </div>
                <span className="text-sm text-slate-500">{stageDeals.length}</span>
              </div>

              {/* Deals */}
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card 
                    key={deal.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {deal.company}
                      </Badge>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-medium text-slate-900 mb-1">{deal.title}</h4>
                    
                    <div className="flex items-center gap-1 text-lg font-bold text-slate-900 mb-3">
                      <DollarSign className="w-5 h-5" />
                      {deal.value.toLocaleString()}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {deal.contacts.length}
                      </div>
                      <span>{deal.probability}% prob</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Close: {deal.expectedClose}</span>
                        <span className="text-slate-400">{deal.lastActivity}</span>
                      </div>
                    </div>
                  </Card>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipeline Summary */}
      <Card className="bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Pipeline Summary</h3>
            <p className="text-sm text-slate-500">Total pipeline value and forecast</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(deals.reduce((sum, d) => sum + d.value, 0))}
            </p>
            <p className="text-sm text-slate-500">Total pipeline value</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Pipeline
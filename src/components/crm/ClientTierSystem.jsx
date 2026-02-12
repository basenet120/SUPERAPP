import { useState } from 'react'
import { Medal, Crown, Star, Gem, ChevronDown, ChevronUp, Edit2, Save, X, Plus, Trash2 } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog'

const DEFAULT_TIERS = {
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    color: '#CD7F32',
    icon: Medal,
    minSpend: 0,
    discountPercent: 0,
    benefits: [
      'Standard rental rates',
      'Email support',
      '5-day advance booking',
      'Standard delivery fees'
    ],
    perks: {
      prioritySupport: false,
      freeDelivery: false,
      dedicatedRep: false,
      earlyAccess: false,
      customPricing: false
    }
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    color: '#C0C0C0',
    icon: Star,
    minSpend: 5000,
    discountPercent: 5,
    benefits: [
      '5% discount on all rentals',
      'Priority email support',
      '14-day advance booking',
      'Reduced delivery fees'
    ],
    perks: {
      prioritySupport: true,
      freeDelivery: false,
      dedicatedRep: false,
      earlyAccess: false,
      customPricing: false
    }
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    color: '#FFD700',
    icon: Crown,
    minSpend: 20000,
    discountPercent: 10,
    benefits: [
      '10% discount on all rentals',
      'Priority phone & email support',
      '30-day advance booking',
      'Free local delivery',
      'Dedicated account representative'
    ],
    perks: {
      prioritySupport: true,
      freeDelivery: true,
      dedicatedRep: true,
      earlyAccess: true,
      customPricing: false
    }
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    color: '#E5E4E2',
    icon: Gem,
    minSpend: 50000,
    discountPercent: 15,
    benefits: [
      '15% discount on all rentals',
      '24/7 priority support hotline',
      '60-day advance booking',
      'Free delivery & pickup nationwide',
      'Dedicated account team',
      'Custom equipment packages',
      'First access to new equipment'
    ],
    perks: {
      prioritySupport: true,
      freeDelivery: true,
      dedicatedRep: true,
      earlyAccess: true,
      customPricing: true
    }
  }
}

const PERK_LABELS = {
  prioritySupport: 'Priority Support',
  freeDelivery: 'Free Delivery',
  dedicatedRep: 'Dedicated Rep',
  earlyAccess: 'Early Access',
  customPricing: 'Custom Pricing'
}

export default function ClientTierSystem() {
  const [tiers, setTiers] = useState(DEFAULT_TIERS)
  const [editingTier, setEditingTier] = useState(null)
  const [expandedTier, setExpandedTier] = useState('gold')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState(null)

  const handleEdit = (tier) => {
    setEditForm({ ...tier })
    setIsEditDialogOpen(true)
  }

  const handleSave = () => {
    if (editForm) {
      setTiers(prev => ({
        ...prev,
        [editForm.id]: editForm
      }))
      setIsEditDialogOpen(false)
      setEditForm(null)
    }
  }

  const handleBenefitAdd = () => {
    if (editForm) {
      setEditForm({
        ...editForm,
        benefits: [...editForm.benefits, 'New benefit']
      })
    }
  }

  const handleBenefitUpdate = (index, value) => {
    if (editForm) {
      const newBenefits = [...editForm.benefits]
      newBenefits[index] = value
      setEditForm({ ...editForm, benefits: newBenefits })
    }
  }

  const handleBenefitRemove = (index) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        benefits: editForm.benefits.filter((_, i) => i !== index)
      })
    }
  }

  const togglePerk = (perkKey) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        perks: {
          ...editForm.perks,
          [perkKey]: !editForm.perks[perkKey]
        }
      })
    }
  }

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-base-900">Client Tier System</h2>
          <p className="text-base-500 mt-1">Manage loyalty tiers and benefits for your clients</p>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tierOrder.map((tierKey) => {
          const tier = tiers[tierKey]
          const Icon = tier.icon
          const isExpanded = expandedTier === tierKey

          return (
            <Card
              key={tier.id}
              className={`relative overflow-hidden cursor-pointer transition-all duration-300 ${
                isExpanded ? 'ring-2 ring-offset-2' : 'hover:shadow-lg'
              }`}
              style={{
                ringColor: isExpanded ? tier.color : undefined
              }}
              onClick={() => setExpandedTier(isExpanded ? null : tierKey)}
            >
              {/* Header with icon */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${tier.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: tier.color }} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(tier)
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>

                <h3 className="text-lg font-bold text-base-900 mt-3">{tier.name}</h3>
                <p className="text-sm text-base-500">
                  ${tier.minSpend.toLocaleString()}+ annual spend
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <Badge 
                    variant="default"
                    className="text-sm px-3 py-1"
                    style={{ 
                      backgroundColor: `${tier.color}20`,
                      color: tier.color,
                      borderColor: tier.color
                    }}
                  >
                    {tier.discountPercent}% OFF
                  </Badge>
                </div>

                {/* Expand indicator */}
                <div className="flex items-center justify-center mt-4 text-base-400">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-base-200 pt-4">
                  <h4 className="text-sm font-semibold text-base-900 mb-3">Benefits</h4>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-base-600">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: tier.color }}
                        />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-sm font-semibold text-base-900 mt-4 mb-3">Perks</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tier.perks).map(([key, enabled]) => (
                      <Badge
                        key={key}
                        variant={enabled ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {enabled ? '✓' : '✗'} {PERK_LABELS[key]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Client Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-base-900 mb-4">Client Distribution</h3>
        <div className="space-y-4">
          {tierOrder.map((tierKey) => {
            const tier = tiers[tierKey]
            // Mock distribution data
            const percentages = { bronze: 45, silver: 30, gold: 18, platinum: 7 }
            const clientCounts = { bronze: 89, silver: 58, gold: 35, platinum: 14 }

            return (
              <div key={tierKey} className="flex items-center gap-4">
                <div className="w-24 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tier.color }}
                  />
                  <span className="text-sm font-medium text-base-700">{tier.name}</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-base-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentages[tierKey]}%`,
                        backgroundColor: tier.color
                      }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <span className="text-sm font-semibold text-base-900">
                    {clientCounts[tierKey]} clients
                  </span>
                  <span className="text-xs text-base-500 ml-2">
                    ({percentages[tierKey]}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editForm?.name} Tier</DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-6 mt-4">
              {/* Basic Settings */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-base-700">Tier Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-base-700">Min Annual Spend ($)</label>
                    <input
                      type="number"
                      value={editForm.minSpend}
                      onChange={(e) => setEditForm({ ...editForm, minSpend: parseInt(e.target.value) || 0 })}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-base-700">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.discountPercent}
                      onChange={(e) => setEditForm({ ...editForm, discountPercent: parseInt(e.target.value) || 0 })}
                      className="input-field mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-base-700">Tier Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <span className="text-sm text-base-500">{editForm.color}</span>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-base-700">Benefits</label>
                  <Button variant="outline" size="sm" onClick={handleBenefitAdd}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {editForm.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleBenefitUpdate(idx, e.target.value)}
                        className="input-field flex-1 text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBenefitRemove(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perks */}
              <div>
                <label className="text-sm font-medium text-base-700 mb-3 block">Perks</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PERK_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => togglePerk(key)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                        editForm.perks[key]
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-base-200 hover:border-base-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          editForm.perks[key] ? 'bg-green-500 text-white' : 'bg-base-200'
                        }`}
                      >
                        {editForm.perks[key] ? '✓' : ''}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

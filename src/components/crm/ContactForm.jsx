import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'lead', label: 'Lead' },
]

const availableTags = [
  'VIP',
  'Enterprise',
  'Referral',
  'Music',
  'TV',
  'Social',
  'E-commerce',
  'Tech',
  'Startup',
  'Agency',
]

function ContactForm({ contact, companies, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    status: 'active',
    tags: [],
    lastContact: new Date().toISOString().split('T')[0],
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        company: contact.company || '',
        role: contact.role || '',
        status: contact.status || 'active',
        tags: contact.tags || [],
        lastContact: contact.lastContact || new Date().toISOString().split('T')[0],
      })
    }
  }, [contact])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.company.trim()) newErrors.company = 'Company is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleAddNewTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-base-900">
          {contact ? 'Edit Contact' : 'Add New Contact'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-base-400 hover:text-base-600 hover:bg-base-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-base-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., John Smith"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all
                       ${errors.name ? 'border-red-300' : 'border-base-300'}`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-base-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all
                         ${errors.email ? 'border-red-300' : 'border-base-300'}`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-700 mb-1.5">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Company & Role */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-base-700 mb-1.5">
              Company <span className="text-red-500">*</span>
            </label>
            <select
              name="company"
              value={formData.company}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all
                         ${errors.company ? 'border-red-300' : 'border-base-300'}`}
            >
              <option value="">Select company...</option>
              {companies.map(company => (
                <option key={company.id} value={company.name}>{company.name}</option>
              ))}
              <option value="other">Other...</option>
            </select>
            {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-base-700 mb-1.5">Job Title</label>
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="e.g., Marketing Manager"
              className="w-full px-3 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-base-700 mb-1.5">Status</label>
          <div className="flex gap-3">
            {statusOptions.map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors
                           ${formData.status === option.value 
                             ? 'border-brand-500 bg-brand-50 text-brand-700' 
                             : 'border-base-200 hover:border-base-300'}`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={formData.status === option.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-base-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                           ${formData.tags.includes(tag)
                             ? 'bg-brand-100 text-brand-700 border border-brand-200'
                             : 'bg-base-100 text-base-600 border border-base-200 hover:border-base-300'}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add custom tag..."
              className="flex-1 px-3 py-2 border border-base-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
            />
            <button
              type="button"
              onClick={handleAddNewTag}
              className="px-3 py-2 bg-base-100 text-base-700 rounded-lg hover:bg-base-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.filter(tag => !availableTags.includes(tag)).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 text-brand-700 text-sm rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:text-brand-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Last Contact Date */}
        <div>
          <label className="block text-sm font-medium text-base-700 mb-1.5">Last Contact Date</label>
          <input
            type="date"
            name="lastContact"
            value={formData.lastContact}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-base-700 font-medium hover:bg-base-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            {contact ? 'Save Changes' : 'Add Contact'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContactForm

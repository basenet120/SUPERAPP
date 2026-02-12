import { useState } from 'react'
import { Building2, Mail, Phone, MapPin, ExternalLink, MoreHorizontal } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

const sampleCompanies = [
  { 
    id: 1, 
    name: 'Nike', 
    industry: 'Apparel & Sportswear', 
    size: '10,000+', 
    address: 'One Bowerman Drive, Beaverton, OR', 
    website: 'nike.com',
    contacts: 3,
    deals: 2,
    revenue: '$45,000'
  },
  { 
    id: 2, 
    name: 'Apple', 
    industry: 'Technology', 
    size: '10,000+', 
    address: 'One Apple Park Way, Cupertino, CA', 
    website: 'apple.com',
    contacts: 2,
    deals: 1,
    revenue: '$28,000'
  },
  { 
    id: 3, 
    name: 'Spotify', 
    industry: 'Music Streaming', 
    size: '5,001-10,000', 
    address: '4 World Trade Center, New York, NY', 
    website: 'spotify.com',
    contacts: 2,
    deals: 2,
    revenue: '$18,500'
  },
  { 
    id: 4, 
    name: 'Netflix', 
    industry: 'Entertainment', 
    size: '10,000+', 
    address: '121 Albright Way, Los Gatos, CA', 
    website: 'netflix.com',
    contacts: 4,
    deals: 3,
    revenue: '$62,000'
  },
  { 
    id: 5, 
    name: 'Meta', 
    industry: 'Technology', 
    size: '10,000+', 
    address: '1 Hacker Way, Menlo Park, CA', 
    website: 'meta.com',
    contacts: 2,
    deals: 1,
    revenue: '$15,000'
  },
]

function CompaniesList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [companies] = useState(sampleCompanies)

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Companies</h2>
          <p className="text-slate-500 mt-1">Manage your client organizations</p>
        </div>
        <Button variant="primary">
          <Building2 className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="input-field w-48">
          <option>All Industries</option>
          <option>Technology</option>
          <option>Entertainment</option>
          <option>Apparel</option>
        </select>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-brand-100 text-brand-700 rounded-xl flex items-center justify-center text-xl font-bold">
                {company.name[0]}
              </div>
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">{company.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{company.industry}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-slate-600">
                <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                <span className="truncate">{company.address}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <ExternalLink className="w-4 h-4 mr-2 text-slate-400" />
                <span className="text-brand-600">{company.website}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <Badge variant="secondary">{company.size} employees</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{company.contacts}</p>
                <p className="text-xs text-slate-500">Contacts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{company.deals}</p>
                <p className="text-xs text-slate-500">Deals</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-brand-600">{company.revenue}</p>
                <p className="text-xs text-slate-500">Revenue</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CompaniesList
import { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit2, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Package,
  DollarSign,
  User,
  FileText,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from 'lucide-react';
import { SAMPLE_QUOTES, EQUIPMENT_DATA, getDayRate } from './equipmentData';

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const SERVICE_TYPE_ICONS = {
  studio: Calendar,
  equipment: Package,
  both: () => (
    <div className="flex -space-x-1">
      <Calendar className="w-3 h-3" />
      <Package className="w-3 h-3" />
    </div>
  )
};

export default function BookingAdmin() {
  const [quotes, setQuotes] = useState(SAMPLE_QUOTES);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityOverride, setAvailabilityOverride] = useState({});

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort by date (newest first)
  const sortedQuotes = [...filteredQuotes].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleStatusChange = (quoteId, newStatus) => {
    setQuotes(quotes.map(q => 
      q.id === quoteId ? { ...q, status: newStatus } : q
    ));
    if (selectedQuote?.id === quoteId) {
      setSelectedQuote({ ...selectedQuote, status: newStatus });
    }
  };

  const toggleAvailabilityOverride = (quoteId) => {
    setAvailabilityOverride(prev => ({
      ...prev,
      [quoteId]: !prev[quoteId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  // Get equipment details for quote
  const getEquipmentDetails = (quoteEquipment) => {
    return quoteEquipment.map(item => {
      const equipment = EQUIPMENT_DATA.find(e => e.id === item.id);
      if (!equipment) return null;
      return {
        ...equipment,
        ...item,
        dayRate: getDayRate(equipment),
        total: getDayRate(equipment) * item.quantity * item.days
      };
    }).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-base-900">Quote Requests</h3>
          <p className="text-base-500">Manage incoming booking requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-base-100 rounded-lg p-1">
            {['all', 'pending', 'approved', 'declined'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === status 
                    ? 'bg-white text-base-900 shadow-sm' 
                    : 'text-base-500 hover:text-base-700'
                  }
                `}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
        <input
          type="text"
          placeholder="Search by client, company, or quote ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-10 w-full md:w-96"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Quotes', value: quotes.length, color: 'bg-base-100' },
          { label: 'Pending', value: quotes.filter(q => q.status === 'pending').length, color: 'bg-amber-50' },
          { label: 'Approved', value: quotes.filter(q => q.status === 'approved').length, color: 'bg-green-50' },
          { label: 'Revenue (Pending)', value: formatCurrency(quotes.filter(q => q.status === 'pending').reduce((sum, q) => sum + q.total, 0)), color: 'bg-brand-50' },
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-xl p-4 border border-base-200`}>
            <p className="text-sm text-base-500">{stat.label}</p>
            <p className="text-2xl font-bold text-base-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quotes List */}
      <div className="border border-base-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-base-50 border-b border-base-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-base-600 uppercase tracking-wider">Quote ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-base-600 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-base-600 uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-base-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-base-600 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-base-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-base-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {sortedQuotes.map(quote => {
                const StatusIcon = STATUS_CONFIG[quote.status].icon;
                const ServiceIcon = SERVICE_TYPE_ICONS[quote.serviceType];
                
                return (
                  <tr 
                    key={quote.id} 
                    className={`hover:bg-base-50 cursor-pointer transition-colors ${selectedQuote?.id === quote.id ? 'bg-brand-50' : ''}`}
                    onClick={() => setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-base-700">{quote.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-base-900">{quote.clientName}</p>
                        <p className="text-sm text-base-500">{quote.company}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ServiceIcon className="w-4 h-4 text-base-500" />
                        <span className="text-sm text-base-700 capitalize">{quote.serviceType}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-base-700">
                        {formatDate(quote.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-base-900">{formatCurrency(quote.total)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[quote.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG[quote.status].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(quote.id, 'approved');
                          }}
                          disabled={quote.status === 'approved'}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(quote.id, 'declined');
                          }}
                          disabled={quote.status === 'declined'}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Decline"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-base-600 hover:bg-base-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedQuotes.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-base-300 mx-auto mb-4" />
            <p className="text-base-500">No quotes found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Quote Detail View */}
      {selectedQuote && (
        <div className="border border-base-200 rounded-xl overflow-hidden">
          <div className="p-4 bg-base-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h4 className="font-semibold">Quote Details: {selectedQuote.id}</h4>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedQuote.status].color.replace('bg-', 'bg-opacity-20 bg-').replace('text-', 'text-')}`}>
                {STATUS_CONFIG[selectedQuote.status].label}
              </span>
            </div>
            <button
              onClick={() => setSelectedQuote(null)}
              className="text-base-300 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Client Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-brand-600" />
                <h5 className="font-semibold text-base-900">Client Information</h5>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-base-500">Name</span>
                  <span className="font-medium text-base-900">{selectedQuote.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-500">Company</span>
                  <span className="font-medium text-base-900">{selectedQuote.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-500">Email</span>
                  <span className="font-medium text-base-900">{selectedQuote.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-500">Phone</span>
                  <span className="font-medium text-base-900">{selectedQuote.phone}</span>
                </div>
              </div>

              {/* Documents Status */}
              <div className="pt-4 border-t border-base-100">
                <h6 className="font-medium text-base-900 mb-3">Required Documents</h6>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-600">COI Uploaded</span>
                    {selectedQuote.coiUploaded ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                        Missing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-base-600">Contract Signed</span>
                    {selectedQuote.contractSigned ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h5 className="font-semibold text-base-900">Booking Details</h5>
              </div>
              
              {selectedQuote.serviceType !== 'equipment' && selectedQuote.studioDate && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-500">Studio Date</span>
                    <span className="font-medium text-base-900">
                      {new Date(selectedQuote.studioDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-500">Time</span>
                    <span className="font-medium text-base-900">
                      {selectedQuote.studioTime.start} - {selectedQuote.studioTime.end}
                    </span>
                  </div>
                  
                  {/* Availability Override Toggle */}
                  <div className="pt-3 border-t border-base-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-base-700">Availability Override</span>
                        <p className="text-xs text-base-500">Allow conflicting bookings</p>
                      </div>
                      <button
                        onClick={() => toggleAvailabilityOverride(selectedQuote.id)}
                        className={availabilityOverride[selectedQuote.id] ? 'text-brand-600' : 'text-base-400'}
                      >
                        {availabilityOverride[selectedQuote.id] ? (
                          <ToggleRight className="w-10 h-6" />
                        ) : (
                          <ToggleLeft className="w-10 h-6" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment List */}
              {selectedQuote.equipment.length > 0 && (
                <div className="pt-4 border-t border-base-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-base-600" />
                    <h6 className="font-medium text-base-900">Equipment</h6>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getEquipmentDetails(selectedQuote.equipment).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="text-base-900">{item.name}</span>
                          <span className="text-base-500 ml-2">×{item.quantity} × {item.days}d</span>
                          <span className={`text-xs ml-2 ${item.type === 'in_house' ? 'text-green-600' : 'text-brand-600'}`}>
                            ({item.type === 'in_house' ? 'In House' : 'Partner'})
                          </span>
                        </div>
                        <span className="font-medium text-base-900">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Summary */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-brand-600" />
                <h5 className="font-semibold text-base-900">Pricing Summary</h5>
              </div>
              
              <div className="bg-base-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-base-600">Studio</span>
                  <span className="text-base-900">
                    {selectedQuote.serviceType !== 'equipment' 
                      ? formatCurrency(3000) 
                      : '$0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-600">Equipment</span>
                  <span className="text-base-900">{formatCurrency(selectedQuote.subtotal - (selectedQuote.serviceType !== 'equipment' ? 3000 : 0) - selectedQuote.deliveryCost)}</span>
                </div>
                {selectedQuote.deliveryCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-base-600">Delivery</span>
                    <span className="text-base-900">{formatCurrency(selectedQuote.deliveryCost)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-base-600">Subtotal</span>
                  <span className="font-medium text-base-900">{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-base-600">Tax (8.875%)</span>
                  <span className="text-base-900">{formatCurrency(selectedQuote.tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-base-200">
                  <span className="font-semibold text-base-900">Total</span>
                  <span className="text-xl font-bold text-brand-600">{formatCurrency(selectedQuote.total)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-base-200">
                  <span className="text-base-600">
                    Deposit ({selectedQuote.depositType})
                  </span>
                  <span className="font-semibold text-brand-700">
                    {formatCurrency(selectedQuote.total * (selectedQuote.depositType === '50%' ? 0.5 : 1))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedQuote.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStatusChange(selectedQuote.id, 'approved')}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedQuote.id, 'declined')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              )}

              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                View Full Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
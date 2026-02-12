import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, User, Mail, Phone, Building, 
  Check, ChevronRight, Package, FileText, Shield,
  Download, ExternalLink, MessageSquare, X
} from 'lucide-react';
import { EQUIPMENT_DATA, getDayRate } from '../booking/equipmentData';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

// Generate a unique quote ID
const generateQuoteId = () => `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

// Sample quote for demo
const SAMPLE_QUOTE = {
  id: 'Q-2026-001',
  clientName: 'Sarah Johnson',
  company: 'Creative Productions LLC',
  email: 'sarah@creativeprod.com',
  phone: '555-0123',
  createdAt: '2026-02-10T14:30:00Z',
  status: 'pending', // pending, approved, declined, expired
  serviceType: 'both', // studio, equipment, both
  studioDate: '2026-02-28',
  studioTime: { start: '07:00', end: '19:00' },
  equipment: [
    { id: 'light-001', quantity: 2, days: 1, name: 'Aputure 600d Pro' },
    { id: 'cam-001', quantity: 1, days: 1, name: 'Canon R5C' },
    { id: 'grip-001', quantity: 4, days: 1, name: 'C-Stands (Matte Black)' },
  ],
  coiUploaded: true,
  contractSigned: true,
  deliveryCost: 150,
  subtotal: 5100,
  tax: 452.63,
  total: 5552.63,
  depositType: '50%',
  depositAmount: 2776.32,
  notes: 'Please have equipment ready by 6:30 AM. Production is time-sensitive.'
};

export default function ClientPortal() {
  const [view, setView] = useState('quote'); // quote, booking, dashboard
  const [quoteToken, setQuoteToken] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCOIUpload, setShowCOIUpload] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  // Simulate loading quote from URL token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('quote');
    if (token) {
      setQuoteToken(token);
      loadQuote(token);
    }
  }, []);

  const loadQuote = (token) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setQuote(SAMPLE_QUOTE);
      setLoading(false);
    }, 800);
  };

  const handleApprove = () => {
    setQuote({ ...quote, status: 'approved' });
    // Show success message
  };

  const handleDecline = () => {
    setQuote({ ...quote, status: 'declined' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { variant: 'success', label: 'Approved' };
      case 'declined': return { variant: 'danger', label: 'Declined' };
      case 'expired': return { variant: 'neutral', label: 'Expired' };
      default: return { variant: 'warning', label: 'Pending Approval' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Quote View
  const renderQuoteView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-primary-500">Loading your quote...</p>
          </div>
        </div>
      );
    }

    if (!quote) {
      return (
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-primary-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-primary-900 mb-2">Quote Not Found</h2>
          <p className="text-primary-500 mb-6">Please check your quote link or contact your producer.</p>
        </div>
      );
    }

    const status = getStatusBadge(quote.status);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-primary-900">Quote {quote.id}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-primary-500">
                For {quote.clientName} at {quote.company}
              </p>
              <p className="text-sm text-primary-400 mt-1">
                Created {new Date(quote.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-500">Total Amount</p>
              <p className="text-3xl font-bold text-primary-900 font-tabular">
                {formatCurrency(quote.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <div className="bg-white border border-primary-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Service Details</h2>
              
              {quote.studioDate && (
                <div className="flex items-start gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-primary-900">{formatDate(quote.studioDate)}</p>
                    <p className="text-sm text-primary-500">
                      {quote.studioTime.start} - {quote.studioTime.end}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <User className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                <div>
                  <p className="font-medium text-primary-900">{quote.clientName}</p>
                  <p className="text-sm text-primary-500">{quote.company}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                <p className="text-primary-700">{quote.email}</p>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                <p className="text-primary-700">{quote.phone}</p>
              </div>
            </div>

            {/* Equipment */}
            {quote.equipment.length > 0 && (
              <div className="bg-white border border-primary-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Equipment</h2>
                <div className="space-y-3">
                  {quote.equipment.map((item, idx) => {
                    const equipment = EQUIPMENT_DATA.find(e => e.id === item.id);
                    const dayRate = equipment ? getDayRate(equipment) : 0;
                    const itemTotal = dayRate * item.quantity * item.days;
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm font-semibold text-primary-600">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="font-medium text-primary-900">{item.name}</p>
                            <p className="text-xs text-primary-500">
                              {item.days} day{item.days > 1 ? 's' : ''} @ {formatCurrency(dayRate)}/day
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-primary-900 font-tabular">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white border border-primary-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Documents</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-primary-900">Certificate of Insurance</p>
                      <p className="text-xs text-primary-500">Required for all rentals</p>
                    </div>
                  </div>
                  {quote.coiUploaded ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1" />
                        Received
                      </Badge>
                      <button className="text-brand-600 hover:text-brand-700">
                        <Download className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowCOIUpload(true)}
                      className="btn-secondary text-sm"
                    >
                      Upload
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-primary-900">Rental Agreement</p>
                      <p className="text-xs text-primary-500">Please review and sign</p>
                    </div>
                  </div>
                  {quote.contractSigned ? (
                    <Badge variant="success">
                      <Check className="w-3 h-3 mr-1" />
                      Signed
                    </Badge>
                  ) : (
                    <button 
                      onClick={() => setShowContract(true)}
                      className="btn-primary text-sm"
                    >
                      Review & Sign
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {quote.notes && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-brand-900 mb-2">Notes</h2>
                <p className="text-brand-700">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Pricing & Actions */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <div className="bg-white border border-primary-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Pricing</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-primary-500">Subtotal</span>
                  <span className="text-primary-900 font-tabular">{formatCurrency(quote.subtotal)}</span>
                </div>
                
                {quote.deliveryCost > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-primary-500">Delivery</span>
                    <span className="text-primary-900 font-tabular">{formatCurrency(quote.deliveryCost)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-primary-500">Tax (8.875%)</span>
                  <span className="text-primary-900 font-tabular">{formatCurrency(quote.tax)}</span>
                </div>
                
                <div className="border-t border-primary-200 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-900">Total</span>
                    <span className="font-bold text-xl text-primary-900 font-tabular">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">
                  <span className="font-medium">Deposit Required:</span> {quote.depositType} ({formatCurrency(quote.depositAmount)})
                </p>
              </div>
            </div>

            {/* Actions */}
            {quote.status === 'pending' && (
              <div className="bg-white border border-primary-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-primary-900 mb-4">Action Required</h2>
                
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    Approve Quote
                  </button>
                  
                  <button
                    onClick={handleDecline}
                    className="btn-secondary w-full text-danger-600 border-danger-200 hover:bg-danger-50"
                  >
                    Decline
                  </button>
                </div>

                <textarea
                  placeholder="Add a comment (optional)..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="input-field mt-4 text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Contact */}
            <div className="bg-white border border-primary-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Questions?</h2>
              <button className="btn-secondary w-full flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                Contact Producer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard View (for clients to see all their quotes/bookings)
  const renderDashboardView = () => {
    const quotes = [SAMPLE_QUOTE, { ...SAMPLE_QUOTE, id: 'Q-2026-002', status: 'approved', total: 3200 }];
    
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900">My Quotes & Bookings</h1>
            <p className="text-primary-500 mt-1">View and manage your rental requests</p>
          </div>
          <button 
            onClick={() => setView('booking')}
            className="btn-primary flex items-center gap-2"
          >
            <Package className="w-4 h-4" strokeWidth={1.5} />
            New Booking
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <p className="text-sm text-primary-500">Total Quotes</p>
            <p className="text-3xl font-bold text-primary-900">{quotes.length}</p>
          </div>
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <p className="text-sm text-primary-500">Approved</p>
            <p className="text-3xl font-bold text-success-600">
              {quotes.filter(q => q.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white border border-primary-200 rounded-xl p-6">
            <p className="text-sm text-primary-500">Pending</p>
            <p className="text-3xl font-bold text-warning-600">
              {quotes.filter(q => q.status === 'pending').length}
            </p>
          </div>
        </div>

        <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-primary-200">
            <h2 className="font-semibold text-primary-900">Recent Quotes</h2>
          </div>
          <div className="divide-y divide-primary-100">
            {quotes.map(quote => {
              const status = getStatusBadge(quote.status);
              return (
                <div key={quote.id} className="p-4 flex items-center justify-between hover:bg-primary-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-primary-900">{quote.id}</p>
                        <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                      </div>
                      <p className="text-sm text-primary-500">
                        {quote.studioDate ? formatDate(quote.studioDate) : 'Equipment Only'} • {formatCurrency(quote.total)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setQuote(quote);
                      setView('quote');
                    }}
                    className="btn-secondary text-sm"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Public Booking Form
  const renderBookingForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-primary-200 rounded-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">Request a Quote</h1>
          <p className="text-primary-500">Fill out the form below and we'll get back to you within 24 hours</p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">First Name</label>
              <input type="text" className="input-field" placeholder="John" />
            </div>
            <div>
              <label className="label-field">Last Name</label>
              <input type="text" className="input-field" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label className="label-field">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
              <input type="text" className="input-field pl-10" placeholder="Your Company" />
            </div>
          </div>

          <div>
            <label className="label-field">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
              <input type="email" className="input-field pl-10" placeholder="you@company.com" />
            </div>
          </div>

          <div>
            <label className="label-field">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
              <input type="tel" className="input-field pl-10" placeholder="555-123-4567" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Production Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
                <input type="date" className="input-field pl-10" />
              </div>
            </div>
            <div>
              <label className="label-field">Service Type</label>
              <select className="input-field">
                <option>Studio + Equipment</option>
                <option>Equipment Only</option>
                <option>Studio Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-field">Tell us about your production</label>
            <textarea className="input-field" rows={4} placeholder="What are you filming? Do you have specific equipment needs?" />
          </div>

          <button type="submit" className="btn-primary w-full">
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="font-bold text-primary-900">Base Creative</h1>
                <p className="text-xs text-primary-500">Equipment Rental</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <button 
                onClick={() => setView('dashboard')}
                className={`text-sm font-medium transition-colors ${
                  view === 'dashboard' ? 'text-brand-600' : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                My Quotes
              </button>
              <button 
                onClick={() => setView('booking')}
                className={`text-sm font-medium transition-colors ${
                  view === 'booking' ? 'text-brand-600' : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                New Booking
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'quote' && renderQuoteView()}
        {view === 'dashboard' && renderDashboardView()}
        {view === 'booking' && renderBookingForm()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-primary-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-primary-400">
            © 2026 Base Creative. Questions? Contact us at rentals@basecreative.com
          </p>
        </div>
      </footer>
    </div>
  );
}
import { useState, useRef } from 'react';
import { 
  Mail, Plus, Send, Users, Eye, BarChart2, Copy, Trash2, 
  Edit3, ChevronRight, Check, X, Image as ImageIcon, Type, 
  Layout, Code, Smartphone, Monitor, Save, TestTube
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

// Sample email templates
const EMAIL_TEMPLATES = [
  {
    id: 'tpl-001',
    name: 'Welcome New Client',
    subject: 'Welcome to Base Creative - Your Production Partner',
    category: 'Onboarding',
    lastEdited: '2026-02-08',
    thumbnail: '🎬',
    content: `
      <h1>Welcome to Base Creative!</h1>
      <p>Thank you for choosing us for your production needs. We're excited to work with you.</p>
      <h2>What's Next?</h2>
      <ul>
        <li>Browse our equipment catalog</li>
        <li>Book your first rental</li>
        <li>Schedule a studio tour</li>
      </ul>
    `,
    variables: ['{{clientName}}', '{{company}}', '{{bookingLink}}']
  },
  {
    id: 'tpl-002',
    name: 'Quote Follow-up',
    subject: 'Following up on your quote request',
    category: 'Sales',
    lastEdited: '2026-02-10',
    thumbnail: '📋',
    content: `
      <h1>Hi {{clientName}},</h1>
      <p>I wanted to follow up on the quote we sent for your upcoming production.</p>
      <p>Are there any questions I can answer or adjustments you'd like to make?</p>
    `,
    variables: ['{{clientName}}', '{{quoteId}}', '{{quoteTotal}}']
  },
  {
    id: 'tpl-003',
    name: 'Rental Reminder',
    subject: 'Your rental pickup is tomorrow',
    category: 'Operations',
    lastEdited: '2026-02-11',
    thumbnail: '⏰',
    content: `
      <h1>Rental Reminder</h1>
      <p>This is a friendly reminder that your equipment pickup is scheduled for tomorrow.</p>
      <p><strong>Date:</strong> {{pickupDate}}</p>
      <p><strong>Time:</strong> {{pickupTime}}</p>
    `,
    variables: ['{{clientName}}', '{{pickupDate}}', '{{pickupTime}}', '{{equipmentList}}']
  },
  {
    id: 'tpl-004',
    name: 'Equipment Return Confirmation',
    subject: 'Equipment Return Confirmed',
    category: 'Operations',
    lastEdited: '2026-02-09',
    thumbnail: '✅',
    content: `
      <h1>Return Confirmed</h1>
      <p>Thank you for returning your equipment. Everything has been checked in.</p>
      <p>We hope your production went smoothly!</p>
    `,
    variables: ['{{clientName}}', '{{returnDate}}', '{{equipmentReturned}}']
  },
  {
    id: 'tpl-005',
    name: 'Monthly Newsletter',
    subject: 'February Update: New Gear & Special Offers',
    category: 'Marketing',
    lastEdited: '2026-02-01',
    thumbnail: '📰',
    content: `
      <h1>February at Base Creative</h1>
      <h2>New Equipment</h2>
      <p>We've added Sony FX6 cameras and Astera Titan tubes to our inventory.</p>
      <h2>Special Offer</h2>
      <p>Book 3 days, get the 4th free on all lighting packages this month.</p>
    `,
    variables: ['{{firstName}}', '{{promoCode}}']
  },
  {
    id: 'tpl-006',
    name: 'Post-Production Survey',
    subject: 'How did your production go?',
    category: 'Feedback',
    lastEdited: '2026-01-25',
    thumbnail: '📝',
    content: `
      <h1>We Value Your Feedback</h1>
      <p>Your production wrapped up recently. We'd love to hear about your experience.</p>
      <p><a href="{{surveyLink}}">Take 2-minute survey</a></p>
    `,
    variables: ['{{clientName}}', '{{surveyLink}}', '{{bookingId}}']
  }
];

// Sample campaigns
const CAMPAIGNS = [
  {
    id: 'camp-001',
    name: 'February New Gear Announcement',
    status: 'sent',
    sentDate: '2026-02-01',
    audience: 'All Clients (342)',
    openRate: 48.2,
    clickRate: 12.5,
    template: 'Monthly Newsletter'
  },
  {
    id: 'camp-002',
    name: 'Quote Follow-up - January',
    status: 'sending',
    sentDate: '2026-02-05',
    audience: 'Pending Quotes (18)',
    openRate: 62.3,
    clickRate: 28.1,
    template: 'Quote Follow-up'
  },
  {
    id: 'camp-003',
    name: 'Studio Tour Invitation',
    status: 'draft',
    sentDate: null,
    audience: 'New Leads (45)',
    openRate: null,
    clickRate: null,
    template: 'Welcome New Client'
  }
];

// Sample audience segments
const AUDIENCE_SEGMENTS = [
  { id: 'seg-001', name: 'All Clients', count: 342, criteria: 'All active clients' },
  { id: 'seg-002', name: 'High Value Clients', count: 28, criteria: 'Revenue > $10k' },
  { id: 'seg-003', name: 'Frequent Renters', count: 86, criteria: '> 5 bookings/year' },
  { id: 'seg-004', name: 'New Leads', count: 45, criteria: 'Not yet booked' },
  { id: 'seg-005', name: 'Pending Quotes', count: 18, criteria: 'Quote status = pending' },
  { id: 'seg-006', name: 'Inactive Clients', count: 124, criteria: 'No booking in 6 months' }
];

export default function MarketingTools() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const editorRef = useRef(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setEmailContent(template.content);
    setEmailSubject(template.subject);
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    setIsEditing(false);
    setSelectedTemplate(null);
  };

  const insertVariable = (variable) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(variable);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const formatText = (command) => {
    document.execCommand(command, false, null);
  };

  const renderTemplatesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary-900">Email Templates</h2>
        <button 
          onClick={() => {
            setSelectedTemplate(null);
            setEmailContent('<h1>New Template</h1><p>Start editing...</p>');
            setEmailSubject('');
            setIsEditing(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMAIL_TEMPLATES.map(template => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className="group bg-white border border-primary-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
              <span className="text-5xl">{template.thumbnail}</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default" className="text-xs">{template.category}</Badge>
                <span className="text-xs text-primary-400">{template.lastEdited}</span>
              </div>
              <h3 className="font-semibold text-primary-900 group-hover:text-brand-600 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-primary-500 mt-1 line-clamp-1">{template.subject}</p>
              
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary-100">
                {template.variables.slice(0, 2).map(v => (
                  <span key={v} className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded">
                    {v}
                  </span>
                ))}
                {template.variables.length > 2 && (
                  <span className="text-xs text-primary-400">+{template.variables.length - 2}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-primary-500 hover:text-primary-700"
        >
          <ChevronRight className="w-4 h-4 rotate-180" strokeWidth={1.5} />
          Back to Templates
        </button>
        <div className="flex items-center gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Eye className="w-4 h-4" strokeWidth={1.5} />
            Preview
          </button>
          <button 
            onClick={handleSaveTemplate}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" strokeWidth={1.5} />
            Save Template
          </button>
        </div>
      </div>

      <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
        {/* Subject Line */}
        <div className="p-4 border-b border-primary-200">
          <label className="text-sm font-medium text-primary-700">Subject Line</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="input-field mt-1"
            placeholder="Enter email subject..."
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-primary-200 bg-primary-50">
          <button onClick={() => formatText('bold')} className="p-2 hover:bg-white rounded transition-colors">
            <strong>B</strong>
          </button>
          <button onClick={() => formatText('italic')} className="p-2 hover:bg-white rounded transition-colors">
            <em>I</em>
          </button>
          <button onClick={() => formatText('underline')} className="p-2 hover:bg-white rounded transition-colors">
            <u>U</u>
          </button>
          <div className="w-px h-6 bg-primary-200 mx-2"></div>
          <button onClick={() => formatText('justifyLeft')} className="p-2 hover:bg-white rounded transition-colors">
            <Layout className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => formatText('insertUnorderedList')} className="p-2 hover:bg-white rounded transition-colors">
            <Type className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div className="w-px h-6 bg-primary-200 mx-2"></div>
          <button className="p-2 hover:bg-white rounded transition-colors">
            <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button className="p-2 hover:bg-white rounded transition-colors">
            <Code className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded transition-colors ${previewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-white'}`}
            >
              <Monitor className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded transition-colors ${previewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-white'}`}
            >
              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Editor */}
          <div className="flex-1 p-4">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[400px] prose prose-sm max-w-none focus:outline-none"
              dangerouslySetInnerHTML={{ __html: emailContent }}
              onInput={(e) => setEmailContent(e.currentTarget.innerHTML)}
            />
          </div>

          {/* Variables Sidebar */}
          <div className="w-64 border-l border-primary-200 bg-primary-50 p-4">
            <h4 className="font-semibold text-primary-900 mb-3">Variables</h4>
            <p className="text-xs text-primary-500 mb-4">Click to insert into email</p>
            <div className="space-y-2">
              {['{{clientName}}', '{{firstName}}', '{{company}}', '{{quoteId}}', '{{quoteTotal}}', '{{bookingLink}}', '{{pickupDate}}', '{{surveyLink}}'].map(variable => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  className="w-full text-left px-3 py-2 text-sm bg-white border border-primary-200 rounded-lg hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  {variable}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaignsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Email Campaigns</h2>
          <p className="text-primary-500 mt-1">Track and manage your email campaigns</p>
        </div>
        <button 
          onClick={() => setShowNewCampaign(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Send className="w-4 h-4" strokeWidth={1.5} />
          New Campaign
        </button>
      </div>

      <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Campaign</th>
                <th className="text-left text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Audience</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Open Rate</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Click Rate</th>
                <th className="text-center text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {CAMPAIGNS.map(campaign => (
                <tr key={campaign.id} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-primary-900">{campaign.name}</p>
                      <p className="text-xs text-primary-500">{campaign.template}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={
                        campaign.status === 'sent' ? 'success' :
                        campaign.status === 'sending' ? 'warning' :
                        'default'
                      }
                    >
                      {campaign.status === 'sent' && <Check className="w-3 h-3 mr-1" />}
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-primary-600">
                    {campaign.audience}
                  </td>
                  <td className="px-6 py-4 text-right font-tabular">
                    {campaign.openRate ? `${campaign.openRate}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-tabular">
                    {campaign.clickRate ? `${campaign.clickRate}%` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 text-primary-400 hover:text-primary-600 transition-colors">
                        <BarChart2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button className="p-2 text-primary-400 hover:text-primary-600 transition-colors">
                        <Copy className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      {campaign.status === 'draft' && (
                        <button className="p-2 text-primary-400 hover:text-danger-500 transition-colors">
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAudienceView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary-900">Audience Segments</h2>
          <p className="text-primary-500 mt-1">Manage your contact segments for targeted campaigns</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          New Segment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AUDIENCE_SEGMENTS.map(segment => (
          <div key={segment.id} className="bg-white border border-primary-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-primary-900">{segment.name}</h3>
                <p className="text-sm text-primary-500 mt-1">{segment.criteria}</p>
              </div>
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-brand-600">{segment.count}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primary-100">
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View Contacts
              </button>
              <button className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Send Campaign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      {!isEditing && (
        <div className="flex items-center gap-2 border-b border-primary-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Mail className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'campaigns'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Send className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('audience')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'audience'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Audience
          </button>
        </div>
      )}

      {/* Content */}
      {isEditing ? renderEditor() : (
        <>
          {activeTab === 'templates' && renderTemplatesView()}
          {activeTab === 'campaigns' && renderCampaignsView()}
          {activeTab === 'audience' && renderAudienceView()}
        </>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-4">
              <div>
                <label className="label-field">Campaign Name</label>
                <input type="text" className="input-field" placeholder="e.g., February Newsletter" />
              </div>
              <div>
                <label className="label-field">Select Template</label>
                <select className="input-field">
                  {EMAIL_TEMPLATES.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Audience Segment</label>
                <select className="input-field">
                  {AUDIENCE_SEGMENTS.map(seg => (
                    <option key={seg.id} value={seg.id}>{seg.name} ({seg.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Schedule</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" defaultChecked />
                    <span className="text-sm text-primary-700">Send immediately</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="schedule" />
                    <span className="text-sm text-primary-700">Schedule for later</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button className="btn-primary flex-1">Create Campaign</button>
                <button 
                  type="button"
                  onClick={() => setShowNewCampaign(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
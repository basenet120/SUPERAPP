import React from 'react';
import { Book, Video, MessageCircle, FileText, ExternalLink, Search } from 'lucide-react';

const HelpCenter = () => {
  const categories = [
    {
      title: 'Getting Started',
      icon: Book,
      articles: [
        { title: 'Quick Start Guide', id: 'quick-start' },
        { title: 'Setting up your company profile', id: 'company-profile' },
        { title: 'Adding your first equipment', id: 'add-equipment' },
        { title: 'Creating your first booking', id: 'first-booking' }
      ]
    },
    {
      title: 'Equipment Management',
      icon: FileText,
      articles: [
        { title: 'Adding and editing equipment', id: 'manage-equipment' },
        { title: 'Equipment categories and tags', id: 'categories' },
        { title: 'Bulk import via CSV', id: 'csv-import' },
        { title: 'Maintenance tracking', id: 'maintenance' },
        { title: 'Barcode scanning setup', id: 'barcodes' }
      ]
    },
    {
      title: 'Bookings & Scheduling',
      icon: Book,
      articles: [
        { title: 'Creating a new booking', id: 'create-booking' },
        { title: 'Managing booking status', id: 'booking-status' },
        { title: 'Conflict detection', id: 'conflicts' },
        { title: 'Recurring bookings', id: 'recurring' },
        { title: 'Calendar integration', id: 'calendar' }
      ]
    },
    {
      title: 'Client Management',
      icon: MessageCircle,
      articles: [
        { title: 'Adding clients', id: 'add-clients' },
        { title: 'COI (Certificate of Insurance)', id: 'coi' },
        { title: 'Client communication', id: 'communication' },
        { title: 'Client portal', id: 'client-portal' }
      ]
    },
    {
      title: 'Billing & Invoicing',
      icon: FileText,
      articles: [
        { title: 'QuickBooks integration', id: 'quickbooks' },
        { title: 'Creating invoices', id: 'invoices' },
        { title: 'Payment processing', id: 'payments' },
        { title: 'Tax settings', id: 'tax' }
      ]
    },
    {
      title: 'Team & Permissions',
      icon: MessageCircle,
      articles: [
        { title: 'Inviting team members', id: 'invite-team' },
        { title: 'Role-based permissions', id: 'permissions' },
        { title: 'Activity tracking', id: 'activity' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-2">
            Find answers and learn how to use Base Super App
          </p>
          
          {/* Search */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.title} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <category.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
              </div>
              
              <ul className="space-y-2">
                {category.articles.map((article) => (
                  <li key={article.id}>
                    <a
                      href={`/help/article/${article.id}`}
                      className="text-gray-600 hover:text-blue-600 hover:underline flex items-center"
                    >
                      {article.title}
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="/help/video-tutorials" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <Video className="w-8 h-8 text-red-500 mb-3" />
              <h3 className="font-medium text-gray-900">Video Tutorials</h3>
              <p className="text-sm text-gray-600 mt-1">Watch step-by-step guides</p>
            </a>
            
            <a href="/help/api-docs" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <FileText className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="font-medium text-gray-900">API Documentation</h3>
              <p className="text-sm text-gray-600 mt-1">Integrate with our API</p>
            </a>
            
            <a href="/contact" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <MessageCircle className="w-8 h-8 text-green-500 mb-3" />
              <h3 className="font-medium text-gray-900">Contact Support</h3>
              <p className="text-sm text-gray-600 mt-1">Get help from our team</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Article View Component
const HelpArticle = ({ articleId }) => {
  const articles = {
    'quick-start': {
      title: 'Quick Start Guide',
      content: `
        <h2>Welcome to Base Super App!</h2>
        <p>This guide will help you get started with the essentials.</p>
        
        <h3>1. Complete Your Profile</h3>
        <p>Start by setting up your company profile with your business information, logo, and contact details.</p>
        
        <h3>2. Add Your Equipment</h3>
        <p>Add your inventory manually or import via CSV. Organize by categories for easy browsing.</p>
        
        <h3>3. Create Your First Booking</h3>
        <p>Use the booking wizard to create a reservation. The system will check for conflicts automatically.</p>
        
        <h3>4. Invite Your Team</h3>
        <p>Add team members and assign appropriate permissions based on their roles.</p>
      `
    },
    'manage-equipment': {
      title: 'Adding and Editing Equipment',
      content: `
        <h2>Managing Your Equipment Inventory</h2>
        
        <h3>Adding New Equipment</h3>
        <p>To add a new item:</p>
        <ol>
          <li>Navigate to Equipment → Add New</li>
          <li>Fill in the required fields (Name, Category, Daily Rate)</li>
          <li>Add optional details like Serial Number, Barcode, Description</li>
          <li>Upload photos for easy identification</li>
          <li>Set availability status</li>
        </ol>
        
        <h3>Equipment Details</h3>
        <p>Each equipment item can have:</p>
        <ul>
          <li>Pricing tiers (Daily, Weekly, Monthly)</li>
          <li>Replacement value for insurance</li>
          <li>Maintenance history</li>
          <li>Documents and manuals</li>
          <li>Kit/bundle associations</li>
        </ul>
      `
    },
    'create-booking': {
      title: 'Creating a New Booking',
      content: `
        <h2>How to Create a Booking</h2>
        
        <h3>Quick Booking</h3>
        <ol>
          <li>Click "New Booking" from the dashboard</li>
          <li>Select the client or create a new one</li>
          <li>Choose equipment items and dates</li>
          <li>Review pricing and availability</li>
          <li>Confirm the booking</li>
        </ol>
        
        <h3>Booking States</h3>
        <ul>
          <li><strong>Pending:</strong> Initial state, awaiting confirmation</li>
          <li><strong>Confirmed:</strong> Booking is locked in</li>
          <li><strong>Out:</strong> Equipment has been checked out</li>
          <li><strong>Returned:</strong> Equipment has been checked in</li>
          <li><strong>Completed:</strong> Booking is finished and invoiced</li>
        </ul>
      `
    }
  };

  const article = articles[articleId] || { title: 'Article Not Found', content: '<p>The requested article could not be found.</p>' };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <a href="/help" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Help Center
        </a>
        <article className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{article.title}</h1>
          <div 
            className="prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </div>
    </div>
  );
};

export { HelpCenter, HelpArticle };
export default HelpCenter;

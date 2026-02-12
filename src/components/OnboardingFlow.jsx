import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, ChevronRight, ChevronLeft, Building, Users, Package, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: ''
    },
    teamSize: '',
    equipmentCategories: [],
    quickbooksConnected: false,
    notificationsEnabled: true
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Base',
      description: 'Let\'s get your account set up in just a few minutes.',
      icon: Building
    },
    {
      id: 'company',
      title: 'Company Profile',
      description: 'Tell us about your business.',
      icon: Building
    },
    {
      id: 'team',
      title: 'Team Setup',
      description: 'Invite your team members.',
      icon: Users
    },
    {
      id: 'equipment',
      title: 'Equipment Setup',
      description: 'Add your first equipment items.',
      icon: Package
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect your favorite tools.',
      icon: Settings
    }
  ];

  useEffect(() => {
    // Check if user has completed onboarding
    if (user?.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      await api.post('/onboarding/complete', formData);
      await updateUser({ onboardingCompleted: true });
      navigate('/dashboard');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <CompanyStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 2:
        return (
          <TeamStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 3:
        return (
          <EquipmentStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 4:
        return (
          <IntegrationsStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Base</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                    ${index < currentStep ? 'bg-green-500' : ''}
                  `}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-1 mx-2
                      ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`
                  flex items-center px-4 py-2 rounded-lg font-medium
                  ${currentStep === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-gray-100'}
                `}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="
                  flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg
                  font-medium hover:bg-blue-700 disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors
                "
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : currentStep === steps.length - 1 ? (
                  'Complete Setup'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step
const WelcomeStep = ({ onNext }) => (
  <div className="text-center py-8">
    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Building className="w-10 h-10 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">
      Welcome to Base Super App!
    </h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      We're excited to help you manage your production equipment rentals. 
      This quick setup will take about 5 minutes.
    </p>
    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
      <h4 className="font-medium text-blue-900 mb-2">What we'll set up:</h4>
      <ul className="text-sm text-blue-800 text-left space-y-1">
        <li>✓ Company profile and settings</li>
        <li>✓ Team member invitations</li>
        <li>✓ Equipment inventory</li>
        <li>✓ Integration connections</li>
      </ul>
    </div>
  </div>
);

// Company Step
const CompanyStep = ({ formData, updateFormData }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Company Name *
      </label>
      <input
        type="text"
        value={formData.companyName}
        onChange={(e) => updateFormData('companyName', e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="Your Company Name"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Business Type
      </label>
      <select
        value={formData.companyType}
        onChange={(e) => updateFormData('companyType', e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select type...</option>
        <option value="production_company">Production Company</option>
        <option value="rental_house">Rental House</option>
        <option value="event_company">Event Company</option>
        <option value="photography">Photography Studio</option>
        <option value="other">Other</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number
      </label>
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => updateFormData('phone', e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="+1 (555) 123-4567"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Address
      </label>
      <input
        type="text"
        value={formData.address.street}
        onChange={(e) => updateFormData('address', { ...formData.address, street: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
        placeholder="Street Address"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={formData.address.city}
          onChange={(e) => updateFormData('address', { ...formData.address, city: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="City"
        />
        <input
          type="text"
          value={formData.address.state}
          onChange={(e) => updateFormData('address', { ...formData.address, state: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="State"
        />
        <input
          type="text"
          value={formData.address.zip}
          onChange={(e) => updateFormData('address', { ...formData.address, zip: e.target.value })}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="ZIP"
        />
      </div>
    </div>
  </div>
);

// Team Step
const TeamStep = ({ formData, updateFormData }) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const sendInvite = () => {
    if (inviteEmail) {
      // Send invite logic
      setInviteEmail('');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          How many people are on your team?
        </label>
        <select
          value={formData.teamSize}
          onChange={(e) => updateFormData('teamSize', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select team size...</option>
          <option value="1-5">1-5 people</option>
          <option value="6-15">6-15 people</option>
          <option value="16-50">16-50 people</option>
          <option value="50+">50+ people</option>
        </select>
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Team Members (Optional)
        </label>
        <div className="flex space-x-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="colleague@company.com"
          />
          <button
            onClick={sendInvite}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Invite
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          You can invite more team members later from Settings.
        </p>
      </div>
    </div>
  );
};

// Equipment Step
const EquipmentStep = ({ formData, updateFormData }) => {
  const categories = [
    { id: 'cameras', name: 'Cameras', icon: '📷' },
    { id: 'lenses', name: 'Lenses', icon: '🔭' },
    { id: 'lighting', name: 'Lighting', icon: '💡' },
    { id: 'audio', name: 'Audio', icon: '🎤' },
    { id: 'grip', name: 'Grip', icon: '🎬' },
    { id: 'drones', name: 'Drones', icon: '🚁' }
  ];

  const toggleCategory = (categoryId) => {
    const current = formData.equipmentCategories;
    const updated = current.includes(categoryId)
      ? current.filter(id => id !== categoryId)
      : [...current, categoryId];
    updateFormData('equipmentCategories', updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What types of equipment do you rent?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`
                p-4 border-2 rounded-lg text-left transition-colors
                ${formData.equipmentCategories.includes(category.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'}
              `}
            >
              <span className="text-2xl mr-2">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
              {formData.equipmentCategories.includes(category.id) && (
                <CheckCircle className="w-5 h-5 text-blue-500 float-right" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          💡 <strong>Tip:</strong> You can add your equipment inventory after completing setup. 
          We also support bulk CSV import.
        </p>
      </div>
    </div>
  );
};

// Integrations Step
const IntegrationsStep = ({ formData, updateFormData }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-green-600 font-bold">QB</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">QuickBooks</h4>
            <p className="text-sm text-gray-500">Sync invoices and payments</p>
          </div>
        </div>
        <button
          onClick={() => updateFormData('quickbooksConnected', !formData.quickbooksConnected)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${formData.quickbooksConnected
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'}
          `}
        >
          {formData.quickbooksConnected ? 'Connected ✓' : 'Connect'}
        </button>
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <span className="text-blue-600 font-bold">📧</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-500">Get notified about bookings</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.notificationsEnabled}
            onChange={(e) => updateFormData('notificationsEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>

    <p className="text-sm text-gray-500 text-center">
      You can configure more integrations later from Settings → Integrations
    </p>
  </div>
);

export default OnboardingFlow;

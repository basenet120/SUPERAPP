import { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Check, Calendar, Package, FileText, User, Send } from 'lucide-react';
import StudioCalendar from './StudioCalendar';
import EquipmentBuilder from './EquipmentBuilder';
import QuoteReview from './QuoteReview';
import ClientCheckout from './ClientCheckout';
import BookingAdmin from './BookingAdmin';
import { EXISTING_BOOKINGS } from './equipmentData';

const STEPS = [
  { id: 'service', label: 'Service Type', icon: Send },
  { id: 'studio', label: 'Studio', icon: Calendar },
  { id: 'equipment', label: 'Equipment', icon: Package },
  { id: 'review', label: 'Review', icon: FileText },
  { id: 'checkout', label: 'Checkout', icon: User },
];

const SERVICE_TYPES = [
  { id: 'studio', label: 'Studio Only', description: 'Book our production studio for your shoot' },
  { id: 'equipment', label: 'Equipment Only', description: 'Rent equipment for off-site production' },
  { id: 'both', label: 'Studio + Equipment', description: 'Full package with studio and gear' },
];

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userRole, setUserRole] = useState('client');
  
  const [bookingData, setBookingData] = useState({
    serviceType: '',
    studioDate: null,
    studioTime: { start: '07:00', end: '19:00' },
    studioOverride: false,
    equipment: [],
    clientInfo: {
      name: '',
      email: '',
      phone: '',
      company: '',
    },
    coiFile: null,
    contractSigned: false,
    signatureName: '',
    deliveryCost: 0,
    depositType: '50%',
  });

  const updateBookingData = useCallback((updates) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleServiceSelect = (serviceType) => {
    updateBookingData({ serviceType });
    handleNext();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!bookingData.serviceType;
      case 1:
        if (bookingData.serviceType === 'equipment') return true;
        return !!bookingData.studioDate;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return (
          bookingData.clientInfo.name &&
          bookingData.clientInfo.email &&
          bookingData.coiFile &&
          bookingData.contractSigned &&
          bookingData.signatureName
        );
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    const quoteId = `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`;
    alert(`Quote request submitted!\nQuote ID: ${quoteId}\n\nYou will receive a confirmation email shortly.`);
    setCurrentStep(0);
    setBookingData({
      serviceType: '',
      studioDate: null,
      studioTime: { start: '07:00', end: '19:00' },
      studioOverride: false,
      equipment: [],
      clientInfo: { name: '', email: '', phone: '', company: '' },
      coiFile: null,
      contractSigned: false,
      signatureName: '',
      deliveryCost: 0,
      depositType: '50%',
    });
  };

  if (userRole === 'admin') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Booking Management</h2>
            <p className="page-subtitle">Manage incoming booking requests</p>
          </div>
          <button
            onClick={() => setUserRole('client')}
            className="btn-secondary text-sm"
          >
            Switch to Client View
          </button>
        </div>
        <BookingAdmin />
      </div>
    );
  }

  // Calculate visible steps (skip studio if equipment only)
  const visibleSteps = STEPS.filter((step, index) => {
    if (step.id === 'studio' && bookingData.serviceType === 'equipment') return false;
    return true;
  });

  const getVisibleStepIndex = () => {
    if (bookingData.serviceType === 'equipment' && currentStep >= 1) {
      return currentStep - 1;
    }
    return currentStep;
  };

  return (
    <div className="space-y-6">
      {/* Admin Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setUserRole('admin')}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Admin View →
        </button>
      </div>

      {/* Step Indicator */}
      <div className="card p-6">
        <div className="flex items-center">
          {visibleSteps.map((step, index) => {
            const Icon = step.icon;
            const visibleIndex = getVisibleStepIndex();
            const isActive = index === visibleIndex;
            const isCompleted = index < visibleIndex;
            const isLast = index === visibleSteps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center relative">
                  <button
                    onClick={() => !isActive && isCompleted && setCurrentStep(
                      bookingData.serviceType === 'equipment' && index >= 1 ? index + 1 : index
                    )}
                    disabled={index > visibleIndex}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                      ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : ''}
                      ${isCompleted ? 'bg-success-500 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-primary-100 text-primary-400' : ''}
                      ${index > visibleIndex ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" strokeWidth={2} />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </button>
                  <span
                    className={`
                      text-xs mt-2 font-medium whitespace-nowrap
                      ${isActive ? 'text-brand-700' : ''}
                      ${isCompleted ? 'text-success-600' : ''}
                      ${!isActive && !isCompleted ? 'text-primary-400' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                      index < visibleIndex ? 'bg-success-500' : 'bg-primary-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card min-h-[500px]">
        <div className="p-6">
          {currentStep === 0 && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-primary-900 mb-2">What would you like to book?</h3>
                <p className="text-primary-500">Select the service that fits your production needs</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {SERVICE_TYPES.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`
                      p-6 rounded-xl border-2 text-left transition-all duration-200 group
                      ${bookingData.serviceType === service.id
                        ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/10'
                        : 'border-primary-200 hover:border-brand-300 hover:shadow-md bg-white'
                      }
                    `}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      bookingData.serviceType === service.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'
                    }`}>
                      {service.id === 'studio' && <Calendar className="w-7 h-7" strokeWidth={1.5} />}
                      {service.id === 'equipment' && <Package className="w-7 h-7" strokeWidth={1.5} />}
                      {service.id === 'both' && <Send className="w-7 h-7" strokeWidth={1.5} />}
                    </div>
                    <h4 className="font-semibold text-primary-900 mb-1 text-lg">{service.label}</h4>
                    <p className="text-sm text-primary-500">{service.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && bookingData.serviceType !== 'equipment' && (
            <StudioCalendar
              selectedDate={bookingData.studioDate}
              onSelectDate={(date) => updateBookingData({ studioDate: date })}
              selectedTime={bookingData.studioTime}
              onTimeChange={(time) => updateBookingData({ studioTime: time })}
              override={bookingData.studioOverride}
              onOverrideChange={(override) => updateBookingData({ studioOverride: override })}
              existingBookings={EXISTING_BOOKINGS}
            />
          )}

          {currentStep === 1 && bookingData.serviceType === 'equipment' && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-brand-600" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-2">Equipment Rental</h3>
              <p className="text-primary-500 mb-6">Continue to select your equipment</p>
              <button onClick={handleNext} className="btn-primary">
                Continue to Equipment
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <EquipmentBuilder
              cart={bookingData.equipment}
              onCartChange={(equipment) => updateBookingData({ equipment })}
            />
          )}

          {currentStep === 3 && (
            <QuoteReview
              bookingData={bookingData}
              onDeliveryChange={(cost) => updateBookingData({ deliveryCost: cost })}
              onDepositChange={(type) => updateBookingData({ depositType: type })}
            />
          )}

          {currentStep === 4 && (
            <ClientCheckout
              clientInfo={bookingData.clientInfo}
              onClientInfoChange={(info) => updateBookingData({ clientInfo: info })}
              coiFile={bookingData.coiFile}
              onCoiUpload={(file) => updateBookingData({ coiFile: file })}
              contractSigned={bookingData.contractSigned}
              onContractSign={(signed) => updateBookingData({ contractSigned: signed })}
              signatureName={bookingData.signatureName}
              onSignatureChange={(name) => updateBookingData({ signatureName: name })}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
          disabled={!canProceed()}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === STEPS.length - 1 ? 'Submit Quote Request' : 'Continue'}
          {currentStep !== STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

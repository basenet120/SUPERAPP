import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, User, Mail, Phone, Building } from 'lucide-react';

export default function ClientCheckout({
  clientInfo,
  onClientInfoChange,
  coiFile,
  onCoiUpload,
  contractSigned,
  onContractSign,
  signatureName,
  onSignatureChange,
  onSubmit
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Name is required';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Valid email is required';
      case 'phone':
        return value.trim() ? '' : 'Phone number is required';
      default:
        return '';
    }
  };

  const handleInputChange = (field, value) => {
    onClientInfoChange({ ...clientInfo, [field]: value });
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    // Validate file type and size
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, JPEG, or PNG file');
      return;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    onCoiUpload(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const removeFile = () => {
    onCoiUpload(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-base-900">Complete Your Booking</h3>
        <p className="text-base-500">Please provide your information and required documentation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="space-y-4">
          <div className="border border-base-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-base-50 border-b border-base-200">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-base-600" />
                <h4 className="font-semibold text-base-900">Client Information</h4>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-base-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe"
                    className={`input-field pl-10 ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-base-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@company.com"
                    className={`input-field pl-10 ${errors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-base-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`input-field pl-10 ${errors.phone ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-base-700 mb-1">
                  Company / Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-400" />
                  <input
                    type="text"
                    value={clientInfo.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Production Company Inc."
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COI Upload & Contract */}
        <div className="space-y-4">
          {/* COI Upload */}
          <div className="border border-base-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-base-50 border-b border-base-200">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-base-600" />
                <h4 className="font-semibold text-base-900">Certificate of Insurance (COI)</h4>
                <span className="text-red-500 text-sm">*</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-base-500 mb-4">
                Please upload your Certificate of Insurance listing Base as an additional insured.
                Minimum $2M general liability coverage required.
              </p>

              {!coiFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-base-300'}
                  `}
                >
                  <Upload className="w-10 h-10 text-base-400 mx-auto mb-3" />
                  <p className="text-base-600 font-medium mb-1">
                    Drag & drop your COI here
                  </p>
                  <p className="text-sm text-base-500 mb-4">
                    or click to browse files
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInput}
                    className="hidden"
                    id="coi-upload"
                  />
                  <label
                    htmlFor="coi-upload"
                    className="btn-secondary cursor-pointer inline-block"
                  >
                    Select File
                  </label>
                  <p className="text-xs text-base-400 mt-3">
                    PDF, JPEG, or PNG up to 10MB
                  </p>
                </div>
              ) : (
                <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900 truncate max-w-[200px]">
                          {coiFile.name}
                        </p>
                        <p className="text-sm text-green-600">
                          {(coiFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">COI uploaded successfully</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Digital Contract */}
          <div className="border border-base-200 rounded-xl overflow-hidden">
            <div className="p-4 bg-base-50 border-b border-base-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-base-600" />
                <h4 className="font-semibold text-base-900">Rental Agreement</h4>
                <span className="text-red-500 text-sm">*</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Contract Text */}
              <div className="bg-base-50 rounded-lg p-4 text-sm text-base-600 max-h-48 overflow-y-auto">
                <h5 className="font-semibold text-base-900 mb-2">EQUIPMENT RENTAL AGREEMENT</h5>
                <p className="mb-2">
                  This Equipment Rental Agreement ("Agreement") is entered into between Base Production LLC 
                  ("Lessor") and the renter identified above ("Lessee").
                </p>
                <p className="mb-2">
                  <strong>1. EQUIPMENT:</strong> Lessee agrees to rent the equipment listed in the attached quote 
                  for the rental period specified.
                </p>
                <p className="mb-2">
                  <strong>2. RENTAL PERIOD:</strong> Equipment must be returned by the agreed-upon return date. 
                  Late returns will incur additional daily rental charges.
                </p>
                <p className="mb-2">
                  <strong>3. PAYMENT:</strong> Full payment or deposit as specified in the quote is required 
                  before equipment release.
                </p>
                <p className="mb-2">
                  <strong>4. CARE AND USE:</strong> Lessee agrees to use the equipment with due care and in 
                  accordance with manufacturer specifications. Lessee is responsible for any damage caused by 
                  misuse or negligence.
                </p>
                <p className="mb-2">
                  <strong>5. INSURANCE:</strong> Lessee must maintain adequate insurance coverage for the full 
                  replacement value of rented equipment.
                </p>
                <p className="mb-2">
                  <strong>6. LIABILITY:</strong> Lessee assumes all liability for equipment from pickup to return. 
                  Equipment must be returned in the same condition as received.
                </p>
                <p>
                  <strong>7. CANCELLATION:</strong> Cancellations within 48 hours of rental start may forfeit 
                  the deposit.
                </p>
              </div>

              {/* Signature Section */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contractSigned}
                    onChange={(e) => onContractSign(e.target.checked)}
                    className="mt-1 w-4 h-4 text-brand-600 rounded border-base-300"
                  />
                  <span className="text-sm text-base-700">
                    I have read and agree to the terms and conditions of this Equipment Rental Agreement.
                  </span>
                </label>

                {contractSigned && (
                  <div>
                    <label className="block text-sm font-medium text-base-700 mb-1">
                      Type Your Full Name as Signature <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => onSignatureChange(e.target.value)}
                      placeholder="Type your full legal name"
                      className="input-field"
                    />
                    <p className="text-xs text-base-500 mt-1">
                      By typing your name, you agree this constitutes your electronic signature.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="bg-base-50 border border-base-200 rounded-xl p-4">
        <h4 className="font-semibold text-base-900 mb-3">Before Submitting</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`flex items-center gap-2 ${clientInfo.name ? 'text-green-600' : 'text-base-400'}`}>
            {clientInfo.name ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">Full name provided</span>
          </div>
          <div className={`flex items-center gap-2 ${clientInfo.email ? 'text-green-600' : 'text-base-400'}`}>
            {clientInfo.email ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">Valid email address</span>
          </div>
          <div className={`flex items-center gap-2 ${clientInfo.phone ? 'text-green-600' : 'text-base-400'}`}>
            {clientInfo.phone ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">Phone number provided</span>
          </div>
          <div className={`flex items-center gap-2 ${coiFile ? 'text-green-600' : 'text-base-400'}`}>
            {coiFile ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">COI uploaded</span>
          </div>
          <div className={`flex items-center gap-2 ${contractSigned ? 'text-green-600' : 'text-base-400'}`}>
            {contractSigned ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">Contract agreed to</span>
          </div>
          <div className={`flex items-center gap-2 ${signatureName ? 'text-green-600' : 'text-base-400'}`}>
            {signatureName ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-base-300" />}
            <span className="text-sm">Digital signature provided</span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  AlertCircle, 
  Download, 
  Loader2,
  Table,
  Settings,
  Eye,
  Play,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const CSVImportWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState('upload'); // upload, mapping, preview, processing, complete
  const [csvData, setCsvData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mappings, setMappings] = useState({});
  const [detectedMappings, setDetectedMappings] = useState({});
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    vendorId: '',
    defaultCategoryId: '',
    markupMultiplier: 2.5,
    categoryMappings: {}
  });
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Load vendors and categories on mount
  React.useEffect(() => {
    loadVendorsAndCategories();
  }, []);

  const loadVendorsAndCategories = async () => {
    try {
      const [vendorsRes, categoriesRes] = await Promise.all([
        api.get('/equipment/vendors'),
        api.get('/equipment/categories')
      ]);
      setVendors(vendorsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load vendors/categories:', error);
    }
  };

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const text = await file.text();
      setCsvData(text);

      const response = await api.post('/import/upload', {
        csvData: text,
        type: 'equipment'
      });

      const { headers: csvHeaders, detectedMappings: detected, validation: valData, sampleData } = response.data.data;
      
      setHeaders(csvHeaders);
      setDetectedMappings(detected);
      setMappings(detected);
      setValidation(valData);
      setTotalRows(response.data.data.totalRows);

      if (valData.errors.length === 0) {
        toast({
          title: 'File validated',
          description: `${valData.validRows} rows ready for import`,
          variant: 'success'
        });
      } else {
        toast({
          title: 'Validation issues found',
          description: `${valData.errors.length} errors, ${valData.warnings.length} warnings`,
          variant: 'warning'
        });
      }

      setStep('mapping');
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.error?.message || 'Failed to parse CSV file',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleMappingChange = (csvColumn, fieldName) => {
    setMappings(prev => ({
      ...prev,
      [csvColumn]: fieldName || undefined
    }));
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/import/preview', {
        csvData,
        mappings,
        ...options
      });

      setPreview(response.data.data.preview);
      setStep('preview');
    } catch (error) {
      toast({
        title: 'Preview failed',
        description: error.response?.data?.error?.message || 'Failed to generate preview',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartImport = async () => {
    setIsLoading(true);
    setStep('processing');

    try {
      const response = await api.post('/import/start', {
        csvData,
        mappings,
        ...options,
        options: {
          fileName: fileInputRef.current?.files?.[0]?.name || 'import.csv'
        }
      });

      const { jobId: newJobId } = response.data.data;
      setJobId(newJobId);

      // Poll for progress
      pollJobStatus(newJobId);
    } catch (error) {
      toast({
        title: 'Import failed to start',
        description: error.response?.data?.error?.message || 'Failed to start import',
        variant: 'error'
      });
      setStep('preview');
      setIsLoading(false);
    }
  };

  const pollJobStatus = async (id) => {
    const poll = async () => {
      try {
        const response = await api.get(`/import/jobs/${id}`);
        const job = response.data.data;

        setProgress(job.progress || 0);

        if (job.status === 'completed') {
          setResults({
            created: job.success_count,
            updated: job.results?.updated?.length || 0,
            errors: job.error_count
          });
          setStep('complete');
          setIsLoading(false);
          
          toast({
            title: 'Import completed',
            description: `Created: ${job.success_count}, Errors: ${job.error_count}`,
            variant: job.error_count > 0 ? 'warning' : 'success'
          });
        } else if (job.status === 'failed') {
          setStep('preview');
          setIsLoading(false);
          toast({
            title: 'Import failed',
            description: 'Check error log for details',
            variant: 'error'
          });
        } else {
          // Continue polling
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error('Poll error:', error);
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/import/template/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'equipment-import-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download template',
        variant: 'error'
      });
    }
  };

  const fieldOptions = [
    { value: 'name', label: 'Item Name *', required: true },
    { value: 'sku', label: 'SKU' },
    { value: 'category', label: 'Category' },
    { value: 'description', label: 'Description' },
    { value: 'dailyRate', label: 'Daily Rate *', required: true },
    { value: 'weeklyRate', label: 'Weekly Rate' },
    { value: 'monthlyRate', label: 'Monthly Rate' },
    { value: 'imageUrl', label: 'Image URL' },
    { value: 'specifications', label: 'Specifications' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'location', label: 'Location' },
    { value: 'condition', label: 'Condition' },
    { value: 'status', label: 'Status' },
    { value: 'serialNumber', label: 'Serial Number' },
    { value: 'barcode', label: 'Barcode' }
  ];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        {['upload', 'mapping', 'preview', 'processing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-blue-600 text-white' :
              ['upload', 'mapping', 'preview', 'processing', 'complete'].indexOf(step) > i ?
              'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {['upload', 'mapping', 'preview', 'processing', 'complete'].indexOf(step) > i ?
                <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm capitalize ${step === s ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
              {s}
            </span>
            {i < 4 && <div className="w-12 h-0.5 mx-3 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Equipment CSV</CardTitle>
            <CardDescription>
              Import equipment from KM Rental or other CSV sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700">Click to upload CSV file</p>
              <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-4">Supports CSV files up to 10MB</p>
            </div>

            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-500">Need a template?</span>
              <Button variant="link" onClick={downloadTemplate} className="ml-2">
                <Download className="w-4 h-4 mr-1" />
                Download Template
              </Button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span className="text-gray-600">Validating CSV...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>Map CSV Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to equipment fields. Required fields are marked with *
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation && validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {validation.errors.slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {validation.errors.length > 5 && (
                      <li>...and {validation.errors.length - 5} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation && validation.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  <p className="font-medium">Warnings:</p>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {validation.warnings.slice(0, 3).map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                    {validation.warnings.length > 3 && (
                      <li>...and {validation.warnings.length - 3} more</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">CSV Column</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Maps To</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Sample Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {headers.map((header) => (
                    <tr key={header}>
                      <td className="px-4 py-3 font-mono text-xs">{header}</td>
                      <td className="px-4 py-3">
                        <select
                          value={mappings[header] || ''}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Skip --</option>
                          {fieldOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                        {/* Show sample value from first row */}
                        {csvData?.split('\n')[1]?.split(',')[headers.indexOf(header)]?.substring(0, 30)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Options */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Import Options
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor (for partner equipment)
                  </label>
                  <select
                    value={options.vendorId}
                    onChange={(e) => setOptions(prev => ({ ...prev, vendorId: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">-- None --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Category
                  </label>
                  <select
                    value={options.defaultCategoryId}
                    onChange={(e) => setOptions(prev => ({ ...prev, defaultCategoryId: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="">-- Auto-detect --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {options.vendorId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markup Multiplier: {options.markupMultiplier}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={options.markupMultiplier}
                    onChange={(e) => setOptions(prev => ({ ...prev, markupMultiplier: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rates will be multiplied by this factor for partner equipment
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button onClick={handlePreview} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Import
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review how your data will be imported
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">SKU</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Daily Rate</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((item, i) => (
                    <tr key={i} className={!item.valid ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2">
                        {item.valid ? (
                          <Badge variant="success" className="flex items-center w-fit">
                            <Check className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center w-fit">
                            <X className="w-3 h-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2">{item.transformed?.name || item.original?.name || '-'}</td>
                      <td className="px-4 py-2">{item.transformed?.sku || item.original?.sku || '-'}</td>
                      <td className="px-4 py-2">
                        ${item.transformed?.daily_rate || item.transformed?.dailyRate || '-'}
                      </td>
                      <td className="px-4 py-2">
                        {categories.find(c => c.id === item.transformed?.category_id)?.name || 
                         item.transformed?.category || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.some(p => !p.valid) && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Some rows have errors. Please review and fix your CSV file.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button 
                onClick={handleStartImport} 
                disabled={isLoading || preview.every(p => !p.valid)}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Step */}
      {step === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Equipment</CardTitle>
            <CardDescription>
              Please wait while we process your data...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-lg font-medium text-gray-700">Processing {totalRows} items...</p>
              <p className="text-sm text-gray-500 mt-1">Job ID: {jobId}</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {step === 'complete' && results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="w-6 h-6 mr-2 text-green-600" />
              Import Complete
            </CardTitle>
            <CardDescription>
              Your equipment has been successfully imported
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{results.created}</p>
                <p className="text-sm text-green-700">Created</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{results.updated}</p>
                <p className="text-sm text-blue-700">Updated</p>
              </div>
              <div className={`border rounded-lg p-4 text-center ${results.errors > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-2xl font-bold ${results.errors > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {results.errors}
                </p>
                <p className={`text-sm ${results.errors > 0 ? 'text-red-700' : 'text-gray-700'}`}>Errors</p>
              </div>
            </div>

            {results.errors > 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Some items failed to import. Check the import job details for error information.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center space-x-4 pt-4">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setCsvData(null);
                setResults(null);
                setJobId(null);
                setProgress(0);
              }}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Import Another File
              </Button>
              <Button onClick={onComplete}>
                <Check className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImportWizard;

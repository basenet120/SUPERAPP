import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, Upload, Search, Filter, MoreVertical, File, FileImage, 
  FileSpreadsheet, FileCode, FileAudio, FileVideo, Download, Eye,
  History, Share2, Signature, Trash2, CheckCircle, AlertCircle,
  Clock, User, Lock, Globe, Folder, ChevronRight, X, RefreshCw,
  Shield, Calendar, DollarSign, Building2, UserCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { FileUpload } from '../ui/FileUpload';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useDropzone } from 'react-dropzone';

// File icon based on mime type
function FileIcon({ mimeType, className = "w-8 h-8" }) {
  if (mimeType?.startsWith('image/')) return <FileImage className={className + " text-purple-500"} />;
  if (mimeType?.includes('pdf')) return <FileText className={className + " text-red-500"} />;
  if (mimeType?.includes('sheet') || mimeType?.includes('excel')) return <FileSpreadsheet className={className + " text-green-500"} />;
  if (mimeType?.includes('word') || mimeType?.includes('document')) return <FileText className={className + " text-blue-500"} />;
  if (mimeType?.startsWith('audio/')) return <FileAudio className={className + " text-amber-500"} />;
  if (mimeType?.startsWith('video/')) return <FileVideo className={className + " text-pink-500"} />;
  if (mimeType?.includes('code') || mimeType?.includes('json') || mimeType?.includes('xml')) return <FileCode className={className + " text-gray-500"} />;
  return <File className={className + " text-gray-400"} />;
}

// Format file size
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Document Type Badge
function DocumentTypeBadge({ type }) {
  const styles = {
    contract: 'bg-blue-100 text-blue-800',
    coi: 'bg-green-100 text-green-800',
    proposal: 'bg-purple-100 text-purple-800',
    invoice: 'bg-amber-100 text-amber-800',
    quote: 'bg-gray-100 text-gray-800',
    receipt: 'bg-gray-100 text-gray-800',
    permit: 'bg-red-100 text-red-800',
    license: 'bg-indigo-100 text-indigo-800',
    manual: 'bg-cyan-100 text-cyan-800',
    spec_sheet: 'bg-pink-100 text-pink-800',
    w9: 'bg-orange-100 text-orange-800',
    nda: 'bg-rose-100 text-rose-800',
    mou: 'bg-teal-100 text-teal-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const labels = {
    contract: 'Contract',
    coi: 'COI',
    proposal: 'Proposal',
    invoice: 'Invoice',
    quote: 'Quote',
    receipt: 'Receipt',
    permit: 'Permit',
    license: 'License',
    manual: 'Manual',
    spec_sheet: 'Spec Sheet',
    w9: 'W-9',
    nda: 'NDA',
    mou: 'MOU',
    other: 'Other'
  };

  return (
    <Badge className={styles[type] || styles.other}>
      {labels[type] || type}
    </Badge>
  );
}

// Upload Dialog
function UploadDialog({ onClose, onUpload }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [formData, setFormData] = useState({
    type: 'other',
    category: '',
    clientId: '',
    projectId: '',
    visibility: 'internal',
    requiresSignature: false
  });

  const onDrop = useCallback((acceptedFiles) => {
    setUploadedFiles(acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending'
    })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  });

  const handleUpload = () => {
    uploadedFiles.forEach(fileData => {
      onUpload({
        file: fileData.file,
        ...formData,
        name: fileData.name
      });
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500">or click to select files</p>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <FileIcon mimeType={file.type} className="w-5 h-5" />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Document Details */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'contract', label: 'Contract' },
                  { value: 'coi', label: 'Certificate of Insurance' },
                  { value: 'proposal', label: 'Proposal' },
                  { value: 'invoice', label: 'Invoice' },
                  { value: 'quote', label: 'Quote' },
                  { value: 'receipt', label: 'Receipt' },
                  { value: 'permit', label: 'Permit' },
                  { value: 'license', label: 'License' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'spec_sheet', label: 'Spec Sheet' },
                  { value: 'w9', label: 'W-9' },
                  { value: 'nda', label: 'NDA' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., 2024 Projects"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <Select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              options={[
                { value: 'private', label: 'Private (Only you)' },
                { value: 'internal', label: 'Internal (Team)' },
                { value: 'shared', label: 'Shared (Clients)' },
                { value: 'public', label: 'Public' }
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresSignature"
              checked={formData.requiresSignature}
              onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="requiresSignature" className="text-sm">Requires Signature</label>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleUpload}
          disabled={uploadedFiles.length === 0}
        >
          Upload {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
        </Button>
      </DialogFooter>
    </div>
  );
}

// Document Detail View
function DocumentDetail({ document, onClose }) {
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();

  const signMutation = useMutation({
    mutationFn: () => api.post(`/documents/${document.id}/sign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document signed successfully');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/documents/${document.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onClose();
      toast.success('Document deleted');
    }
  });

  const isExpiringSoon = document.expiryDate && 
    new Date(document.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    new Date(document.expiryDate) > new Date();

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {['details', 'versions', 'activity'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-medium capitalize ${
              activeTab === tab 
                ? 'border-b-2 border-brand-500 text-brand-600' 
                : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <>
          {/* Header */}
          <div className="flex items-start gap-4">
            <FileIcon mimeType={document.mimeType} className="w-16 h-16" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{document.name}</h3>
              <p className="text-gray-500 text-sm">{document.fileName}</p>
              <div className="flex items-center gap-2 mt-2">
                <DocumentTypeBadge type={document.type} />
                <Badge variant="outline">{formatFileSize(document.fileSize)}</Badge>
                {isExpired && <Badge variant="destructive">Expired</Badge>}
                {isExpiringSoon && <Badge variant="warning">Expiring Soon</Badge>}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Uploaded by:</span>
              <span className="ml-2 font-medium">{document.uploadedByName}</span>
            </div>
            <div>
              <span className="text-gray-500">Upload date:</span>
              <span className="ml-2 font-medium">
                {document.createdAt && format(new Date(document.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Version:</span>
              <span className="ml-2 font-medium">{document.version}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium capitalize">{document.status}</span>
            </div>
            {document.clientName && (
              <div>
                <span className="text-gray-500">Client:</span>
                <span className="ml-2 font-medium">{document.clientName}</span>
              </div>
            )}
            {document.expiryDate && (
              <div>
                <span className="text-gray-500">Expires:</span>
                <span className={`ml-2 font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                  {format(new Date(document.expiryDate), 'MMM d, yyyy')}
                </span>
              </div>
            )}
          </div>

          {/* Signature Status */}
          {document.requiresSignature && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Signature className="w-4 h-4" />
                    Signature Status
                  </h4>
                  <p className="text-sm text-gray-500 capitalize mt-1">
                    {document.signatureStatus}
                  </p>
                  {document.signedByName && (
                    <p className="text-sm text-gray-500">
                      Signed by {document.signedByName} on {document.signedAt && format(new Date(document.signedAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {document.signatureStatus === 'pending' && (
                  <Button onClick={() => signMutation.mutate()} disabled={signMutation.isPending}>
                    Sign Document
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="secondary" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Version History</h4>
            <Button variant="secondary" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Upload New Version
            </Button>
          </div>
          {/* Version list would go here */}
          <div className="text-center py-8 text-gray-500">
            <History className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Version history coming soon</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-3">
          <h4 className="font-medium">Activity Log</h4>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Activity log coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Document Management Component
export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [view, setView] = useState('grid'); // grid, list
  const queryClient = useQueryClient();

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', searchQuery, typeFilter, statusFilter],
    queryFn: () => api.get('/documents', {
      params: {
        search: searchQuery || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        limit: 50
      }
    }).then(r => r.data)
  });

  const { data: stats } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => api.get('/documents/statistics').then(r => r.data.data)
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      // In a real app, you'd upload to S3 first, then save the URL
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('name', data.name);
      formData.append('type', data.type);
      formData.append('category', data.category);
      formData.append('visibility', data.visibility);
      formData.append('requiresSignature', data.requiresSignature);
      
      // Mock upload - in real app upload to storage first
      const mockUrl = URL.createObjectURL(data.file);
      
      return api.post('/documents/upload', {
        name: data.name,
        fileUrl: mockUrl,
        fileName: data.file.name,
        mimeType: data.file.type,
        fileSize: data.file.size,
        type: data.type,
        category: data.category,
        visibility: data.visibility,
        requiresSignature: data.requiresSignature
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      setIsUploadOpen(false);
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Failed to upload document');
    }
  });

  const documents = documentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500">Manage contracts, COIs, and documents</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-brand-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">COIs</p>
                <p className="text-2xl font-bold text-green-600">{stats?.coiCount || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Signatures</p>
                <p className="text-2xl font-bold text-amber-600">{stats?.pendingSignatures || 0}</p>
              </div>
              <Signature className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-red-600">{stats?.expiringSoon || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'contract', label: 'Contracts' },
                { value: 'coi', label: 'COIs' },
                { value: 'proposal', label: 'Proposals' },
                { value: 'invoice', label: 'Invoices' }
              ]}
              className="w-40"
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending_review', label: 'Pending Review' },
                { value: 'approved', label: 'Approved' }
              ]}
              className="w-40"
            />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
              >
                Grid
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid/List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg mb-2">No documents found</p>
          <p className="text-sm mb-4">Upload your first document to get started</p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card 
              key={doc.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedDocument(doc)}
            >
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <FileIcon mimeType={doc.mimeType} className="w-12 h-12" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium truncate" title={doc.name}>{doc.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.fileSize)}</p>
                  <div className="flex justify-center gap-1 mt-2">
                    <DocumentTypeBadge type={doc.type} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {doc.createdAt && format(new Date(doc.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Document</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileIcon mimeType={doc.mimeType} className="w-8 h-8" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-gray-500">{doc.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <DocumentTypeBadge type={doc.type} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="capitalize">
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {doc.createdAt && format(new Date(doc.createdAt), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <UploadDialog 
            onClose={() => setIsUploadOpen(false)}
            onUpload={(data) => uploadMutation.mutate(data)}
          />
        </DialogContent>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <DocumentDetail 
              document={selectedDocument}
              onClose={() => setSelectedDocument(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

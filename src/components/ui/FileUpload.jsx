import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, File, Loader2, CheckCircle } from 'lucide-react';

// File Upload Component with Drag & Drop
export function FileUpload({
  onUpload,
  accept = {},
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 1,
  label = 'Drop files here or click to browse',
  sublabel = 'Supported formats: PDF, JPG, PNG',
  uploadProgress = null,
  className = '',
}) {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File is too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type');
      }
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));

    // Call onUpload callback
    if (onUpload) {
      newFiles.forEach(fileObj => {
        onUpload(fileObj.file, fileObj.id);
      });
    }
  }, [maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
  });

  const removeFile = (id) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-brand-500 bg-brand-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${!isDragActive && !isDragReject ? 'border-primary-200 hover:border-brand-400 hover:bg-primary-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-primary-400 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-primary-700 mb-1">{label}</p>
        <p className="text-xs text-primary-500">{sublabel}</p>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileObj) => {
            const Icon = getFileIcon(fileObj.file);
            const progress = uploadProgress?.[fileObj.id];
            const isComplete = progress === 100;
            const isUploading = progress !== undefined && progress < 100;

            return (
              <div
                key={fileObj.id}
                className="flex items-center gap-3 p-3 bg-white border border-primary-200 rounded-lg"
              >
                {/* Preview or Icon */}
                {fileObj.preview ? (
                  <img
                    src={fileObj.preview}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary-900 truncate">
                    {fileObj.file.name}
                  </p>
                  <p className="text-xs text-primary-500">
                    {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Status or Remove */}
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-success-600" />
                ) : isUploading ? (
                  <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
                ) : (
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="p-1.5 text-primary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// COI Upload Component
export function COIUpload({ bookingId, onUploadComplete, onCancel }) {
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file, fileId) => {
    setIsUploading(true);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
      }));
    }, 200);

    try {
      // In real implementation, this would call the API
      // await bookingAPI.uploadCOI(bookingId, file);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      
      setTimeout(() => {
        onUploadComplete?.();
      }, 500);
    } catch (error) {
      clearInterval(interval);
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-900">Upload COI</h3>
          <p className="text-sm text-primary-500">
            Certificate of Insurance for booking #{bookingId}
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-primary-400 hover:text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <FileUpload
        onUpload={handleUpload}
        accept={{ 'application/pdf': ['.pdf'] }}
        maxSize={5 * 1024 * 1024} // 5MB
        label="Drop COI PDF here or click to browse"
        sublabel="Only PDF files up to 5MB"
        uploadProgress={uploadProgress}
      />

      <div className="mt-4 p-3 bg-warning-50 border border-warning-200 rounded-lg">
        <p className="text-xs text-warning-700">
          <strong>Requirements:</strong> COI must include General Liability coverage 
          of at least $2M and list Base Creative as additional insured.
        </p>
      </div>
    </div>
  );
}

// Image Upload Component
export function ImageUpload({ 
  onUpload, 
  maxSize = 5 * 1024 * 1024,
  aspectRatio = null,
  label = 'Upload image',
  className = ''
}) {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setIsUploading(true);
    try {
      await onUpload?.(file);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize,
    maxFiles: 1,
  });

  return (
    <div className={className}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Upload preview"
            className={`w-full rounded-xl object-cover ${
              aspectRatio ? `aspect-[${aspectRatio}]` : 'h-48'
            }`}
          />
          <button
            onClick={() => {
              URL.revokeObjectURL(preview);
              setPreview(null);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 text-primary-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-primary-200 hover:border-brand-400 hover:bg-primary-50'}
          `}
        >
          <input {...getInputProps()} />
          <ImageIcon className="w-8 h-8 text-primary-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium text-primary-700">{label}</p>
          <p className="text-xs text-primary-500 mt-1">
            JPG, PNG or WebP up to {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      )}
    </div>
  );
}

// Multi-file Upload Component
export function MultiFileUpload({
  onUpload,
  onRemove,
  files = [],
  accept = {},
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  label = 'Upload files',
}) {
  const handleDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach(file => {
      onUpload?.(file);
    });
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return ImageIcon;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div>
      {/* Dropzone */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all mb-4
            ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-primary-200 hover:border-brand-400 hover:bg-primary-50'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-6 h-6 text-primary-400 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-xs text-primary-500">{label}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file);
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-2 bg-white border border-primary-200 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-primary-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => onRemove?.(index)}
                  className="p-1 text-primary-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FileUpload;

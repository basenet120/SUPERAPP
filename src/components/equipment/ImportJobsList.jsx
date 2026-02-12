import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Check, 
  X, 
  Loader2, 
  RotateCcw, 
  Download,
  Clock,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const ImportJobsList = ({ onBack }) => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await api.get('/import/jobs?limit=20');
      setJobs(response.data.data || []);
    } catch (error) {
      toast({
        title: 'Failed to load jobs',
        description: error.response?.data?.error?.message || 'Could not fetch import jobs',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelJob = async (jobId) => {
    try {
      await api.post(`/import/jobs/${jobId}/cancel`);
      toast({
        title: 'Job cancelled',
        description: 'The import job has been cancelled',
        variant: 'success'
      });
      loadJobs();
    } catch (error) {
      toast({
        title: 'Failed to cancel',
        description: error.response?.data?.error?.message || 'Could not cancel job',
        variant: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startDate, endDate) => {
    if (!startDate) return '-';
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(startDate);
    const seconds = Math.floor((end - start) / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'warning', icon: Loader2 },
      completed: { variant: 'success', icon: Check },
      failed: { variant: 'destructive', icon: X },
      cancelled: { variant: 'secondary', icon: X }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Import Jobs</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            History of CSV import operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadJobs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No import jobs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium">{job.file_name || 'Untitled Import'}</h4>
                      {getStatusBadge(job.status)}
                      <Badge variant="outline" className="capitalize">
                        {job.type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400">Total Rows:</span>
                        <span className="ml-2 font-medium">{job.total_rows}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Success:</span>
                        <span className="ml-2 font-medium text-green-600">{job.success_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Errors:</span>
                        <span className={`ml-2 font-medium ${job.error_count > 0 ? 'text-red-600' : ''}`}>
                          {job.error_count}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(job.created_at, job.completed_at)}
                        </span>
                      </div>
                    </div>

                    {(job.status === 'processing' || job.status === 'pending') && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-1.5" />
                      </div>
                    )}

                    <div className="mt-2 text-xs text-gray-400">
                      Created: {formatDate(job.created_at)} by {job.created_by_name}
                    </div>

                    {job.error_log && job.error_log.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded text-sm">
                        <p className="font-medium text-red-700 mb-1">Errors:</p>
                        <ul className="list-disc list-inside text-red-600">
                          {job.error_log.slice(0, 3).map((err, i) => (
                            <li key={i}>
                              {err.sku && `SKU: ${err.sku} - `}{err.error}
                            </li>
                          ))}
                          {job.error_log.length > 3 && (
                            <li>...and {job.error_log.length - 3} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {(job.status === 'processing' || job.status === 'pending') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelJob(job.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportJobsList;

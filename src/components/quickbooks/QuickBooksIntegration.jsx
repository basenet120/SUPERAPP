import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { 
  Link2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Users,
  FileText
} from 'lucide-react';

function QuickBooksIntegration() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await api.get('/quickbooks/status');
      setConnectionStatus(response.data.connected ? 'connected' : 'disconnected');
      if (response.data.connected) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error checking QuickBooks status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/quickbooks/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleConnect = () => {
    // Redirect to QuickBooks OAuth
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/quickbooks/auth`;
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      await api.post('/quickbooks/sync');
      toast({ title: 'Sync Started', description: 'QuickBooks sync is in progress' });
      fetchStats();
    } catch (error) {
      toast({ 
        title: 'Sync Failed', 
        description: error.response?.data?.message || 'Failed to sync with QuickBooks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QuickBooks Integration</h1>
          <p className="text-gray-500 mt-1">Connect and sync with QuickBooks Online</p>
        </div>
        <Badge variant={connectionStatus === 'connected' ? 'success' : 'secondary'}>
          {connectionStatus === 'connected' ? 'Connected' : 'Not Connected'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectionStatus === 'connected' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Successfully connected to QuickBooks Online</span>
              </div>
              <Button onClick={handleSync} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span>Not connected to QuickBooks</span>
              </div>
              <Button onClick={handleConnect}>
                <Link2 className="w-4 h-4 mr-2" />
                Connect to QuickBooks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customers Synced</p>
                  <p className="text-2xl font-bold">{stats.customers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Invoices Synced</p>
                  <p className="text-2xl font-bold">{stats.invoices || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payments Synced</p>
                  <p className="text-2xl font-bold">{stats.payments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default QuickBooksIntegration;
import { useState, useEffect, useCallback } from 'react';
import { 
  Package, Search, Plus, Check, ChevronLeft, ChevronRight,
  Box, Lightbulb, Camera, Wrench, Zap, Film, Grid, Mic, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORY_ICONS = {
  'Grip & Support': Box,
  'Lighting': Lightbulb,
  'Lenses': Camera,
  'Accessories': Wrench,
  'Power': Zap,
  'Cameras': Film,
  'Production': Grid,
  'Motion': Film,
  'Sound': Mic,
  'Styling': Box
};

const CATEGORIES = [
  'All', 'Grip & Support', 'Lighting', 'Lenses', 'Accessories', 
  'Power', 'Cameras', 'Production', 'Motion', 'Sound', 'Styling'
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function EquipmentManagement() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  
  const loadEquipment = useCallback(async () => {
    // Wait for auth to be ready
    if (authLoading) return;
    
    if (!isAuthenticated) {
      setError('Please log in to view equipment');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Session expired - please log in again');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '24');
      if (category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      
      const response = await axios.get(`${API_URL}/equipment?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data?.success) {
        setEquipment(response.data.data || []);
        setTotal(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setError(response.data?.error?.message || 'Failed to load equipment');
      }
    } catch (err) {
      console.error('Load error:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to load';
      setError(msg);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken');
        setError('Session expired - please log in again');
      }
    } finally {
      setLoading(false);
    }
  }, [page, category, search, isAuthenticated, authLoading]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const getDayRate = (item) => {
    if (!item) return 0;
    return item.base_price || item.selling_price || (item.km_price ? parseFloat(item.km_price) * 2.5 : 0) || 0;
  };

  const addToCart = (e, item) => {
    e?.stopPropagation();
    if (!item) return;
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, qty: 1 }]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Equipment</h2>
          <p className="text-slate-500 text-sm">
            {loading ? 'Loading...' : `${total} items`}
            {cart.length > 0 && ` • ${cart.reduce((a,c) => a + c.qty, 0)} in cart`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg">
          <p className="font-medium">{error}</p>
          <div className="mt-2 flex gap-2">
            <button 
              onClick={loadEquipment}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
            {!isAuthenticated && (
              <button 
                onClick={() => window.location.reload()}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
          <span className="ml-3 text-slate-600">Loading equipment...</span>
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {equipment.map(item => {
              const Icon = CATEGORY_ICONS[item.category] || Package;
              const price = getDayRate(item);
              const inCart = cart.find(c => c.id === item.id);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Image */}
                  <div className="h-32 bg-slate-100 flex items-center justify-center">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">{item.category}</p>
                    <h3 className="font-semibold text-slate-900 text-sm mt-0.5 line-clamp-2">{item.name}</h3>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-bold text-slate-900">${price.toFixed(0)}</span>
                        <span className="text-xs text-slate-500">/day</span>
                      </div>
                      
                      <button
                        onClick={(e) => addToCart(e, item)}
                        className={`p-2 rounded-lg transition-colors ${
                          inCart 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {inCart && (
                      <p className="text-xs text-green-600 mt-2">{inCart.qty} in cart</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty */}
          {equipment.length === 0 && !error && !loading && (
            <div className="text-center py-20 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No equipment found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selected && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500">{selected.category}</p>
                  <h3 className="text-xl font-bold text-slate-900">{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                {selected.image_url ? (
                  <img src={selected.image_url} alt={selected.name} className="w-full h-full object-contain" />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-slate-500">SKU</p>
                  <p className="font-medium">{selected.sku}</p>
                </div>
                <div>
                  <p className="text-slate-500">Daily Rate</p>
                  <p className="font-medium">${getDayRate(selected).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Type</p>
                  <p className="font-medium capitalize">{selected.type?.replace('_', ' ') || 'Partner'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-medium">{selected.availability || 'Available'}</p>
                </div>
              </div>
              
              {selected.description && (
                <div className="mb-4">
                  <p className="text-slate-500 text-sm mb-1">Description</p>
                  <p className="text-sm">{selected.description}</p>
                </div>
              )}
              
              <button
                onClick={(e) => { addToCart(e, selected); setSelected(null); }}
                className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

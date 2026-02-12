import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import {
  TrendingUp, DollarSign, Package, Users, Download, Calendar,
  Filter, ChevronDown, FileText, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';

// Sample revenue data (last 12 months)
const REVENUE_DATA = [
  { month: 'Mar', revenue: 45000, bookings: 12, equipment: 8 },
  { month: 'Apr', revenue: 52000, bookings: 15, equipment: 10 },
  { month: 'May', revenue: 48000, bookings: 14, equipment: 9 },
  { month: 'Jun', revenue: 61000, bookings: 18, equipment: 12 },
  { month: 'Jul', revenue: 58000, bookings: 17, equipment: 11 },
  { month: 'Aug', revenue: 67000, bookings: 20, equipment: 14 },
  { month: 'Sep', revenue: 72000, bookings: 22, equipment: 15 },
  { month: 'Oct', revenue: 69000, bookings: 21, equipment: 13 },
  { month: 'Nov', revenue: 75000, bookings: 24, equipment: 16 },
  { month: 'Dec', revenue: 82000, bookings: 26, equipment: 18 },
  { month: 'Jan', revenue: 65000, bookings: 19, equipment: 12 },
  { month: 'Feb', revenue: 78000, bookings: 23, equipment: 15 },
];

// Equipment utilization data
const EQUIPMENT_UTILIZATION = [
  { category: 'Cameras', total: 8, rented: 6.2, utilization: 77.5 },
  { category: 'Lighting', total: 25, rented: 18.5, utilization: 74.0 },
  { category: 'Lenses', total: 15, rented: 9.8, utilization: 65.3 },
  { category: 'Sound', total: 12, rented: 8.4, utilization: 70.0 },
  { category: 'Motion', total: 10, rented: 5.5, utilization: 55.0 },
  { category: 'Grip', total: 40, rented: 28, utilization: 70.0 },
];

// Revenue by equipment category
const REVENUE_BY_CATEGORY = [
  { name: 'Cameras', value: 285000, color: '#0ea5e9' },
  { name: 'Lighting', value: 195000, color: '#22c55e' },
  { name: 'Lenses', value: 145000, color: '#f59e0b' },
  { name: 'Sound', value: 98000, color: '#8b5cf6' },
  { name: 'Motion', value: 76000, color: '#ec4899' },
  { name: 'Other', value: 42000, color: '#64748b' },
];

// Top clients by revenue
const TOP_CLIENTS = [
  { name: 'Nike', revenue: 145000, bookings: 28, avgBooking: 5179 },
  { name: 'Apple', revenue: 132000, bookings: 15, avgBooking: 8800 },
  { name: 'Netflix', revenue: 118000, bookings: 22, avgBooking: 5364 },
  { name: 'Google', revenue: 105000, bookings: 18, avgBooking: 5833 },
  { name: 'HBO', revenue: 98000, bookings: 24, avgBooking: 4083 },
  { name: 'Spotify', revenue: 87000, bookings: 19, avgBooking: 4579 },
  { name: 'Meta', revenue: 76000, bookings: 12, avgBooking: 6333 },
  { name: 'Amazon', revenue: 68000, bookings: 14, avgBooking: 4857 },
];

// Monthly equipment rental days
const MONTHLY_RENTAL_DAYS = [
  { month: 'Mar', cameras: 180, lighting: 420, lenses: 280, sound: 195 },
  { month: 'Apr', cameras: 220, lighting: 480, lenses: 310, sound: 225 },
  { month: 'May', cameras: 195, lighting: 450, lenses: 290, sound: 210 },
  { month: 'Jun', cameras: 260, lighting: 520, lenses: 350, sound: 260 },
  { month: 'Jul', cameras: 240, lighting: 490, lenses: 320, sound: 240 },
  { month: 'Aug', cameras: 280, lighting: 580, lenses: 380, sound: 290 },
  { month: 'Sep', cameras: 310, lighting: 620, lenses: 410, sound: 315 },
  { month: 'Oct', cameras: 295, lighting: 590, lenses: 395, sound: 300 },
  { month: 'Nov', cameras: 340, lighting: 650, lenses: 430, sound: 340 },
  { month: 'Dec', cameras: 380, lighting: 720, lenses: 480, sound: 380 },
  { month: 'Jan', cameras: 260, lighting: 540, lenses: 350, sound: 260 },
  { month: 'Feb', cameras: 320, lighting: 640, lenses: 420, sound: 320 },
];

// Booking status breakdown
const BOOKING_STATUS = [
  { name: 'Confirmed', value: 168, color: '#22c55e' },
  { name: 'Pending', value: 42, color: '#f59e0b' },
  { name: 'Completed', value: 289, color: '#0ea5e9' },
  { name: 'Cancelled', value: 23, color: '#ef4444' },
];

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export default function ReportingDashboard() {
  const [dateRange, setDateRange] = useState('12months');
  const [exportFormat, setExportFormat] = useState(null);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalRevenue = REVENUE_DATA.reduce((sum, d) => sum + d.revenue, 0);
    const avgMonthlyRevenue = totalRevenue / REVENUE_DATA.length;
    const totalBookings = REVENUE_DATA.reduce((sum, d) => sum + d.bookings, 0);
    const avgEquipmentUtilization = EQUIPMENT_UTILIZATION.reduce((sum, d) => sum + d.utilization, 0) / EQUIPMENT_UTILIZATION.length;
    
    return {
      totalRevenue,
      avgMonthlyRevenue,
      totalBookings,
      avgEquipmentUtilization: avgEquipmentUtilization.toFixed(1)
    };
  }, []);

  const handleExport = (format) => {
    setExportFormat(format);
    setTimeout(() => setExportFormat(null), 2000);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-primary-200 rounded-lg shadow-lg">
          <p className="font-semibold text-primary-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-primary-600">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.name === 'revenue' ? `$${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">Reports & Analytics</h2>
          <p className="text-primary-500 mt-1">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field w-auto"
          >
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
          
          <div className="relative">
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" strokeWidth={1.5} />
              Export
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-primary-200 rounded-lg shadow-lg py-1 z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50"
              >
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">Total Revenue</p>
              <p className="text-2xl font-bold text-primary-900 font-tabular">
                ${(metrics.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-success-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="w-4 h-4 text-success-500" strokeWidth={1.5} />
            <span className="text-sm text-success-600 font-medium">+12.5%</span>
            <span className="text-sm text-primary-400">vs last year</span>
          </div>
        </div>

        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">Avg Monthly Revenue</p>
              <p className="text-2xl font-bold text-primary-900 font-tabular">
                ${(metrics.avgMonthlyRevenue / 1000).toFixed(1)}k
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-brand-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="w-4 h-4 text-success-500" strokeWidth={1.5} />
            <span className="text-sm text-success-600 font-medium">+8.3%</span>
            <span className="text-sm text-primary-400">vs last period</span>
          </div>
        </div>

        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">Total Bookings</p>
              <p className="text-2xl font-bold text-primary-900 font-tabular">
                {metrics.totalBookings}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="w-4 h-4 text-success-500" strokeWidth={1.5} />
            <span className="text-sm text-success-600 font-medium">+15.2%</span>
            <span className="text-sm text-primary-400">vs last year</span>
          </div>
        </div>

        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-500">Equipment Utilization</p>
              <p className="text-2xl font-bold text-primary-900 font-tabular">
                {metrics.avgEquipmentUtilization}%
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-warning-600" strokeWidth={1.5} />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <TrendingUp className="w-4 h-4 text-success-500" strokeWidth={1.5} />
            <span className="text-sm text-success-600 font-medium">+5.7%</span>
            <span className="text-sm text-primary-400">vs last month</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary-900">Revenue Overview</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-500"></div>
              <span className="text-sm text-primary-500">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
              <span className="text-sm text-primary-500">Bookings</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
              <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="bookings" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-6">Revenue by Equipment Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_BY_CATEGORY}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {REVENUE_BY_CATEGORY.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status */}
        <div className="bg-white border border-primary-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-6">Booking Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={BOOKING_STATUS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {BOOKING_STATUS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Equipment Utilization */}
      <div className="bg-white border border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-primary-900">Equipment Utilization by Category</h3>
          <Badge variant="default">Avg: {metrics.avgEquipmentUtilization}%</Badge>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EQUIPMENT_UTILIZATION} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="category" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="utilization" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30}>
                {EQUIPMENT_UTILIZATION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.utilization > 70 ? '#22c55e' : entry.utilization > 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Rental Days */}
      <div className="bg-white border border-primary-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-6">Monthly Equipment Rental Days</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_RENTAL_DAYS}>
              <defs>
                <linearGradient id="colorCameras" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLighting" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="cameras" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCameras)" stackId="1" />
              <Area type="monotone" dataKey="lighting" stroke="#22c55e" fillOpacity={1} fill="url(#colorLighting)" stackId="1" />
              <Area type="monotone" dataKey="lenses" stroke="#f59e0b" fill="#f59e0b" stackId="1" />
              <Area type="monotone" dataKey="sound" stroke="#8b5cf6" fill="#8b5cf6" stackId="1" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-primary-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary-900">Top Clients by Revenue</h3>
            <button 
              onClick={() => handleExport('csv')}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-50">
              <tr>
                <th className="text-left text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Client</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Revenue</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Bookings</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">Avg Booking</th>
                <th className="text-right text-xs font-semibold text-primary-600 uppercase tracking-wider px-6 py-3">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {TOP_CLIENTS.map((client, index) => (
                <tr key={client.name} className="hover:bg-primary-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-primary-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-tabular font-medium text-primary-900">
                    ${client.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-primary-600">
                    {client.bookings}
                  </td>
                  <td className="px-6 py-4 text-right font-tabular text-primary-600">
                    ${client.avgBooking.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-primary-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${(client.revenue / metrics.totalRevenue * 100 * 3)}%` }}
                        />
                      </div>
                      <span className="text-sm text-primary-500 w-12">
                        {((client.revenue / metrics.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Notification */}
      {exportFormat && (
        <div className="fixed bottom-6 right-6 bg-success-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-5 h-5" strokeWidth={1.5} />
          <span>Exporting as {exportFormat.toUpperCase()}...</span>
        </div>
      )}
    </div>
  );
}
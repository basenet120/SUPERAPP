import { useState, useMemo, useEffect } from 'react';
import { 
  Package, Grid, Calendar, Search, Plus, Minus, X, 
  Check, ChevronRight, Info, Star, Clock, Camera,
  Mic, Lightbulb, Zap, Film, Box, Wrench, ArrowLeft,
  ChevronLeft, ChevronRight as ChevronRightIcon, Upload, FileText
} from 'lucide-react';
import CSVImportWizard from './CSVImportWizard';
import ImportJobsList from './ImportJobsList';
import { EQUIPMENT_DATA, EQUIPMENT_CATEGORIES } from './kmRentalEquipment';
import { EQUIPMENT_PACKAGES, EQUIPMENT_SPECS, getDefaultSpecs, generateAvailabilityData } from './equipmentPackages';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

// Generate availability data
const AVAILABILITY_DATA = generateAvailabilityData();

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
  'Styling': Box,
  'Packages': Package
};

export default function EquipmentManagement() {
  const [activeView, setActiveView] = useState('browse'); // browse, packages, calendar, detail, import, import-jobs
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; // Show 24 items per page

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return EQUIPMENT_DATA.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEquipment.slice(start, start + itemsPerPage);
  }, [filteredEquipment, currentPage]);

  const addToCart = (equipmentId, quantity = 1) => {
    const existingItem = cart.find(item => item.id === equipmentId);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === equipmentId
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { id: equipmentId, quantity }]);
    }
  };

  const addPackageToCart = (pkg) => {
    pkg.items.forEach(item => {
      addToCart(item.id, item.quantity);
    });
  };

  const getEquipmentById = (id) => EQUIPMENT_DATA.find(e => e.id === id);

  const renderBrowseView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">Equipment Browser</h2>
          <p className="text-primary-500 mt-1">Browse our complete inventory of in-house and partner equipment</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'All'
              ? 'bg-brand-600 text-white'
              : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-50'
          }`}
        >
          All Equipment
        </button>
        {EQUIPMENT_CATEGORIES.map(category => {
          const Icon = CATEGORY_ICONS[category] || Box;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {category}
            </button>
          );
        })}
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {paginatedEquipment.map(equipment => {
          const dayRate = getDayRate(equipment);
          const inCart = cart.find(item => item.id === equipment.id);
          const Icon = CATEGORY_ICONS[equipment.category] || Box;

          return (
            <div
              key={equipment.id}
              onClick={() => setSelectedEquipment(equipment)}
              className="group bg-white border border-primary-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Image Area */}
              <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative overflow-hidden">
                <Icon className="w-16 h-16 text-primary-300 group-hover:scale-110 transition-transform" strokeWidth={1} />
                <div className="absolute top-3 right-3">
                  <Badge variant={equipment.type === 'in_house' ? 'success' : 'default'}>
                    {equipment.type === 'in_house' ? 'In House' : 'Partner'}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant={
                    equipment.availability === 'In Stock' ? 'success' :
                    equipment.availability === 'Limited' ? 'warning' : 'default'
                  }>
                    {equipment.availability}
                  </Badge>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white text-brand-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                    View Details
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-primary-500 uppercase tracking-wide">{equipment.category}</span>
                    <h3 className="font-semibold text-primary-900 mt-0.5 group-hover:text-brand-600 transition-colors">{equipment.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-primary-500 mt-2 line-clamp-2">{equipment.description}</p>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-100">
                  <div>
                    <span className="text-xl font-bold text-primary-900 font-tabular">${dayRate.toFixed(0)}</span>
                    <span className="text-sm text-primary-500">/day</span>
                  </div>
                  {inCart ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {inCart.quantity} in cart
                    </Badge>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(equipment.id);
                      }}
                      className="btn-secondary text-sm py-1.5 px-3"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50"
          >
            Previous
          </button>
          <span className="text-sm text-primary-600">
            Page {currentPage} of {totalPages} ({filteredEquipment.length} items)
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-50"
          >
            Next
          </button>
        </div>
      )}

      {filteredEquipment.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-primary-400" strokeWidth={1.5} />
          </div>
          <p className="text-primary-500 text-lg">No equipment found</p>
          <p className="text-primary-400 text-sm mt-1">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );

  const renderPackagesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">Equipment Packages</h2>
          <p className="text-primary-500 mt-1">Pre-configured kits for common production needs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {EQUIPMENT_PACKAGES.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(pkg)}
            className="group bg-white border border-primary-200 rounded-xl overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer"
          >
            <div className="flex">
              {/* Image/Icon Section */}
              <div className="w-32 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center shrink-0">
                <span className="text-5xl">{pkg.image}</span>
              </div>

              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-primary-900 group-hover:text-brand-600 transition-colors">{pkg.name}</h3>
                      {pkg.popular && (
                        <Badge variant="warning" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-primary-500 mt-1">{pkg.description}</p>
                  </div>
                </div>

                {/* Ideal For */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pkg.idealFor.slice(0, 3).map(use => (
                    <span key={use} className="text-xs px-2 py-1 bg-primary-100 text-primary-600 rounded-full">
                      {use}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-100">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-primary-500">
                      <Clock className="w-4 h-4" strokeWidth={1.5} />
                      {pkg.setupTime}
                    </span>
                    <span className="flex items-center gap-1.5 text-primary-500">
                      <Package className="w-4 h-4" strokeWidth={1.5} />
                      {pkg.items.length} items
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-900 font-tabular">${pkg.basePrice}</span>
                      <span className="text-xs text-success-600 font-medium">Save ${pkg.savings}</span>
                    </div>
                    <span className="text-xs text-primary-400">per day</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">Availability Calendar</h2>
            <p className="text-primary-500 mt-1">Check equipment availability across dates</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <span className="text-lg font-semibold text-primary-900 min-w-[140px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Category Filter for Calendar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'All'
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-50'
            }`}
          >
            All
          </button>
          {EQUIPMENT_CATEGORIES.slice(0, 6).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-primary-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-primary-600 bg-primary-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {prevMonthDays.map((_, i) => (
              <div key={`prev-${i}`} className="min-h-[100px] bg-primary-25 border-b border-r border-primary-100"></div>
            ))}
            {days.map(day => {
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              // Calculate availability summary for this date
              const equipmentToCheck = selectedCategory === 'All' 
                ? EQUIPMENT_DATA 
                : EQUIPMENT_DATA.filter(e => e.category === selectedCategory);
              
              let availableCount = 0;
              let limitedCount = 0;
              let bookedCount = 0;

              equipmentToCheck.forEach(eq => {
                const avail = AVAILABILITY_DATA[eq.id]?.[dateStr];
                if (avail) {
                  if (avail.status === 'available') availableCount++;
                  else if (avail.status === 'limited') limitedCount++;
                  else bookedCount++;
                }
              });

              const totalItems = equipmentToCheck.length;
              const availabilityPercent = totalItems > 0 ? (availableCount / totalItems) * 100 : 0;

              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-2 border-b border-r border-primary-100 transition-colors hover:bg-primary-50 ${
                    isToday ? 'bg-brand-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isToday ? 'text-brand-600' : 'text-primary-700'}`}>
                      {day}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-semibold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded">
                        TODAY
                      </span>
                    )}
                  </div>

                  {totalItems > 0 && (
                    <div className="space-y-1">
                      {/* Availability Bar */}
                      <div className="h-1.5 bg-primary-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            availabilityPercent > 70 ? 'bg-success-500' :
                            availabilityPercent > 30 ? 'bg-warning-500' : 'bg-danger-500'
                          }`}
                          style={{ width: `${availabilityPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-primary-500">
                        <span>{availableCount} avail</span>
                        {limitedCount > 0 && <span className="text-warning-600">{limitedCount} ltd</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="text-primary-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-500"></div>
            <span className="text-primary-600">Limited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-500"></div>
            <span className="text-primary-600">Booked</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEquipmentDetail = () => {
    if (!selectedEquipment) return null;
    const specs = EQUIPMENT_SPECS[selectedEquipment.id] || getDefaultSpecs(selectedEquipment);
    const dayRate = getDayRate(selectedEquipment);
    const availability = AVAILABILITY_DATA[selectedEquipment.id];

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedEquipment(null)}
          className="flex items-center gap-2 text-primary-500 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl aspect-square flex items-center justify-center">
            {(() => {
              const Icon = CATEGORY_ICONS[selectedEquipment.category] || Box;
              return <Icon className="w-32 h-32 text-primary-300" strokeWidth={0.5} />;
            })()}
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={selectedEquipment.type === 'in_house' ? 'success' : 'default'}>
                  {selectedEquipment.type === 'in_house' ? 'In House' : 'Partner Equipment'}
                </Badge>
                <Badge variant={
                  selectedEquipment.availability === 'In Stock' ? 'success' :
                  selectedEquipment.availability === 'Limited' ? 'warning' : 'default'
                }>
                  {selectedEquipment.availability}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-primary-900">{selectedEquipment.name}</h1>
              <p className="text-primary-500 mt-2">{selectedEquipment.description}</p>
            </div>

            {/* Pricing */}
            <div className="bg-primary-50 rounded-xl p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-900 font-tabular">${dayRate.toFixed(0)}</span>
                <span className="text-primary-500">/ day</span>
              </div>
              {selectedEquipment.type === 'partner' && (
                <p className="text-sm text-primary-500 mt-1">
                  Partner rate: ${selectedEquipment.kmPrice}/day (KM Rental)
                </p>
              )}
            </div>

            {/* Specs */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary-900">Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(specs).filter(([key]) => 
                  !['imageUrl', 'includes', 'features'].includes(key)
                ).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-primary-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <p className="text-primary-700 font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            {specs.features && (
              <div className="space-y-3">
                <h3 className="font-semibold text-primary-900">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {specs.features.map(feature => (
                    <span key={feature} className="text-sm px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Includes */}
            {specs.includes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-primary-900">Includes</h3>
                <ul className="space-y-1.5">
                  {specs.includes.map(item => (
                    <li key={item} className="flex items-center gap-2 text-sm text-primary-600">
                      <Check className="w-4 h-4 text-success-500" strokeWidth={2} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => addToCart(selectedEquipment.id)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                Add to Cart
              </button>
              <button className="btn-secondary flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" strokeWidth={1.5} />
                Check Dates
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPackageDetail = () => {
    if (!selectedPackage) return null;

    return (
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedPackage.image}</span>
              <div>
                <div className="text-2xl">{selectedPackage.name}</div>
                <p className="text-sm font-normal text-primary-500">{selectedPackage.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5 text-primary-500">
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                Setup: {selectedPackage.setupTime}
              </span>
              <span className="flex items-center gap-1.5 text-primary-500">
                <Package className="w-4 h-4" strokeWidth={1.5} />
                {selectedPackage.items.length} items
              </span>
              <span className="flex items-center gap-1.5 text-success-600 font-medium">
                <Star className="w-4 h-4" strokeWidth={1.5} />
                Save ${selectedPackage.savings}
              </span>
            </div>

            {/* Ideal For */}
            <div>
              <h4 className="text-sm font-semibold text-primary-900 mb-2">Ideal For</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPackage.idealFor.map(use => (
                  <span key={use} className="text-sm px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full">
                    {use}
                  </span>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-sm font-semibold text-primary-900 mb-3">Package Contents</h4>
              <div className="space-y-2">
                {selectedPackage.items.map(item => {
                  const equipment = getEquipmentById(item.id);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-semibold text-primary-600">
                          {item.quantity}
                        </span>
                        <span className="text-primary-900">{item.name}</span>
                      </div>
                      {equipment && (
                        <span className="text-sm text-primary-500">
                          ${getDayRate(equipment).toFixed(0)}/day
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-primary-200">
              <div>
                <span className="text-sm text-primary-500">Package Rate</span>
                <div className="text-3xl font-bold text-primary-900 font-tabular">${selectedPackage.basePrice}</div>
                <span className="text-sm text-primary-400">per day</span>
              </div>
              <button
                onClick={() => {
                  addPackageToCart(selectedPackage);
                  setSelectedPackage(null);
                }}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                Add Package to Cart
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      {!selectedEquipment && (
        <div className="flex items-center gap-2 border-b border-primary-200">
          <button
            onClick={() => setActiveView('browse')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'browse'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Grid className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Browse
          </button>
          <button
            onClick={() => setActiveView('packages')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'packages'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Package className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Packages
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'calendar'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Availability
          </button>
          <button
            onClick={() => setActiveView('import')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'import' || activeView === 'import-jobs'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-primary-500 hover:text-primary-700'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
            Import
          </button>
          {(activeView === 'import' || activeView === 'import-jobs') && (
            <button
              onClick={() => setActiveView('import-jobs')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ml-auto ${
                activeView === 'import-jobs'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-primary-500 hover:text-primary-700'
              }`}
            >
              <FileText className="w-4 h-4 inline-block mr-2" strokeWidth={1.5} />
              Import History
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {selectedEquipment ? renderEquipmentDetail() : (
        <>
          {activeView === 'browse' && renderBrowseView()}
          {activeView === 'packages' && renderPackagesView()}
          {activeView === 'calendar' && renderCalendarView()}
          {activeView === 'import' && (
            <CSVImportWizard 
              onComplete={() => setActiveView('browse')} 
              onCancel={() => setActiveView('browse')}
            />
          )}
          {activeView === 'import-jobs' && (
            <ImportJobsList onBack={() => setActiveView('browse')} />
          )}
        </>
      )}

      {/* Package Detail Modal */}
      {renderPackageDetail()}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white border border-primary-200 rounded-xl shadow-xl p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-primary-900 flex items-center gap-2">
              <Package className="w-4 h-4" strokeWidth={1.5} />
              Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h4>
            <button onClick={() => setCart([])} className="text-primary-400 hover:text-primary-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {cart.map(item => {
              const eq = getEquipmentById(item.id);
              return (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-primary-700">{eq?.name}</span>
                  <span className="text-primary-500">× {item.quantity}</span>
                </div>
              );
            })}
          </div>
          <button className="btn-primary w-full mt-4">
            Continue to Booking
          </button>
        </div>
      )}
    </div>
  );
}
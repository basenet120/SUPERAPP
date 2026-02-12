import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Plus, Minus, X, Package, Check } from 'lucide-react';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_DATA, getDayRate } from './equipmentData';
import { Badge } from '../ui/Badge';

export default function EquipmentBuilder({ cart, onCartChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCart, setShowCart] = useState(true);
  const [addedItemId, setAddedItemId] = useState(null);

  const filteredEquipment = useMemo(() => {
    return EQUIPMENT_DATA.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce((sum, cartItem) => {
    const equipment = EQUIPMENT_DATA.find(e => e.id === cartItem.id);
    if (!equipment) return sum;
    return sum + (getDayRate(equipment) * cartItem.quantity * cartItem.days);
  }, 0);

  const addToCart = (equipmentId) => {
    const existingItem = cart.find(item => item.id === equipmentId);
    if (existingItem) {
      onCartChange(cart.map(item =>
        item.id === equipmentId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      onCartChange([...cart, { id: equipmentId, quantity: 1, days: 1 }]);
    }
    
    // Show animation
    setAddedItemId(equipmentId);
    setTimeout(() => setAddedItemId(null), 500);
  };

  const removeFromCart = (equipmentId) => {
    onCartChange(cart.filter(item => item.id !== equipmentId));
  };

  const updateQuantity = (equipmentId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(equipmentId);
    } else {
      onCartChange(cart.map(item =>
        item.id === equipmentId ? { ...item, quantity } : item
      ));
    }
  };

  const updateDays = (equipmentId, days) => {
    if (days < 1) days = 1;
    onCartChange(cart.map(item =>
      item.id === equipmentId ? { ...item, days } : item
    ));
  };

  const getCartItem = (equipmentId) => cart.find(item => item.id === equipmentId);

  const getAvailabilityBadge = (availability, type) => {
    if (availability === 'In Stock') return { variant: 'success', label: 'In Stock' };
    if (availability === 'Available' && type === 'partner') return { variant: 'default', label: 'Partner' };
    if (availability === 'Limited') return { variant: 'warning', label: 'Limited' };
    return { variant: 'neutral', label: availability };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-primary-900">Select Equipment</h3>
          <p className="text-primary-500 mt-1">Browse and add items to your rental</p>
        </div>
        <button
          onClick={() => setShowCart(!showCart)}
          className="lg:hidden btn-secondary flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
          Cart ({cartItemCount})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar - Categories */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Categories */}
          <div className="border border-primary-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="p-3 bg-primary-50 border-b border-primary-200">
              <h4 className="font-semibold text-primary-900 text-sm">Categories</h4>
            </div>
            <div className="p-2 space-y-0.5">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${selectedCategory === 'All'
                    ? 'bg-brand-100 text-brand-700 font-semibold'
                    : 'text-primary-600 hover:bg-primary-50'
                  }
                `}
              >
                All Equipment
              </button>
              {EQUIPMENT_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${selectedCategory === category
                      ? 'bg-brand-100 text-brand-700 font-semibold'
                      : 'text-primary-600 hover:bg-primary-50'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="border border-primary-200 rounded-xl p-4 bg-white shadow-sm">
            <h4 className="font-semibold text-primary-900 mb-3 text-sm">Availability</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-500"></div>
                <span className="text-primary-600">In House - Immediate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                <span className="text-primary-600">Partner - 24hr Notice</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                <span className="text-primary-600">Limited Stock</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className={`${showCart ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEquipment.map(equipment => {
              const cartItem = getCartItem(equipment.id);
              const dayRate = getDayRate(equipment);
              const badge = getAvailabilityBadge(equipment.availability, equipment.type);

              return (
                <div
                  key={equipment.id}
                  className={`
                    border rounded-xl overflow-hidden transition-all duration-200 bg-white
                    ${cartItem ? 'border-brand-500 ring-2 ring-brand-100' : 'border-primary-200 hover:border-brand-300 hover:shadow-md'}
                  `}
                >
                  {/* Image Placeholder */}
                  <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
                    <Package className="w-12 h-12 text-primary-300" strokeWidth={1} />
                    <div className="absolute top-2 right-2">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant={equipment.type === 'in_house' ? 'success' : 'default'}>
                        {equipment.type === 'in_house' ? 'In House' : 'Partner'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-primary-500 uppercase tracking-wide">{equipment.category}</span>
                      <h4 className="font-semibold text-primary-900 mt-0.5">{equipment.name}</h4>
                      <p className="text-sm text-primary-500 line-clamp-2">{equipment.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <span className="text-2xl font-bold text-primary-900 font-tabular">
                          ${dayRate.toFixed(0)}
                        </span>
                        <span className="text-sm text-primary-500">/day</span>
                        {equipment.type === 'partner' && (
                          <div className="text-xs text-brand-600 font-medium">
                            KM Partner Rate
                          </div>
                        )}
                      </div>

                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(equipment.id, cartItem.quantity - 1)}
                            className="w-8 h-8 rounded-lg border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center font-semibold text-primary-900">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateQuantity(equipment.id, cartItem.quantity + 1)}
                            className="w-8 h-8 rounded-lg border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(equipment.id)}
                          className={`
                            btn-primary flex items-center gap-2
                            ${addedItemId === equipment.id ? 'bg-success-600' : ''}
                          `}
                        >
                          {addedItemId === equipment.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {addedItemId === equipment.id ? 'Added' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary-400" strokeWidth={1.5} />
              </div>
              <p className="text-primary-500">No equipment found matching your search</p>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="lg:col-span-1">
            <div className="border border-primary-200 rounded-xl overflow-hidden sticky top-4 bg-white shadow-sm">
              <div className="p-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-primary-900 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                    Cart
                  </h4>
                  <span className="text-sm font-medium text-primary-500 bg-white px-2 py-0.5 rounded-full">{cartItemCount} items</span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="w-8 h-8 text-primary-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-primary-500 text-sm">Your cart is empty</p>
                    <p className="text-primary-400 text-xs mt-1">Add equipment to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-primary-100">
                    {cart.map(cartItem => {
                      const equipment = EQUIPMENT_DATA.find(e => e.id === cartItem.id);
                      if (!equipment) return null;
                      const dayRate = getDayRate(equipment);
                      const itemTotal = dayRate * cartItem.quantity * cartItem.days;

                      return (
                        <div key={cartItem.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-primary-900 text-sm truncate">
                                {equipment.name}
                              </h5>
                              <Badge 
                                variant={equipment.type === 'in_house' ? 'success' : 'default'}
                                className="mt-1 text-[10px]"
                              >
                                {equipment.type === 'in_house' ? 'In House' : 'Partner'}
                              </Badge>
                            </div>
                            <button
                              onClick={() => removeFromCart(cartItem.id)}
                              className="text-primary-400 hover:text-danger-500 ml-2 transition-colors"
                            >
                              <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            {/* Quantity */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-primary-500">Qty:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                                  className="w-6 h-6 rounded border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                >
                                  <Minus className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                                <span className="w-6 text-center font-semibold text-primary-900">{cartItem.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                                  className="w-6 h-6 rounded border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                >
                                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>

                            {/* Days */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-primary-500">Days:</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateDays(cartItem.id, cartItem.days - 1)}
                                  className="w-6 h-6 rounded border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                >
                                  <Minus className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                                <span className="w-6 text-center font-semibold text-primary-900">{cartItem.days}</span>
                                <button
                                  onClick={() => updateDays(cartItem.id, cartItem.days + 1)}
                                  className="w-6 h-6 rounded border border-primary-300 flex items-center justify-center hover:bg-primary-50 transition-colors"
                                >
                                  <Plus className="w-3 h-3" strokeWidth={1.5} />
                                </button>
                              </div>
                            </div>

                            {/* Item Total */}
                            <div className="flex items-center justify-between pt-2 border-t border-primary-100">
                              <span className="text-xs text-primary-500">
                                ${dayRate}/day × {cartItem.quantity} × {cartItem.days}d
                              </span>
                              <span className="font-bold text-primary-900 font-tabular">
                                ${itemTotal.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 bg-primary-50 border-t border-primary-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary-600 font-medium">Subtotal</span>
                    <span className="font-bold text-primary-900 text-lg font-tabular">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-primary-500">
                    Tax will be calculated at checkout
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

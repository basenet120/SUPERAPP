import { useMemo } from 'react';
import { Package, Calendar, Truck, Percent, DollarSign, AlertCircle, Check } from 'lucide-react';
import { EQUIPMENT_DATA, getDayRate } from './equipmentData';
import { Badge } from '../ui/Badge';

const NYC_TAX_RATE = 0.08875;
const STUDIO_RATE = 3000;

export default function QuoteReview({
  bookingData,
  onDeliveryChange,
  onDepositChange
}) {
  const {
    serviceType,
    studioDate,
    studioTime,
    equipment,
    deliveryCost,
    depositType
  } = bookingData;

  const studioCost = useMemo(() => {
    if (serviceType === 'equipment') return 0;
    return STUDIO_RATE;
  }, [serviceType]);

  const equipmentBreakdown = useMemo(() => {
    const inHouse = [];
    const partner = [];
    let inHouseTotal = 0;
    let partnerTotal = 0;

    equipment.forEach(cartItem => {
      const item = EQUIPMENT_DATA.find(e => e.id === cartItem.id);
      if (!item) return;

      const dayRate = getDayRate(item);
      const itemTotal = dayRate * cartItem.quantity * cartItem.days;

      const breakdownItem = {
        ...item,
        quantity: cartItem.quantity,
        days: cartItem.days,
        dayRate,
        total: itemTotal
      };

      if (item.type === 'in_house') {
        inHouse.push(breakdownItem);
        inHouseTotal += itemTotal;
      } else {
        partner.push(breakdownItem);
        partnerTotal += itemTotal;
      }
    });

    return { inHouse, partner, inHouseTotal, partnerTotal };
  }, [equipment]);

  const subtotal = studioCost + equipmentBreakdown.inHouseTotal + equipmentBreakdown.partnerTotal + deliveryCost;
  const tax = subtotal * NYC_TAX_RATE;
  const total = subtotal + tax;
  const depositAmount = depositType === '50%' ? total * 0.5 : total;

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-primary-900">Review Your Quote</h3>
        <p className="text-primary-500 mt-1">Please review all details before proceeding to checkout</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Studio Section */}
          {serviceType !== 'equipment' && (
            <div className="border border-primary-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-4 bg-brand-50 border-b border-brand-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                  <h4 className="font-semibold text-brand-900">Studio Booking</h4>
                </div>
              </div>
              <div className="p-5">
                {studioDate ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600">Date</span>
                      <span className="font-semibold text-primary-900">
                        {new Date(studioDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600">Time Block</span>
                      <span className="font-semibold text-primary-900">
                        {studioTime.start} - {studioTime.end}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600">Duration</span>
                      <span className="font-semibold text-primary-900">
                        {parseInt(studioTime.end) - parseInt(studioTime.start)} hours
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-primary-100">
                      <span className="font-semibold text-primary-900">Studio Rate</span>
                      <span className="font-bold text-xl text-primary-900 font-tabular">{formatCurrency(studioCost)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-warning-600 bg-warning-50 p-4 rounded-lg">
                    <AlertCircle className="w-5 h-5" strokeWidth={1.5} />
                    <span className="font-medium">No studio date selected</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {equipment.length > 0 && (
            <div className="border border-primary-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-4 bg-primary-50 border-b border-primary-200">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                  <h4 className="font-semibold text-primary-900">Equipment Rental</h4>
                </div>
              </div>
              <div className="p-5 space-y-6">
                {/* In-House Equipment */}
                {equipmentBreakdown.inHouse.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-success-700 mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4" strokeWidth={2} />
                      In-House Equipment (Immediate Availability)
                    </h5>
                    <div className="space-y-2">
                      {equipmentBreakdown.inHouse.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-primary-50 last:border-0">
                          <div className="flex-1">
                            <span className="text-primary-900 font-medium">{item.name}</span>
                            <span className="text-primary-500 ml-2">
                              × {item.quantity} × {item.days}d
                            </span>
                          </div>
                          <span className="font-semibold text-primary-900 font-tabular">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-primary-100 mt-2">
                      <span className="text-sm text-primary-600 font-medium">In-House Subtotal</span>
                      <span className="font-semibold text-primary-900 font-tabular">
                        {formatCurrency(equipmentBreakdown.inHouseTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Partner Equipment */}
                {equipmentBreakdown.partner.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-brand-700 mb-3">
                      Partner Equipment (24hr Notice Required)
                    </h5>
                    <div className="space-y-2">
                      {equipmentBreakdown.partner.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-primary-50 last:border-0">
                          <div className="flex-1">
                            <span className="text-primary-900 font-medium">{item.name}</span>
                            <span className="text-primary-500 ml-2">
                              × {item.quantity} × {item.days}d
                            </span>
                            <span className="text-xs text-brand-600 ml-2 font-medium">
                              (KM Partner Rate)
                            </span>
                          </div>
                          <span className="font-semibold text-primary-900 font-tabular">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-primary-100 mt-2">
                      <span className="text-sm text-primary-600 font-medium">Partner Subtotal</span>
                      <span className="font-semibold text-primary-900 font-tabular">
                        {formatCurrency(equipmentBreakdown.partnerTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Equipment Total */}
                <div className="flex justify-between pt-4 border-t-2 border-primary-200">
                  <span className="font-semibold text-primary-900">Equipment Total</span>
                  <span className="font-bold text-xl text-primary-900 font-tabular">
                    {formatCurrency(equipmentBreakdown.inHouseTotal + equipmentBreakdown.partnerTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Section */}
          <div className="border border-primary-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="p-4 bg-primary-50 border-b border-primary-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                <h4 className="font-semibold text-primary-900">Delivery & Logistics</h4>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-primary-700">Additional Delivery Cost</label>
                  <p className="text-xs text-primary-500 mt-0.5">Include any special delivery or handling fees</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary-500 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deliveryCost}
                    onChange={(e) => onDeliveryChange(parseFloat(e.target.value) || 0)}
                    className="input-field w-32 text-right font-tabular"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="border border-primary-200 rounded-xl overflow-hidden sticky top-4 bg-white shadow-sm">
            <div className="p-5 bg-gradient-to-br from-primary-800 to-primary-900 text-white">
              <h4 className="font-semibold flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" strokeWidth={1.5} />
                Quote Summary
              </h4>
            </div>
            <div className="p-5 space-y-4">
              {/* Subtotal Breakdown */}
              <div className="space-y-3">
                {serviceType !== 'equipment' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Studio</span>
                    <span className="text-primary-900 font-medium font-tabular">{formatCurrency(studioCost)}</span>
                  </div>
                )}
                {equipmentBreakdown.inHouseTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">In-House Equipment</span>
                    <span className="text-primary-900 font-medium font-tabular">{formatCurrency(equipmentBreakdown.inHouseTotal)}</span>
                  </div>
                )}
                {equipmentBreakdown.partnerTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Partner Equipment</span>
                    <span className="text-primary-900 font-medium font-tabular">{formatCurrency(equipmentBreakdown.partnerTotal)}</span>
                  </div>
                )}
                {deliveryCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-600">Delivery</span>
                    <span className="text-primary-900 font-medium font-tabular">{formatCurrency(deliveryCost)}</span>
                  </div>
                )}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between pt-4 border-t border-primary-200">
                <span className="font-semibold text-primary-900">Subtotal</span>
                <span className="font-bold text-primary-900 font-tabular">{formatCurrency(subtotal)}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-sm">
                <span className="text-primary-600 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Tax (8.875% NYC)
                </span>
                <span className="text-primary-900 font-medium font-tabular">{formatCurrency(tax)}</span>
              </div>

              {/* Total */}
              <div className="flex justify-between pt-4 border-t-2 border-primary-200">
                <span className="text-lg font-bold text-primary-900">Total</span>
                <span className="text-3xl font-bold text-brand-600 font-tabular">{formatCurrency(total)}</span>
              </div>

              {/* Deposit Selection */}
              <div className="pt-5 border-t border-primary-200">
                <label className="text-sm font-semibold text-primary-700 mb-3 block">Deposit Required</label>
                <div className="space-y-3">
                  <label className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${depositType === '50%' ? 'border-brand-500 bg-brand-50' : 'border-primary-200 hover:border-brand-300 bg-white'}
                  `}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deposit"
                        value="50%"
                        checked={depositType === '50%'}
                        onChange={(e) => onDepositChange(e.target.value)}
                        className="w-4 h-4 text-brand-600 border-primary-300 focus:ring-brand-500"
                      />
                      <div>
                        <span className="font-semibold text-primary-900 block">50% to Hold</span>
                        <p className="text-xs text-primary-500">Remaining 50% due before pickup</p>
                      </div>
                    </div>
                    <span className="font-bold text-brand-600 font-tabular">
                      {formatCurrency(total * 0.5)}
                    </span>
                  </label>

                  <label className={`
                    flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${depositType === '100%' ? 'border-brand-500 bg-brand-50' : 'border-primary-200 hover:border-brand-300 bg-white'}
                  `}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deposit"
                        value="100%"
                        checked={depositType === '100%'}
                        onChange={(e) => onDepositChange(e.target.value)}
                        className="w-4 h-4 text-brand-600 border-primary-300 focus:ring-brand-500"
                      />
                      <div>
                        <span className="font-semibold text-primary-900 block">100% to Confirm</span>
                        <p className="text-xs text-primary-500">Full payment upfront - 5% discount</p>
                      </div>
                    </div>
                    <span className="font-bold text-brand-600 font-tabular">
                      {formatCurrency(total)}
                    </span>
                  </label>
                </div>
              </div>

              {/* Deposit Amount */}
              <div className="p-4 bg-brand-50 rounded-xl border border-brand-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-900">Deposit Due Now</span>
                  <span className="text-2xl font-bold text-brand-700 font-tabular">
                    {formatCurrency(depositAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

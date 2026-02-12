import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { Badge } from '../ui/Badge';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudioCalendar({
  selectedDate,
  onSelectDate,
  selectedTime,
  onTimeChange,
  override,
  onOverrideChange,
  existingBookings
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateBooked = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return existingBookings.some(booking => booking.date === dateStr && booking.status === 'confirmed');
  };

  const hasPendingBooking = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return existingBookings.some(booking => booking.date === dateStr && booking.status === 'pending');
  };

  const isPastDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  const isSelectedDate = (day) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === new Date(selectedDate).toDateString();
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day) => {
    if (isPastDate(day)) return;
    if (isDateBooked(day) && !override) return;
    
    const date = new Date(currentYear, currentMonth, day);
    onSelectDate(date);
    setShowTimePicker(true);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 19; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-primary-900">Select Studio Date</h3>
          <p className="text-primary-500 mt-1">$3,000 for a 12-hour block (7am - 7pm)</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-500"></div>
            <span className="text-primary-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-500"></div>
            <span className="text-primary-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-500"></div>
            <span className="text-primary-600">Pending</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="border border-primary-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 bg-primary-50 border-b border-primary-200">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors text-primary-600 hover:text-primary-900"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <h4 className="font-semibold text-primary-900 text-lg">
                {MONTHS[currentMonth]} {currentYear}
              </h4>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors text-primary-600 hover:text-primary-900"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-primary-200">
              {WEEKDAYS.map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-primary-500 uppercase tracking-wide">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-24 border-b border-r border-primary-100" />;
                }

                const booked = isDateBooked(day);
                const pending = hasPendingBooking(day);
                const past = isPastDate(day);
                const selected = isSelectedDate(day);

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    disabled={past || (booked && !override)}
                    className={`
                      h-24 border-b border-r border-primary-100 p-2 text-left transition-all relative
                      ${past ? 'bg-primary-50 text-primary-300 cursor-not-allowed' : 'hover:bg-brand-50/50'}
                      ${selected ? 'bg-brand-100 ring-2 ring-inset ring-brand-500' : ''}
                      ${booked && !selected ? 'bg-danger-50' : ''}
                      ${pending && !booked && !selected ? 'bg-warning-50' : ''}
                    `}
                  >
                    <span className={`
                      text-sm font-semibold
                      ${past ? 'text-primary-300' : 'text-primary-700'}
                      ${selected ? 'text-brand-700' : ''}
                    `}>
                      {day}
                    </span>
                    
                    {booked && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <Badge variant="danger" className="text-[10px] px-1.5 py-0">Booked</Badge>
                      </div>
                    )}
                    
                    {pending && !booked && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">Pending</Badge>
                      </div>
                    )}

                    {selected && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Selected</Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Date Info */}
          {selectedDate && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                <h4 className="font-semibold text-brand-900">Selected Date</h4>
              </div>
              <p className="text-2xl font-bold text-brand-700">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Time Selection */}
          {showTimePicker && selectedDate && (
            <div className="border border-primary-200 rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-600" strokeWidth={1.5} />
                <h4 className="font-semibold text-primary-900">Time Block</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 mb-2 block">Start Time</label>
                  <select
                    value={selectedTime.start}
                    onChange={(e) => onTimeChange({ ...selectedTime, start: e.target.value })}
                    className="input-field"
                  >
                    {timeSlots.slice(0, -1).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-primary-700 mb-2 block">End Time</label>
                  <select
                    value={selectedTime.end}
                    onChange={(e) => onTimeChange({ ...selectedTime, end: e.target.value })}
                    className="input-field"
                  >
                    {timeSlots.slice(1).map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="text-sm text-primary-500 pt-2 border-t border-primary-100">
                  Duration: <span className="font-semibold text-primary-700">{parseInt(selectedTime.end) - parseInt(selectedTime.start)} hours</span>
                </div>
              </div>
            </div>
          )}

          {/* Override Toggle */}
          <div className="border border-primary-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning-500" />
                  Availability Override
                </h4>
                <p className="text-sm text-primary-500 mt-1">
                  Enable split-day bookings or override blocked dates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => onOverrideChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-primary-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-primary-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-gradient-to-br from-primary-800 to-primary-900 text-white rounded-xl p-5 shadow-lg">
            <h4 className="font-semibold mb-3 text-lg">Studio Pricing</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-primary-300">12-hour block</span>
                <span className="font-bold text-lg">$3,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-300">Hourly rate (over)</span>
                <span className="font-semibold">$300/hr</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

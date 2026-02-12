import { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { 
  Calendar, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight,
  X, Edit2, Trash2, Check, ExternalLink, Filter, Download
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup date-fns localizer for react-big-calendar
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Sample events data
const SAMPLE_EVENTS = [
  {
    id: 1,
    title: 'Nike Commercial',
    start: new Date(2026, 1, 15, 7, 0),
    end: new Date(2026, 1, 15, 19, 0),
    client: 'Nike Production',
    type: 'studio',
    status: 'confirmed',
    equipment: ['cam-001', 'light-001'],
    crew: ['John D.', 'Sarah M.'],
    location: 'Stage A',
    color: '#10b981'
  },
  {
    id: 2,
    title: 'HBO Documentary',
    start: new Date(2026, 1, 16, 8, 0),
    end: new Date(2026, 1, 16, 18, 0),
    client: 'HBO Documentary',
    type: 'studio',
    status: 'confirmed',
    equipment: ['cam-002', 'sound-001'],
    crew: ['Mike R.'],
    location: 'Stage B',
    color: '#10b981'
  },
  {
    id: 3,
    title: 'Spotify Podcast',
    start: new Date(2026, 1, 20, 9, 0),
    end: new Date(2026, 1, 20, 17, 0),
    client: 'Spotify',
    type: 'studio',
    status: 'pending',
    equipment: ['cam-003', 'sound-003'],
    crew: ['Lisa K.'],
    location: 'Podcast Suite',
    color: '#f59e0b'
  },
  {
    id: 4,
    title: 'Meta Brand Video',
    start: new Date(2026, 1, 22, 7, 0),
    end: new Date(2026, 1, 23, 19, 0),
    client: 'Meta',
    type: 'studio',
    status: 'confirmed',
    equipment: ['cam-001', 'cam-002', 'light-001'],
    crew: ['John D.', 'Sarah M.', 'Mike R.'],
    location: 'Stage A + B',
    color: '#10b981'
  },
  {
    id: 5,
    title: 'Netflix Interview',
    start: new Date(2026, 1, 25, 10, 0),
    end: new Date(2026, 1, 25, 16, 0),
    client: 'Netflix',
    type: 'studio',
    status: 'pending',
    equipment: ['cam-003'],
    crew: ['Lisa K.'],
    location: 'Interview Room',
    color: '#f59e0b'
  },
  {
    id: 6,
    title: 'Apple Product Launch',
    start: new Date(2026, 2, 1, 6, 0),
    end: new Date(2026, 2, 1, 22, 0),
    client: 'Apple',
    type: 'studio',
    status: 'confirmed',
    equipment: ['cam-004', 'light-006', 'motion-004'],
    crew: ['John D.', 'Sarah M.', 'Mike R.', 'Lisa K.'],
    location: 'Full Facility',
    color: '#10b981'
  },
  {
    id: 7,
    title: 'Equipment Pickup - Amazon',
    start: new Date(2026, 2, 5, 9, 0),
    end: new Date(2026, 2, 5, 10, 0),
    client: 'Amazon',
    type: 'pickup',
    status: 'confirmed',
    equipment: ['grip-001', 'light-002'],
    crew: [],
    location: 'Loading Dock',
    color: '#6366f1'
  },
  {
    id: 8,
    title: 'Google Commercial',
    start: new Date(2026, 2, 10, 8, 0),
    end: new Date(2026, 2, 12, 20, 0),
    client: 'Google',
    type: 'location',
    status: 'pending',
    equipment: ['cam-001', 'cam-002', 'cam-003'],
    crew: ['John D.', 'Sarah M.'],
    location: 'Off-site Location',
    color: '#8b5cf6'
  }
];

// Google Calendar integration mock
const useGoogleCalendar = () => {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const connect = useCallback(() => {
    // Simulate OAuth flow
    setSyncing(true);
    setTimeout(() => {
      setConnected(true);
      setSyncing(false);
    }, 1500);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
  }, []);

  const syncEvents = useCallback((events) => {
    if (!connected) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
    }, 1000);
  }, [connected]);

  return { connected, syncing, connect, disconnect, syncEvents };
};

export default function CalendarIntegration() {
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, studio, location, pickup
  const [draggedEvent, setDraggedEvent] = useState(null);
  
  const { connected, syncing, connect, disconnect, syncEvents } = useGoogleCalendar();

  // Filter events based on type
  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter(e => e.type === filter);
  }, [events, filter]);

  // Custom event styling
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#3b82f6',
        borderRadius: '6px',
        opacity: event.status === 'pending' ? 0.8 : 1,
        color: 'white',
        border: 'none',
        padding: '2px 6px',
        fontSize: '0.875rem',
        fontWeight: 500
      }
    };
  };

  // Handle event selection
  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  // Handle slot selection (create new event)
  const handleSelectSlot = useCallback((slotInfo) => {
    setShowNewEventModal(true);
  }, []);

  // Handle event drag/drop
  const handleEventDrop = useCallback(({ event, start, end }) => {
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, start, end } : e
    );
    setEvents(updatedEvents);
    syncEvents(updatedEvents);
  }, [events, syncEvents]);

  // Handle event resize
  const handleEventResize = useCallback(({ event, start, end }) => {
    const updatedEvents = events.map(e => 
      e.id === event.id ? { ...e, start, end } : e
    );
    setEvents(updatedEvents);
    syncEvents(updatedEvents);
  }, [events, syncEvents]);

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return { variant: 'success', label: 'Confirmed' };
      case 'pending': return { variant: 'warning', label: 'Pending' };
      case 'cancelled': return { variant: 'danger', label: 'Cancelled' };
      default: return { variant: 'default', label: status };
    }
  };

  // Format time range
  const formatTimeRange = (start, end) => {
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-900">Studio Calendar</h2>
          <p className="text-primary-500 mt-1">Manage bookings and availability</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Google Calendar Integration */}
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Badge variant="success" className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Google Calendar Connected
                </Badge>
                <button
                  onClick={disconnect}
                  className="text-sm text-primary-500 hover:text-primary-700"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                disabled={syncing}
                className="btn-secondary flex items-center gap-2"
              >
                {syncing ? (
                  <div className="w-4 h-4 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                )}
                Connect Google Calendar
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowNewEventModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            New Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary-400" strokeWidth={1.5} />
          <span className="text-sm text-primary-500">Filter:</span>
        </div>
        {[
          { key: 'all', label: 'All Events', color: 'bg-primary-500' },
          { key: 'studio', label: 'Studio', color: 'bg-success-500' },
          { key: 'location', label: 'Location', color: 'bg-purple-500' },
          { key: 'pickup', label: 'Pickup/Dropoff', color: 'bg-indigo-500' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === key
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-white border border-primary-200 text-primary-600 hover:bg-primary-50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white border border-primary-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-primary-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDate(subMonths(date, 1))}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <h3 className="text-lg font-semibold text-primary-900 min-w-[200px] text-center">
              {format(date, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setDate(addMonths(date, 1))}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === 'month'
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === 'week'
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                view === 'day'
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="h-[600px] p-4">
          <BigCalendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            selectable
            resizable
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            eventPropGetter={eventStyleGetter}
            dragFromOutsideItem={draggedEvent}
            toolbar={false}
            popup
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-500"></div>
          <span className="text-primary-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-500"></div>
          <span className="text-primary-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span className="text-primary-600">Location Shoot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-indigo-500"></div>
          <span className="text-primary-600">Pickup/Dropoff</span>
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedEvent.color }}
                />
                {selectedEvent.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Badge variant={getStatusBadge(selectedEvent.status).variant}>
                  {getStatusBadge(selectedEvent.status).label}
                </Badge>
                <Badge variant="default">{selectedEvent.type}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-primary-900">
                      {format(selectedEvent.start, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-primary-500">
                      {formatTimeRange(selectedEvent.start, selectedEvent.end)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-primary-900">{selectedEvent.client}</p>
                    <p className="text-sm text-primary-500">Client</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="font-medium text-primary-900">{selectedEvent.location}</p>
                    <p className="text-sm text-primary-500">Location</p>
                  </div>
                </div>

                {selectedEvent.crew.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary-400 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-primary-900">
                        {selectedEvent.crew.join(', ')}
                      </p>
                      <p className="text-sm text-primary-500">Crew</p>
                    </div>
                  </div>
                )}

                {selectedEvent.equipment.length > 0 && (
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <p className="text-sm font-medium text-primary-900 mb-2">Equipment</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.equipment.map(eq => (
                        <span key={eq} className="text-xs px-2 py-1 bg-white rounded-full text-primary-600">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-primary-200">
                <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                  Edit
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2 text-danger-600 border-danger-200 hover:bg-danger-50">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Event Modal */}
      {showNewEventModal && (
        <Dialog open={showNewEventModal} onOpenChange={setShowNewEventModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Booking</DialogTitle>
            </DialogHeader>
            
            <form className="space-y-4 mt-4">
              <div>
                <label className="label-field">Booking Title</label>
                <input type="text" className="input-field" placeholder="e.g., Nike Commercial" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Start Date & Time</label>
                  <input type="datetime-local" className="input-field" />
                </div>
                <div>
                  <label className="label-field">End Date & Time</label>
                  <input type="datetime-local" className="input-field" />
                </div>
              </div>

              <div>
                <label className="label-field">Client</label>
                <input type="text" className="input-field" placeholder="Client name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Type</label>
                  <select className="input-field">
                    <option>Studio</option>
                    <option>Location</option>
                    <option>Pickup/Dropoff</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">Location</label>
                  <select className="input-field">
                    <option>Stage A</option>
                    <option>Stage B</option>
                    <option>Podcast Suite</option>
                    <option>Interview Room</option>
                    <option>Off-site</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-field">Notes</label>
                <textarea className="input-field" rows={3} placeholder="Additional details..." />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Booking
                </button>
                <button 
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
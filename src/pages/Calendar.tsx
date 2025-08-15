import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  User, 
  Camera, 
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  clientName: string;
  date: string;
  time: string;
  location: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  shootType: string;
  projectId: string;
}

// Error Boundary Component
class CalendarErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error in Calendar component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">Something went wrong</h3>
          <p className="text-gray-500">Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Calendar() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Valid shoot types
  const validShootTypes = ['engagement', 'wedding', 'pre-wedding', 'reception'];

  // Normalize status values and override based on date
  const normalizeStatus = (status: string, eventDate: string, eventTime: string): 'Upcoming' | 'In Progress' | 'Completed' => {
    const eventDateTime = new Date(`${eventDate}T${eventTime}+05:30`);
    const currentDateTime = new Date();
    currentDateTime.setHours(0, 0, 0, 0); // Start of today

    // Override status to Completed if the event is in the past
    if (eventDateTime < currentDateTime) {
      return 'Completed';
    }

    const lowerStatus = status?.toLowerCase();
    if (lowerStatus?.includes('upcoming')) return 'Upcoming';
    if (lowerStatus?.includes('in progress') || lowerStatus?.includes('inprogress')) return 'In Progress';
    if (lowerStatus?.includes('completed')) return 'Completed';
    return 'Upcoming'; // Default fallback
  };

  // Fetch events from API
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://vxxl9b57z2.execute-api.eu-north-1.amazonaws.com/default/Get_Project_Details',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response
      if (!data || !Array.isArray(data.projects)) {
        throw new Error('Unexpected API response format: Missing or invalid "projects" array');
      }

      // Map API response to CalendarEvent
      const mappedEvents: CalendarEvent[] = data.projects.map((project: any) => ({
        id: project.projectId || `proj-${Math.random().toString(36).substr(2, 9)}`,
        title: project.title || project.clientName || 'Unknown Event',
        clientName: project.clientName || 'Unknown Client',
        date: project.eventDate || new Date().toISOString().split('T')[0],
        time: project.eventTime || '00:00',
        location: project.location || 'Unknown Location',
        status: normalizeStatus(project.status || 'Upcoming', project.eventDate || new Date().toISOString().split('T')[0], project.eventTime || '00:00'),
        shootType: validShootTypes.includes(project.shootType?.toLowerCase()) ? project.shootType : 'Unknown',
        projectId: project.projectId || 'unknown'
      }));

      console.log('Mapped Calendar Events:', mappedEvents);
      setEvents(mappedEvents);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Unable to load events. Please check the server or try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRetryFetch = () => {
    fetchEvents();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-[#00BCEB] text-white';
      case 'In Progress': return 'bg-[#FF6B00] text-white';
      case 'Completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    // Format date in IST without converting to UTC
    const dateString = new Date(date.getTime() + 5.5 * 60 * 60 * 1000)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      .split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleViewProject = () => {
    if (selectedEvent) {
      navigate(`/projects/${selectedEvent.projectId}`);
    }
  };

  const handleAddProject = () => {
    navigate('/projects/new');
  };

  const days = getDaysInMonth(currentDate);

  return (
    <CalendarErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          {/* Header */}
          <Header title="Studio Calendar" sidebarCollapsed={sidebarCollapsed} />

          {/* Main Content */}
          <main className="pt-16 p-6 h-screen overflow-auto">
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div className="flex flex-col items-center">
                  <span className="text-red-700">{error}</span>
                  <button
                    onClick={handleRetryFetch}
                    className="mt-2 flex items-center px-3 py-1 bg-[#00BCEB] text-white rounded-lg text-sm hover:bg-[#00A5CF] transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-[#00BCEB] animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading events...</p>
              </div>
            )}

            {/* Calendar Controls */}
            {!loading && !error && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-16 z-10">
                <div className="flex items-center justify-between">
                  {/* Left: Title */}
                  <div className="flex items-center">
                    <CalendarIcon className="h-6 w-6 text-[#00BCEB] mr-3" />
                    <h2 className="text-2xl font-bold text-[#2D2D2D]">Studio Calendar</h2>
                  </div>

                  {/* Center: View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('month')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'month'
                          ? 'bg-[#00BCEB] text-white'
                          : 'text-gray-600 hover:text-[#00BCEB]'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setViewMode('week')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'week'
                          ? 'bg-[#00BCEB] text-white'
                          : 'text-gray-600 hover:text-[#00BCEB]'
                      }`}
                    >
                      Week
                    </button>
                  </div>

                  {/* Right: Navigation */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 text-gray-600 hover:text-[#00BCEB] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 text-[#00BCEB] hover:bg-[#00BCEB]/10 rounded-lg font-medium transition-colors duration-200"
                    >
                      Today
                    </button>
                    
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 text-gray-600 hover:text-[#00BCEB] hover:bg-[#00BCEB]/10 rounded-lg transition-colors duration-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Current Month/Year */}
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold text-[#2D2D2D]">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            {!loading && !error && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-auto max-h-[calc(100vh-300px)]">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
                  {dayNames.map((day) => (
                    <div key={day} className="p-4 text-center font-semibold text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Body */}
                <AnimatePresence>
                  <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                      const dayEvents = getEventsForDate(date);
                      const isCurrentDay = isToday(date);
                      const isPast = isPastDate(date);

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`border-r border-b border-gray-200 p-3 min-h-[140px] relative ${
                            isPast ? 'bg-gray-50' : 'bg-white'
                          } ${isCurrentDay ? 'bg-[#00BCEB]/5 border-[#00BCEB]' : ''}`}
                        >
                          {date && (
                            <>
                              {/* Date Number */}
                              <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                                isCurrentDay 
                                  ? 'text-[#00BCEB] font-bold' 
                                  : isPast 
                                  ? 'text-gray-400' 
                                  : 'text-[#2D2D2D]'
                              }`}>
                                <span>{date.getDate()}</span>
                                {isCurrentDay && (
                                  <span className="text-xs bg-[#00BCEB] text-white px-2 py-1 rounded-full">
                                    Today
                                  </span>
                                )}
                              </div>

                              {/* Events */}
                              <div className="space-y-2">
                                {dayEvents.slice(0, 3).map((event) => (
                                  <motion.div
                                    key={event.id}
                                    onClick={() => handleEventClick(event)}
                                    className={`text-xs px-3 py-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 relative group ${
                                      getStatusColor(event.status)
                                    } ${event.status === 'Upcoming' ? 'animate-pulse' : ''}`}
                                    title={`${event.title} - ${event.time}`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="truncate font-medium">{event.title}</div>
                                    <div className="flex items-center mt-1 opacity-90">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {event.time}
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 z-10">
                                      {event.title} - {event.time}
                                    </div>
                                  </motion.div>
                                ))}
                                {dayEvents.length > 3 && (
                                  <div className="text-xs text-gray-500 px-3">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && events.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#2D2D2D] mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">No projects scheduled for this period.</p>
                <button
                  onClick={handleAddProject}
                  className="flex items-center mx-auto px-4 py-2 bg-[#00BCEB] text-white rounded-lg hover:bg-[#00A5CF] transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Project
                </button>
              </div>
            )}

            {/* Status Legend */}
            {!loading && !error && events.length > 0 && (
              <div className="mt-4 flex items-center justify-center space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#00BCEB] rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-gray-600">Upcoming</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-[#FF6B00] rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Event Details Modal */}
        {showEventModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-[#2D2D2D]">Event Details</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {/* Event Title */}
                <div>
                  <h4 className="text-lg font-semibold text-[#2D2D2D] mb-2 truncate">{selectedEvent.title}</h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                </div>

                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium text-[#2D2D2D]">{selectedEvent.clientName}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Camera className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Shoot Type</p>
                      <p className="font-medium text-[#2D2D2D]">{selectedEvent.shootType}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Date & Time (IST)</p>
                      <p className="font-medium text-[#2D2D2D]">
                        {new Date(`${selectedEvent.date}T${selectedEvent.time}+05:30`).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'Asia/Kolkata'
                        })} at {new Date(`${selectedEvent.date}T${selectedEvent.time}+05:30`).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Asia/Kolkata'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium text-[#2D2D2D]">{selectedEvent.location}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleViewProject}
                    className="w-full flex items-center justify-center px-4 py-3 bg-[#00BCEB] text-white rounded-lg font-medium hover:bg-[#00A5CF] transition-colors duration-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Project Details
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </CalendarErrorBoundary>
  );
}

export default Calendar;
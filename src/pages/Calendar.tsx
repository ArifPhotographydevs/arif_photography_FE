import React, { useState } from 'react';
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
  ExternalLink
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

function Calendar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Mock events data
  const events: CalendarEvent[] = [
    {
      id: '1',
      title: 'Sarah & John Wedding',
      clientName: 'Sarah Johnson',
      date: '2024-03-15',
      time: '16:00',
      location: 'Goa Beach Resort',
      status: 'Upcoming',
      shootType: 'Wedding',
      projectId: 'PRJ-2024-001'
    },
    {
      id: '2',
      title: 'Raj Pre-Wedding Shoot',
      clientName: 'Raj Patel',
      date: '2024-03-18',
      time: '10:00',
      location: 'Mumbai Beach',
      status: 'Upcoming',
      shootType: 'Pre-Wedding',
      projectId: 'PRJ-2024-002'
    },
    {
      id: '3',
      title: 'Emma Maternity Session',
      clientName: 'Emma Wilson',
      date: '2024-03-12',
      time: '14:00',
      location: 'Studio',
      status: 'Completed',
      shootType: 'Maternity',
      projectId: 'PRJ-2024-003'
    },
    {
      id: '4',
      title: 'Corporate Event',
      clientName: 'TechCorp',
      date: '2024-03-20',
      time: '09:00',
      location: 'Mumbai Convention Center',
      status: 'Upcoming',
      shootType: 'Corporate',
      projectId: 'PRJ-2024-004'
    },
    {
      id: '5',
      title: 'Arjun Portrait Session',
      clientName: 'Arjun Kumar',
      date: '2024-03-14',
      time: '11:00',
      location: 'Outdoor Location',
      status: 'In Progress',
      shootType: 'Portrait',
      projectId: 'PRJ-2024-005'
    }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-[#00BCEB] text-white';
      case 'In Progress': return 'bg-[#FF6B00] text-white';
      case 'Completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-[#00BCEB]';
      case 'In Progress': return 'bg-[#FF6B00]';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-400';
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
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
      window.location.href = `/projects/${selectedEvent.projectId}`;
    }
  };

  const days = getDaysInMonth(currentDate);

  return (
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
        <main className="pt-16 p-6 h-screen overflow-hidden">
          {/* Calendar Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
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

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {dayNames.map((day) => (
                <div key={day} className="p-4 text-center font-semibold text-gray-600 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 h-full">
              {days.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isCurrentDay = isToday(date);
                const isPast = isPastDate(date);

                return (
                  <div
                    key={index}
                    className={`border-r border-b border-gray-200 p-2 min-h-[120px] ${
                      isPast ? 'bg-gray-50' : 'bg-white'
                    } ${isCurrentDay ? 'bg-[#00BCEB]/5 border-[#00BCEB]' : ''}`}
                  >
                    {date && (
                      <>
                        {/* Date Number */}
                        <div className={`text-sm font-medium mb-2 ${
                          isCurrentDay 
                            ? 'text-[#00BCEB] font-bold' 
                            : isPast 
                            ? 'text-gray-400' 
                            : 'text-[#2D2D2D]'
                        }`}>
                          {date.getDate()}
                        </div>

                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity duration-200 ${getStatusColor(event.status)}`}
                              title={`${event.title} - ${event.time}`}
                            >
                              <div className="truncate font-medium">{event.title}</div>
                              <div className="flex items-center mt-1 opacity-90">
                                <Clock className="h-3 w-3 mr-1" />
                                {event.time}
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 px-2">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Legend */}
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-[#00BCEB] rounded-full mr-2"></div>
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
        </main>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                <h4 className="text-lg font-semibold text-[#2D2D2D] mb-2">{selectedEvent.title}</h4>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>

              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Client</p>
                    <p className="font-medium text-[#2D2D2D]">{selectedEvent.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Camera className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Shoot Type</p>
                    <p className="font-medium text-[#2D2D2D]">{selectedEvent.shootType}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-[#2D2D2D]">
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {selectedEvent.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
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
        </div>
      )}
    </div>
  );
}

export default Calendar;
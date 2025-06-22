// src/components/Calendar/CalendarViews.jsx - FIXED Missing onView Handler
import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const parseDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  
  if (typeof dateString === 'string') {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }
  
  return new Date(dateString);
};

const formatEventsForBigCalendar = (assignments, studyBlocks, manualEvents, course, viewMode) => {
  const events = [];

  assignments.forEach(assignment => {
    if (assignment.date) {
      const startDate = parseDate(assignment.date);
      if (startDate && !isNaN(startDate.getTime())) {
        events.push({
          id: assignment.id,
          title: assignment.text,
          start: startDate,
          end: new Date(startDate.getTime() + 60 * 60 * 1000), // 1 hour duration
          resource: {
            type: assignment.type || 'assignment',
            source: 'assignment',
            courseCode: course?.code || 'UNKNOWN',
            hours: assignment.hours,
            data: assignment
          }
        });
      }
    }
  });

  studyBlocks.forEach(block => {
    if (block.date) {
      const startDate = parseDate(block.date);
      if (startDate && !isNaN(startDate.getTime())) {
        events.push({
          id: block.id,
          title: block.title,
          start: startDate,
          end: new Date(startDate.getTime() + 2 * 60 * 60 * 1000), // 2 hour duration
          resource: {
            type: 'study',
            source: 'generated',
            courseCode: block.courseCode,
            hours: block.hours,
            data: block
          }
        });
      }
    }
  });

  manualEvents.forEach(event => {
    if (event.date) {
      const startDate = parseDate(event.date);
      if (startDate && !isNaN(startDate.getTime())) {
        events.push({
          id: event.id,
          title: event.title,
          start: startDate,
          end: new Date(startDate.getTime() + 2 * 60 * 60 * 1000), // 2 hour duration
          resource: {
            type: event.type,
            source: 'manual',
            courseCode: event.courseCode,
            hours: event.hours,
            data: event
          }
        });
      }
    }
  });

  return events;
};

const EventComponent = ({ event }) => {
  const { type, source, courseCode } = event.resource;
  
  const getEventStyle = () => {
    const baseStyle = 'text-xs p-1 rounded truncate border';
    
    if (type === 'lecture') return `${baseStyle} bg-purple-100 text-purple-700 border-purple-200`;
    if (type === 'clinical') return `${baseStyle} bg-pink-100 text-pink-700 border-pink-200`;
    if (type === 'exam' || type === 'quiz') return `${baseStyle} bg-red-100 text-red-700 border-red-200`;
    if (type === 'study') return `${baseStyle} bg-blue-100 text-blue-700 border-blue-200`;
    if (type === 'assignment') return `${baseStyle} bg-green-100 text-green-700 border-green-200`;
    return `${baseStyle} bg-gray-100 text-gray-700 border-gray-200`;
  };

  return (
    <div className={getEventStyle()}>
      <div className="truncate font-medium">
        {event.title}
        {courseCode && (
          <span className="ml-1 opacity-75">({courseCode})</span>
        )}
      </div>
    </div>
  );
};

const getDayPropGetter = (date) => {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return {
      className: 'rbc-today-highlight',
      style: {
        backgroundColor: '#eff6ff',
        border: '2px solid #3b82f6'
      }
    };
  }
  
  return {};
};

export function BigCalendarView({ 
  currentDate, 
  assignments, 
  studyBlocks, 
  manualEvents, 
  course, 
  viewMode, 
  currentView,
  onEventClick,
  onNavigate 
}) {
  const [view, setView] = React.useState(currentView || 'month');
  const events = formatEventsForBigCalendar(assignments, studyBlocks, manualEvents, course, viewMode);

  // DEBUG INFO
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const eventsInCurrentMonth = events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  console.log('🐛 CALENDAR DEBUG:', {
    totalEvents: events.length,
    currentView: `${currentDate.toLocaleString('default', { month: 'long' })} ${currentYear}`,
    eventsInCurrentView: eventsInCurrentMonth.length,
    firstEventDate: events[0]?.start?.toDateString(),
    lastEventDate: events[events.length - 1]?.start?.toDateString()
  });

  // FIXED: Add onView handler
  const handleViewChange = (newView) => {
    console.log('📅 View changed to:', newView);
    setView(newView);
  };

  const handleSelectEvent = (event) => {
    const originalEvent = {
      id: event.id,
      title: event.title,
      date: event.start,
      type: event.resource.type,
      source: event.resource.source,
      courseCode: event.resource.courseCode,
      hours: event.resource.hours,
      data: event.resource.data
    };
    onEventClick(originalEvent);
  };

  return (
    <div className="h-full">
      {/* DEBUG BAR */}
      <div className="bg-yellow-100 border border-yellow-300 p-2 text-xs mb-2 rounded">
        <strong>DEBUG:</strong> {events.length} total events | 
        {eventsInCurrentMonth.length} in {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} |
        Range: {events[0]?.start?.toLocaleDateString()} - {events[events.length - 1]?.start?.toLocaleDateString()}
      </div>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={onNavigate}
        view={view}
        onView={handleViewChange}
        views={['month', 'week', 'day']}
        onSelectEvent={handleSelectEvent}
        components={{ event: EventComponent }}
        dayPropGetter={getDayPropGetter}
        popup={true}
        showMultiDayTimes={false}
        step={60}
        timeslots={1}
        culture="en-US"
        style={{ height: 'calc(100% - 60px)' }}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer.format(date, 'EEE', culture)
        }}
      />
    </div>
  );
}

export default BigCalendarView;
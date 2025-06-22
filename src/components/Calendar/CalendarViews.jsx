// src/components/Calendar/CalendarViews.jsx - Fixed calendar props
import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup localizer with Monday as first day of week
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Monday = 1
  getDay,
  locales,
});

// Fix timezone issues - parse dates as local, not UTC
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // If it's already a Date object, return it
  if (dateString instanceof Date) return dateString;
  
  // For YYYY-MM-DD format, parse as local date
  if (typeof dateString === 'string') {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }
  
  return new Date(dateString);
};

// Convert events to Big Calendar format
const formatEventsForBigCalendar = (assignments, studyBlocks, manualEvents, course, viewMode) => {
  const events = [];

  // Add assignments
  assignments.forEach(assignment => {
    if (assignment.date) {
      const startDate = parseDate(assignment.date);
      events.push({
        id: assignment.id,
        title: assignment.text,
        start: startDate,
        end: startDate,
        allDay: true,
        resource: {
          type: assignment.type || 'assignment',
          source: 'assignment',
          courseCode: course.code,
          hours: assignment.hours,
          data: assignment
        }
      });
    }
  });

  // Add study blocks
  studyBlocks.forEach(block => {
    if (block.date) {
      const startDate = parseDate(block.date);
      events.push({
        id: block.id,
        title: block.title,
        start: startDate,
        end: startDate,
        allDay: true,
        resource: {
          type: 'study',
          source: 'generated',
          courseCode: block.courseCode,
          hours: block.hours,
          data: block
        }
      });
    }
  });

  // Add manual events
  manualEvents.forEach(event => {
    if (event.date) {
      const startDate = parseDate(event.date);
      events.push({
        id: event.id,
        title: event.title,
        start: startDate,
        end: startDate,
        allDay: true,
        resource: {
          type: event.type,
          source: 'manual',
          courseCode: event.courseCode,
          hours: event.hours,
          data: event
        }
      });
    }
  });

  return events;
};

// Custom event component with styling
const EventComponent = ({ event }) => {
  const { type, source, courseCode } = event.resource;
  
  const getEventStyle = () => {
    const baseStyle = 'text-xs p-1 rounded truncate';
    
    if (type === 'lecture') return `${baseStyle} bg-purple-100 text-purple-700`;
    if (type === 'clinical') return `${baseStyle} bg-pink-100 text-pink-700`;
    if (type === 'exam' || type === 'quiz') return `${baseStyle} bg-red-100 text-red-700`;
    if (type === 'study') return `${baseStyle} bg-blue-100 text-blue-700`;
    if (type === 'assignment') return `${baseStyle} bg-green-100 text-green-700`;
    return `${baseStyle} bg-gray-100 text-gray-700`;
  };

  return (
    <div className={`${getEventStyle()} ${source === 'generated' ? 'ring-1 ring-blue-200' : ''}`}>
      <div className="truncate">
        {event.title}
        {courseCode && (
          <span className="ml-1 opacity-75">({courseCode})</span>
        )}
      </div>
    </div>
  );
};

// Today highlighting
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

// Main Calendar Component - FIXED
export function BigCalendarView({ 
  currentDate, 
  assignments, 
  studyBlocks, 
  manualEvents, 
  course, 
  viewMode, 
  currentView,
  onEventClick,
  onNavigate,
  onViewChange  // ADDED: view change handler
}) {
  const events = formatEventsForBigCalendar(assignments, studyBlocks, manualEvents, course, viewMode);

  const handleSelectEvent = (event) => {
    // Convert back to original format for compatibility
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

  const handleNavigate = (newDate) => {
    onNavigate(newDate);
  };

  // FIXED: Add view change handler
  const handleViewChange = (newView) => {
    if (onViewChange) {
      onViewChange(newView);
    }
  };

  return (
    <div className="h-full">
      {/* REMOVED: jsx attribute that was causing warning */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={handleNavigate}
        view={currentView}
        onView={handleViewChange}  // FIXED: Added missing onView prop
        views={['month', 'week', 'day']}
        onSelectEvent={handleSelectEvent}
        components={{
          event: EventComponent
        }}
        dayPropGetter={getDayPropGetter}
        popup={true}
        showMultiDayTimes={false}
        step={60}
        timeslots={1}
        culture="en-US"
        style={{ height: '100%' }}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer.format(date, 'EEE', culture)
        }}
      />
    </div>
  );
}

export default BigCalendarView;
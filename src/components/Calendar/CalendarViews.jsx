// src/components/Calendar/CalendarViews.jsx - FRESH START
import React, { useState } from 'react';
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

function BigCalendarView({ 
  currentDate, 
  assignments = [], 
  studyBlocks = [], 
  manualEvents = [], 
  course, 
  viewMode, 
  currentView,
  onEventClick = () => {},
  onNavigate = () => {}
}) {
  const [view, setView] = useState(currentView || 'month');

  console.log('🎯 FRESH CALENDAR:', {
    assignmentsReceived: assignments.length,
    firstAssignment: assignments[0],
    sampleDates: assignments.slice(0, 3).map(a => ({ text: a.text, date: a.date }))
  });

  // STEP 1: Convert assignments to events with minimal processing
  const events = [];
  
  assignments.forEach((assignment, index) => {
    if (!assignment.date) {
      console.warn(`⚠️ Assignment ${index} missing date:`, assignment);
      return;
    }

    // Parse date and set due time
    let eventDate;
    try {
      if (typeof assignment.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(assignment.date)) {
        // Split and create local date to avoid timezone issues
        const [year, month, day] = assignment.date.split('-').map(Number);
        eventDate = new Date(year, month - 1, day); // month is 0-indexed
        
        // Set due time - default to 8:00 AM if no time specified
        if (assignment.time) {
          // Parse time if provided (e.g., "2:30 PM", "14:30")
          const timeMatch = assignment.time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]) || 0;
            const ampm = timeMatch[3]?.toLowerCase();
            
            if (ampm === 'pm' && hours !== 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
            
            eventDate.setHours(hours, minutes, 0, 0);
          } else {
            eventDate.setHours(8, 0, 0, 0); // Default 8 AM
          }
        } else {
          eventDate.setHours(8, 0, 0, 0); // Default 8 AM
        }
      } else {
        eventDate = new Date(assignment.date);
        if (eventDate.getHours() === 0 && eventDate.getMinutes() === 0) {
          eventDate.setHours(8, 0, 0, 0); // Default 8 AM if no time
        }
      }

      if (isNaN(eventDate.getTime())) {
        console.warn(`⚠️ Invalid date for assignment ${index}:`, assignment.date);
        return;
      }
    } catch (error) {
      console.warn(`⚠️ Date parsing error for assignment ${index}:`, error);
      return;
    }

    // Create timed event (due date/deadline)
    const event = {
      id: assignment.id || `assignment_${index}`,
      title: `📋 ${assignment.text || 'Untitled Assignment'}`, // Add icon to distinguish from class events
      start: eventDate,
      end: new Date(eventDate.getTime() + 30 * 60 * 1000), // 30 minutes duration for deadline
      resource: {
        type: assignment.type || 'assignment',
        source: 'assignment',
        courseCode: course?.code || 'UNKNOWN',
        data: assignment,
        isDue: true // Mark as due date
      }
    };

    events.push(event);
    console.log(`✅ Event ${index}:`, {
      title: event.title,
      start: event.start.toLocaleString(),
      originalDate: assignment.date,
      dueTime: event.start.toLocaleTimeString()
    });
  });

  console.log(`📊 FINAL EVENTS: ${events.length} events created from ${assignments.length} assignments`);

  // STEP 2: Event component for due dates/deadlines
  const DueDateEventComponent = ({ event }) => {
    const isDue = event.resource.isDue;
    const type = event.resource.type;
    
    // Color coding for different types
    let bgColor = '#10b981'; // Default green
    if (type === 'exam' || type === 'quiz') bgColor = '#ef4444'; // Red for exams
    if (type === 'discussion') bgColor = '#3b82f6'; // Blue for discussions
    if (type === 'assignment') bgColor = '#f59e0b'; // Orange for assignments
    
    return (
      <div style={{
        backgroundColor: bgColor,
        color: 'white', 
        padding: '2px 4px',
        borderRadius: '3px',
        fontSize: '10px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        border: isDue ? '1px solid rgba(255,255,255,0.3)' : 'none'
      }}>
        {event.title}
      </div>
    );
  };

  // STEP 3: Handle view change
  const handleViewChange = (newView) => {
    console.log('📅 View changed to:', newView);
    setView(newView);
  };

  const handleSelectEvent = (event) => {
    console.log('🖱️ Event clicked:', event);
    onEventClick({
      id: event.id,
      title: event.title,
      date: event.start,
      type: event.resource.type,
      data: event.resource.data
    });
  };

  // STEP 4: Check events in current view
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const eventsInCurrentMonth = events.filter(event => {
    const eventDate = new Date(event.start);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  console.log(`🗓️ CURRENT VIEW: ${currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
  console.log(`📍 EVENTS IN VIEW: ${eventsInCurrentMonth.length}/${events.length}`);

  return (
    <div className="h-full">
      {/* DEBUG PANEL */}
      <div className="bg-green-100 border border-green-300 p-3 text-sm mb-2 rounded">
        <div className="font-bold">📊 FRESH CALENDAR DEBUG - DUE DATES</div>
        <div>Assignments Received: {assignments.length}</div>
        <div>Events Created: {events.length}</div>
        <div>Current View: {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <div>Events in Current View: {eventsInCurrentMonth.length}</div>
        {events.length > 0 && (
          <div>Date Range: {format(events[0].start, 'MMM d, yyyy')} - {format(events[events.length - 1].start, 'MMM d, yyyy')}</div>
        )}
      </div>

      {/* DUE DATE LIST PREVIEW */}
      {events.length > 0 && (
        <div className="bg-blue-50 border p-2 text-xs mb-2 rounded max-h-20 overflow-y-auto">
          <div className="font-medium mb-1">First 5 Due Dates:</div>
          {events.slice(0, 5).map((event, i) => (
            <div key={i} className="text-xs">
              {format(event.start, 'MMM d h:mm a')} - {event.title}
            </div>
          ))}
        </div>
      )}

      {/* REACT BIG CALENDAR */}
      <div style={{ height: 'calc(100% - 140px)', minHeight: '400px' }}>
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
          components={{
            event: DueDateEventComponent
          }}
          popup={true}
          showMultiDayTimes={false}
          step={60}
          timeslots={1}
          culture="en-US"
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}

export default BigCalendarView;
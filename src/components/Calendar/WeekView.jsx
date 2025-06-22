// src/components/Calendar/WeekView.jsx - Extracted from CalendarView
import React from 'react';

function WeekView({ currentDate, getEventsForDate, onEventClick, isToday, viewMode }) {
  const startOfWeek = new Date(currentDate);
  const dayOfWeek = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-200 p-px rounded-t">
        {days.map((day, index) => (
          <div
            key={index}
            className={`bg-gray-50 p-2 text-center ${
              isToday(day) ? 'bg-blue-100 text-blue-700' : ''
            }`}
          >
            <div className="font-semibold">
              {day.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className={isToday(day) ? 'font-bold' : ''}>
              {day.getDate()}
            </div>
            {isToday(day) && <div className="text-xs">Today</div>}
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8 gap-px bg-gray-300">
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="bg-gray-50 p-2 text-right text-sm">
                {hour % 12 || 12}:00 {hour < 12 ? 'AM' : 'PM'}
              </div>
              {days.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-white p-1 min-h-[40px] relative">
                  {getEventsForDate(day)
                    .filter(event => {
                      if (!event.time) return hour === 9; // Default to 9 AM for events without time
                      const eventHour = new Date(`2000-01-01 ${event.time}`).getHours();
                      return eventHour === hour;
                    })
                    .map((event, i) => (
                      <div
                        key={i}
                        onClick={() => onEventClick(event)}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                          event.type === 'lecture' ? 'bg-purple-100 text-purple-700' :
                          event.type === 'clinical' ? 'bg-pink-100 text-pink-700' :
                          event.type === 'exam' || event.type === 'quiz' ? 'bg-red-100 text-red-700' :
                          event.type === 'study' ? 'bg-blue-100 text-blue-700' :
                          event.type === 'assignment' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        } ${event.source === 'generated' ? 'ring-1 ring-blue-200' : ''}`}
                      >
                        {event.time && (
                          <div className="font-medium">{event.time}</div>
                        )}
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        {viewMode === 'all' && event.courseCode && (
                          <div className="text-xs opacity-75">{event.courseCode}</div>
                        )}
                        {event.hours && (
                          <div className="text-xs opacity-75">{event.hours}h</div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WeekView;
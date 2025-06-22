// src/components/Calendar/MonthView.jsx - Extracted from CalendarView
import React from 'react';

function MonthView({ currentDate, getEventsForDate, onEventClick, isToday, viewMode }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();

  const days = [];

  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px bg-gray-200 p-px rounded-t">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-semibold">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substr(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 p-px rounded-b">
        {days.map((date, index) => (
          <div
            key={index}
            className={`bg-white p-1 sm:p-2 relative ${!date ? 'bg-gray-50' : ''} ${
              date && isToday(date) ? 'ring-2 ring-blue-500 ring-inset' : ''
            } min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] overflow-hidden`}
          >
            {date && (
              <>
                <div className={`font-semibold text-xs sm:text-sm mb-1 ${
                  isToday(date) ? 'text-blue-600' : ''
                }`}>
                  {date.getDate()}
                  {isToday(date) && (
                    <span className="hidden sm:inline text-xs ml-1 text-blue-600">Today</span>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] lg:max-h-[100px]">
                  {getEventsForDate(date).map((event, i) => (
                    <div
                      key={i}
                      onClick={() => onEventClick(event)}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                        event.type === 'lecture' ? 'bg-purple-100 text-purple-700' :
                        event.type === 'clinical' ? 'bg-pink-100 text-pink-700' :
                        event.type === 'exam' || event.type === 'quiz' ? 'bg-red-100 text-red-700' :
                        event.type === 'study' ? 'bg-blue-100 text-blue-700' :
                        event.type === 'assignment' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      } ${
                        event.source === 'generated' ? 'ring-1 ring-blue-200' : ''
                      }`}
                    >
                      <div className="truncate">
                        {event.title}
                        {viewMode === 'all' && event.courseCode && (
                          <span className="ml-1 opacity-75">({event.courseCode})</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {getEventsForDate(date).length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{getEventsForDate(date).length - 3} more
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonthView;
// src/components/Calendar/CalendarStats.jsx - Extracted stats component
import React from 'react';
import { AlertCircle } from 'lucide-react';

function CalendarStats({ assignments, studyBlocks, manualEvents, completedAssignments }) {
  const today = new Date();
  
  const stats = {
    totalStudyHours: studyBlocks.reduce((sum, block) => sum + (block.hours || 0), 0),
    scheduledHours: studyBlocks.reduce((sum, block) => sum + (block.hours || 0), 0),
    upcomingEvents: assignments.filter(a => new Date(a.date) > today).length,
    manualEvents: manualEvents.length
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-purple-50 p-3 rounded">
          <div className="text-sm text-purple-600 font-medium">{stats.totalStudyHours.toFixed(1)}h</div>
          <div className="text-xs text-purple-700">Total Hours</div>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <div className="text-sm text-green-600 font-medium">{stats.scheduledHours.toFixed(1)}h</div>
          <div className="text-xs text-green-700">Scheduled</div>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-sm text-orange-600 font-medium">{stats.upcomingEvents}</div>
          <div className="text-xs text-orange-700">Events</div>
        </div>
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600 font-medium">{stats.manualEvents}</div>
          <div className="text-xs text-gray-700">Manual</div>
        </div>
      </div>
      
      {studyBlocks.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-800">
            Successfully scheduled {studyBlocks.length} study blocks
          </p>
        </div>
      )}
    </div>
  );
}

export default CalendarStats;
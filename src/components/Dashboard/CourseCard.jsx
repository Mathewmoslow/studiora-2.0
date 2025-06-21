// src/components/Dashboard/CourseCard.jsx - FINAL VERSION
import React from 'react';
import { Calendar, Edit2, Trash2 } from 'lucide-react';

function CourseCard({ course, completedAssignments, onSelect, onEdit, onDelete }) {
  const courseAssignments = course.assignments || [];
  const completed = courseAssignments.filter(a => completedAssignments.has(a.id)).length;
  const progress = courseAssignments.length > 0 ? (completed / courseAssignments.length) * 100 : 0;
  
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    red: 'border-red-200 bg-red-50',
    pink: 'border-pink-200 bg-pink-50',
    indigo: 'border-indigo-200 bg-indigo-50',
    yellow: 'border-yellow-200 bg-yellow-50'
  };

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div className={`border-2 rounded-lg p-4 hover:shadow-md transition-all ${
      colorClasses[course.color] || colorClasses.blue
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{course.name}</h3>
          <p className="text-sm text-gray-600">{course.code}</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-white rounded transition-colors"
            title="Edit course"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-white rounded transition-colors"
            title="Delete course"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {course.description && (
        <p className="text-sm text-gray-600 mb-3">{course.description}</p>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{completed}/{courseAssignments.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${progressColors[course.color] || progressColors.blue}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Completion</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>

        <button
          onClick={onSelect}
          className="w-full mt-4 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Calendar className="w-4 h-4" />
          View Calendar
        </button>
      </div>
    </div>
  );
}

export default CourseCard;
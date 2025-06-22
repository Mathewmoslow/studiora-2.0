// src/components/Calendar/EventModals.jsx - Extracted from CalendarView
import React, { useState } from 'react';
import { X, Edit, Trash2, Save, Settings, Download, Upload } from 'lucide-react';

// Event Modal Component
export function EventModal({ 
  showEventModal, 
  selectedEvent, 
  isEditing, 
  editData, 
  setEditData, 
  setIsEditing, 
  onEventUpdate, 
  onEventDelete, 
  onClose 
}) {
  if (!showEventModal || !selectedEvent) return null;

  const handleSave = () => {
    onEventUpdate(editData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editData.type || 'assignment'}
                  onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="lecture">Lecture</option>
                  <option value="clinical">Clinical</option>
                  <option value="study">Study</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div><strong>Title:</strong> {selectedEvent.title}</div>
              <div><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</div>
              <div><strong>Type:</strong> {selectedEvent.type}</div>
              {selectedEvent.courseCode && (
                <div><strong>Course:</strong> {selectedEvent.courseCode}</div>
              )}
              {selectedEvent.hours && (
                <div><strong>Hours:</strong> {selectedEvent.hours}h</div>
              )}
              <div><strong>Source:</strong> {selectedEvent.source}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 border rounded hover:bg-gray-50 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this event?')) {
                    onEventDelete(selectedEvent);
                  }
                }}
                className="px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Event Modal Component
export function AddEventModal({ 
  showAddModal, 
  allCourses, 
  course, 
  onAddEvent, 
  onClose 
}) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'assignment',
    courseCode: course?.code || '',
    hours: 1
  });

  if (!showAddModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.date) {
      onAddEvent(formData);
      setFormData({
        title: '',
        date: '',
        type: 'assignment',
        courseCode: course?.code || '',
        hours: 1
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Add New Event</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2 border rounded"
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="quiz">Quiz</option>
              <option value="lecture">Lecture</option>
              <option value="clinical">Clinical</option>
              <option value="study">Study Session</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Course</label>
            <select
              value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
              className="w-full p-2 border rounded"
            >
              {allCourses.map(course => (
                <option key={course.id} value={course.code}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Study Hours</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="8"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Settings Modal Component
export function SettingsModal({ 
  showSettingsModal, 
  preferences, 
  setPreferences, 
  onClose 
}) {
  if (!showSettingsModal) return null;

  const exportData = () => {
    const data = {
      courses: JSON.parse(localStorage.getItem('studioraData') || '{}').courses || [],
      assignments: JSON.parse(localStorage.getItem('studioraData') || '{}').assignments || [],
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studiora-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const currentData = JSON.parse(localStorage.getItem('studioraData') || '{}');
        
        const mergedData = {
          ...currentData,
          courses: [...(currentData.courses || []), ...(importedData.courses || [])],
          assignments: [...(currentData.assignments || []), ...(importedData.assignments || [])]
        };
        
        localStorage.setItem('studioraData', JSON.stringify(mergedData));
        alert('Data imported successfully! Please refresh the page.');
      } catch (error) {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Study Preferences */}
          <div>
            <h4 className="font-medium mb-3">Study Preferences</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Daily Max Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={preferences.dailyMax}
                  onChange={(e) => setPreferences({ ...preferences, dailyMax: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weekend Max Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={preferences.weekendMax}
                  onChange={(e) => setPreferences({ ...preferences, weekendMax: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Block Duration (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="4"
                  value={preferences.blockDuration}
                  onChange={(e) => setPreferences({ ...preferences, blockDuration: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Energy Level</label>
                <select
                  value={preferences.energyLevel}
                  onChange={(e) => setPreferences({ ...preferences, energyLevel: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="morning">Morning Person</option>
                  <option value="afternoon">Afternoon Peak</option>
                  <option value="evening">Evening Owl</option>
                  <option value="consistent">Consistent Energy</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="2.0"
                  value={preferences.difficultyMultiplier}
                  onChange={(e) => setPreferences({ ...preferences, difficultyMultiplier: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Higher values increase study time for difficult assignments</p>
              </div>
            </div>
          </div>

          {/* Assignment Priorities */}
          <div>
            <h4 className="font-medium mb-3">Assignment Priorities</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Exams & Clinicals</span>
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">HIGH</span>
              </div>
              <div className="flex justify-between">
                <span>Assignments & Quizzes</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">MEDIUM</span>
              </div>
              <div className="flex justify-between">
                <span>Readings & Videos</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">LOW</span>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h4 className="font-medium mb-3">Data Management</h4>
            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full p-2 border rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  id="import-data"
                />
                <label
                  htmlFor="import-data"
                  className="w-full p-2 border rounded hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default { EventModal, AddEventModal, SettingsModal };
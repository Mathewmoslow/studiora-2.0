// src/components/Calendar/CalendarView.jsx - Fixed view handling
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings, Zap, AlertCircle, ArrowLeft } from 'lucide-react';
import BigCalendarView from './CalendarViews';
import CalendarStats from './CalendarStats';
import { EventModal, AddEventModal, SettingsModal } from './EventModals';
import ParserModal from '../Parser/ParserModal';

function CalendarView({ 
  course, 
  assignments = [], 
  completedAssignments, 
  onToggleAssignment, 
  onUpdateAssignment, 
  allCourses = [], 
  showAllCourses = true,
  onBack 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // FIXED: Add view state
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    dailyMax: 4,
    weekendMax: 6,
    blockDuration: 1.5,
    bufferDays: 3,
    difficultyMultiplier: 1.2,
    energyLevel: 'medium'
  });
  
  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [manualEvents, setManualEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showParseModal, setShowParseModal] = useState(false);
  const [showReschedulePrompt, setShowReschedulePrompt] = useState(false);
  
  const today = new Date();
  const viewMode = showAllCourses ? 'all' : 'course';

  // Navigation functions for Big Calendar
  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  // FIXED: Add view change handler
  const handleViewChange = (newView) => {
    setCurrentView(newView);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // Study schedule generation
  const generateStudySchedule = async () => {
    setIsGenerating(true);
    try {
      const upcomingAssignments = assignments.filter(a => 
        new Date(a.date) > today && !completedAssignments?.has?.(a.id)
      );

      const newStudyBlocks = [];
      upcomingAssignments.forEach(assignment => {
        const dueDate = new Date(assignment.date);
        const daysUntilDue = Math.max(1, Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)));
        const studyHours = assignment.hours || 2;
        const blocksNeeded = Math.ceil(studyHours / preferences.blockDuration);

        for (let i = 0; i < blocksNeeded; i++) {
          const studyDate = new Date(today);
          studyDate.setDate(today.getDate() + Math.floor((daysUntilDue * (i + 1)) / (blocksNeeded + 1)));
          
          newStudyBlocks.push({
            id: `study_${assignment.id}_${i}`,
            title: `Study: ${assignment.text}`,
            date: studyDate,
            type: 'study',
            hours: Math.min(preferences.blockDuration, studyHours - (i * preferences.blockDuration)),
            source: 'generated',
            courseCode: course.code,
            assignmentId: assignment.id
          });
        }
      });

      setStudyBlocks(newStudyBlocks);
    } finally {
      setIsGenerating(false);
    }
  };

  // Event handlers
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setEditData(event);
    setShowEventModal(true);
    setIsEditing(false);
  };

  const handleEventUpdate = (updatedEvent) => {
    if (updatedEvent.source === 'manual') {
      setManualEvents(prev => prev.map(e => 
        e.id === updatedEvent.id ? updatedEvent : e
      ));
    } else if (updatedEvent.source === 'generated') {
      setStudyBlocks(prev => prev.map(b =>
        b.id === updatedEvent.id ? updatedEvent : b
      ));
    }
    setShowEventModal(false);
    setIsEditing(false);
  };

  const handleEventDelete = (event) => {
    if (event.source === 'manual') {
      setManualEvents(prev => prev.filter(e => e.id !== event.id));
    } else if (event.source === 'generated') {
      setStudyBlocks(prev => prev.filter(b => b.id !== event.id));
    }
    setShowEventModal(false);
  };

  const handleAddEvent = (newEvent) => {
    const event = {
      ...newEvent,
      id: `manual_${Date.now()}`,
      date: new Date(newEvent.date),
      source: 'manual',
      courseCode: newEvent.courseCode || course.code,
      courseName: allCourses.find(c => c.code === newEvent.courseCode)?.name || course.name
    };

    setManualEvents(prev => [...prev, event]);

    if (event.needsStudyTime) {
      setTimeout(() => generateStudySchedule(), 100);
    }

    setShowAddModal(false);
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold">
            {showAllCourses ? 'All Courses Calendar' : `${course.code} Calendar`}
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowParseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <CalendarStats 
        assignments={assignments}
        studyBlocks={studyBlocks}
        manualEvents={manualEvents}
        completedAssignments={completedAssignments}
      />

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <BigCalendarView
            currentDate={currentDate}
            assignments={assignments}
            studyBlocks={studyBlocks}
            manualEvents={manualEvents}
            course={course}
            viewMode={viewMode}
            currentView={currentView}
            onEventClick={handleEventClick}
            onNavigate={handleNavigate}
            onViewChange={handleViewChange} // FIXED: Pass view change handler
          />
        </div>
      </div>

      {/* Study Schedule Generation */}
      <div className="flex justify-center">
        <button
          onClick={generateStudySchedule}
          disabled={isGenerating || assignments.length === 0}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Study Schedule
            </>
          )}
        </button>
      </div>

      {/* Modals */}
      <EventModal
        showEventModal={showEventModal}
        selectedEvent={selectedEvent}
        isEditing={isEditing}
        editData={editData}
        setEditData={setEditData}
        setIsEditing={setIsEditing}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        onClose={() => setShowEventModal(false)}
      />

      <AddEventModal
        showAddModal={showAddModal}
        allCourses={allCourses}
        course={course}
        onAddEvent={handleAddEvent}
        onClose={() => setShowAddModal(false)}
      />

      <SettingsModal
        showSettingsModal={showSettingsModal}
        preferences={preferences}
        setPreferences={setPreferences}
        onClose={() => setShowSettingsModal(false)}
      />

      {showParseModal && (
        <ParserModal
          courses={allCourses}
          onClose={() => setShowParseModal(false)}
          onComplete={(courseId, assignments) => {
            console.log('Parsed assignments for course:', courseId, assignments);
            setShowParseModal(false);
          }}
        />
      )}

      {/* Add Event FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

export default CalendarView;
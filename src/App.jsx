// src/App.jsx - Fixed Calendar Assignment Passing
import React, { useState, useEffect } from 'react';
import { Upload, Plus } from 'lucide-react';
import Logo from './components/Logo/Logo';
import Dashboard from './components/Dashboard/Dashboard';
import CalendarView from './components/Calendar/CalendarView';
import ParserModal from './components/Parser/ParserModal';
import CourseModal from './components/Course/CourseModal';
import WelcomeScreen from './components/Dashboard/WelcomeScreen';
import { formatAssignmentForDisplay } from './utils/assignmentHelpers';
import './App.css';

function StudioraNursingPlanner() {
  const [courses, setCourses] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState(new Set());
  const [showParser, setShowParser] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [parsingResults, setParsingResults] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('🔍 App state update:', {
      coursesCount: courses.length,
      selectedCourse: selectedCourse?.code,
      selectedCourseAssignments: selectedCourse?.assignments?.length || 0,
      currentView,
      totalAssignments: courses.reduce((sum, c) => sum + (c.assignments?.length || 0), 0)
    });
  }, [courses, selectedCourse, currentView]);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('studioraData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.courses && data.courses.length > 0) {
          const formattedCourses = data.courses.map(course => ({
            ...course,
            assignments: (course.assignments || []).map(formatAssignmentForDisplay)
          }));
          setCourses(formattedCourses);
        }
        setCompletedAssignments(new Set(data.completed || []));
        setParsingResults(data.parsingResults || null);
      } catch (e) {
        console.warn('Failed to load saved data:', e);
      }
    }
  }, []);

  // Save data
  useEffect(() => {
    const data = {
      courses,
      completed: Array.from(completedAssignments),
      parsingResults,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('studioraData', JSON.stringify(data));
  }, [courses, completedAssignments, parsingResults]);

  // Handle course creation
  const handleCreateCourse = (courseData) => {
    const newCourse = {
      ...courseData,
      id: `course_${Date.now()}`,
      assignments: []
    };
    setCourses([...courses, newCourse]);
    setShowCourseModal(false);
  };

  // Handle course update
  const handleUpdateCourse = (courseId, updates) => {
    setCourses(courses.map(c => c.id === courseId ? { ...c, ...updates } : c));
  };

  // Handle course deletion
  const handleDeleteCourse = (courseId) => {
    if (confirm('Are you sure you want to delete this course and all its assignments?')) {
      setCourses(courses.filter(c => c.id !== courseId));
      // Remove completed assignments for this course
      const courseAssignments = courses.find(c => c.id === courseId)?.assignments || [];
      const assignmentIds = courseAssignments.map(a => a.id);
      setCompletedAssignments(prev => {
        const newSet = new Set(prev);
        assignmentIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  // Add assignments to course - FIXED
  const addAssignmentsToCourse = (courseId, assignments) => {
    console.log('🔄 addAssignmentsToCourse called:', courseId, assignments.length);
    console.log('📋 Available courses:', courses);

    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => {
        if (course.id === courseId) {
          console.log('✅ Target course found:', course.code);
          
          const formattedAssignments = assignments.map(a => ({
            ...formatAssignmentForDisplay(a),
            id: a.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            courseId: courseId
          }));

          const updatedCourse = {
            ...course,
            assignments: [...(course.assignments || []), ...formattedAssignments]
          };

          console.log('✅ Course updated:', {
            code: course.code,
            previousCount: course.assignments?.length || 0,
            newCount: updatedCourse.assignments.length,
            addedCount: formattedAssignments.length
          });

          return updatedCourse;
        }
        return course;
      });

      console.log('🔄 Final state update:', updatedCourses);
      return updatedCourses;
    });
  };

  // Verification effect
  useEffect(() => {
    if (courses.length > 0) {
      const totalAssignments = courses.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);
      const targetCourse = courses.find(c => c.code === 'NURS335');
      
      console.log('⏰ State verification:', {
        courseExists: !!targetCourse,
        assignmentCount: targetCourse?.assignments?.length || 0,
        expectedCount: 41
      });
    }
  }, [courses]);

  // Handle parse complete - FIXED race condition
  const handleParseComplete = (courseId, assignments) => {
    console.log('📥 handleParseComplete called:', { courseId, assignmentsLength: assignments.length });
    
    if (courses.length === 0) {
      alert('Please create a course first before importing assignments.');
      setShowCourseModal(true);
      return;
    }

    const targetCourse = courses.find(c => c.id === courseId);
    if (!targetCourse) {
      alert('Target course not found. Please try again.');
      return;
    }

    console.log('✅ Adding assignments to course:', targetCourse.code);
    
    // Close parser modal immediately
    setShowParser(false);
    
    // Update course with assignments
    setCourses(prevCourses => {
      const updatedCourses = prevCourses.map(course => {
        if (course.id === courseId) {
          const formattedAssignments = assignments.map(a => ({
            ...formatAssignmentForDisplay(a),
            id: a.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            courseId: courseId
          }));

          const updatedCourse = {
            ...course,
            assignments: [...(course.assignments || []), ...formattedAssignments]
          };

          // Navigate to calendar with the updated course immediately
          setTimeout(() => {
            console.log('🎯 Navigating to calendar with', updatedCourse.assignments.length, 'assignments');
            setSelectedCourse(updatedCourse);
            setCurrentView('calendar');
          }, 50);

          return updatedCourse;
        }
        return course;
      });

      return updatedCourses;
    });
  };

  // Toggle assignment completion
  const toggleAssignment = (assignmentId) => {
    const newCompleted = new Set(completedAssignments);
    if (newCompleted.has(assignmentId)) {
      newCompleted.delete(assignmentId);
    } else {
      newCompleted.add(assignmentId);
    }
    setCompletedAssignments(newCompleted);
  };

  // Update assignment
  const updateAssignment = (assignmentId, updates) => {
    setCourses(prevCourses => 
      prevCourses.map(course => ({
        ...course,
        assignments: course.assignments.map(a => 
          a.id === assignmentId ? { ...a, ...updates } : a
        )
      }))
    );
  };

  // Handle backup import
  const handleImportBackup = (backupData) => {
    try {
      console.log('📥 Importing backup:', backupData);
      
      // Handle different backup formats
      let dataToImport;
      if (backupData.courses) {
        // Direct format
        dataToImport = {
          courses: backupData.courses || [],
          completed: backupData.completed || [],
          parsingResults: backupData.parsingResults || null
        };
      } else if (backupData.assignments) {
        // Legacy format - convert to new format
        dataToImport = {
          courses: [], // Empty, user will need to create courses
          completed: [],
          parsingResults: null
        };
        alert('Legacy backup detected. You\'ll need to recreate courses and re-import assignments.');
      } else {
        throw new Error('Invalid backup format');
      }
      
      // Format assignments if needed
      if (dataToImport.courses.length > 0) {
        const formattedCourses = dataToImport.courses.map(course => ({
          ...course,
          assignments: (course.assignments || []).map(formatAssignmentForDisplay)
        }));
        setCourses(formattedCourses);
      } else {
        setCourses(dataToImport.courses);
      }
      
      setCompletedAssignments(new Set(dataToImport.completed));
      setParsingResults(dataToImport.parsingResults);
      
      console.log('✅ Backup imported successfully');
      alert('Backup imported successfully!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      alert('Failed to import backup: ' + error.message);
    }
  };

  // Clear all data
  const clearData = () => {
    if (confirm('Clear all data and start fresh? This cannot be undone.')) {
      setCourses([]);
      setCompletedAssignments(new Set());
      setParsingResults(null);
      setSelectedCourse(null);
      localStorage.removeItem('studioraData');
    }
  };

  // Handle course selection - FIXED
  const handleCourseSelect = (course) => {
    console.log('🎯 Course selected:', course?.code || 'ALL', 'with', course?.assignments?.length || 'all', 'assignments');
    
    // Get the latest course data from state
    let currentCourse = course;
    if (course && course.id) {
      currentCourse = courses.find(c => c.id === course.id) || course;
    }
    
    setSelectedCourse(currentCourse);
    setCurrentView('calendar');
  };

  // Handle back navigation from calendar
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedCourse(null);
  };

  // Get all assignments across all courses - FIXED
  const allAssignments = courses.flatMap(course => 
    (course.assignments || []).map(a => ({ 
      ...a, 
      courseCode: course.code, 
      courseName: course.name 
    }))
  );

  // Get current course assignments - FIXED
  const getCurrentCourseAssignments = () => {
    if (!selectedCourse) return allAssignments;
    
    // Always get the latest course data from state
    const currentCourse = courses.find(c => c.id === selectedCourse.id);
    return currentCourse?.assignments || [];
  };

  // Show welcome screen if no courses
  const showWelcome = courses.length === 0 && currentView === 'dashboard';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Logo className="h-8 w-8" />
                <h1 className="text-xl font-bold studiora-text-gradient">Studiora</h1>
              </div>
              <span className="text-sm text-gray-500">Dynamic Study Planner</span>
            </div>

            <div className="flex items-center space-x-2">
              {courses.length > 0 && (
                <>
                  <nav className="hidden md:flex space-x-2">
                    {['dashboard', 'calendar'].map(view => (
                      <button
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`px-3 py-1 rounded text-sm capitalize ${
                          currentView === view ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </nav>
                  
                  <button
                    onClick={() => setShowCourseModal(true)}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add Course</span>
                  </button>
                  
                  <button
                    onClick={() => setShowParser(true)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Upload size={16} />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                </>
              )}
              
              {courses.length > 0 && (
                <button
                  onClick={clearData}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome Screen */}
        {showWelcome && (
          <WelcomeScreen
            onCreateCourse={() => setShowCourseModal(true)}
            onImportBackup={handleImportBackup}
          />
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && !showWelcome && (
          <Dashboard
            courses={courses}
            completedAssignments={completedAssignments}
            parsingResults={parsingResults}
            onCourseSelect={handleCourseSelect}
            onImport={() => setShowParser(true)}
            onCreateCourse={() => setShowCourseModal(true)}
            onUpdateCourse={handleUpdateCourse}
            onDeleteCourse={handleDeleteCourse}
          />
        )}

        {/* Calendar View - FIXED */}
        {currentView === 'calendar' && courses.length > 0 && (
          <CalendarView
            course={selectedCourse}
            assignments={getCurrentCourseAssignments()}
            allCourses={courses}
            showAllCourses={!selectedCourse}
            completedAssignments={completedAssignments}
            onToggleAssignment={toggleAssignment}
            onUpdateAssignment={updateAssignment}
            onBack={handleBackToDashboard}
          />
        )}
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <CourseModal
          onClose={() => setShowCourseModal(false)}
          onSave={handleCreateCourse}
        />
      )}

      {/* Parser Modal */}
      {showParser && (
        <ParserModal 
          courses={courses}
          onClose={() => setShowParser(false)} 
          onComplete={handleParseComplete}
        />
      )}
    </div>
  );
}

export default StudioraNursingPlanner;
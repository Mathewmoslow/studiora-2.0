// src/components/Parser/ParserModal.jsx - Updated without Brain icons
import React, { useState } from 'react';
import { X, AlertCircle, ChevronRight } from 'lucide-react';
import Logo from '../Logo/Logo';
import { StudiorAIService } from '../../services/StudiorAIService';

function ParserModal({ courses, onClose, onComplete }) {
  const [step, setStep] = useState(1); // 1: Parse, 2: Assign to Course
  const [parsedAssignments, setParsedAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');

  const handleParsed = (results) => {
    // Flatten all assignments from modules
    const allAssignments = [];
    results.forEach((module, moduleIndex) => {
      module.assignments.forEach((assignment, assignmentIndex) => {
        allAssignments.push({
          ...assignment,
          id: `parsed_${Date.now()}_${moduleIndex}_${assignmentIndex}`,
          moduleWeek: module.week,
          moduleTitle: module.title
        });
      });
    });
    
    setParsedAssignments(allAssignments);
    setStep(2);
  };

  const handleError = (error) => {
    console.error('Parse error:', error);
  };

  const handleAssignToCourse = () => {
    if (selectedCourse && parsedAssignments.length > 0) {
      onComplete(selectedCourse, parsedAssignments);
    }
  };

  const handleClose = () => {
    if (step === 2 && parsedAssignments.length > 0) {
      if (confirm('Are you sure? You will lose the parsed assignments.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Logo className="h-6 w-6" />
                {step === 1 ? 'Import Course Assignments' : 'Assign to Course'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 1 
                  ? 'Paste your syllabus, Canvas page, or course schedule' 
                  : `${parsedAssignments.length} assignments found - Select a course`}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <StudioraDualParser 
              onParsed={handleParsed}
              onError={handleError}
            />
          ) : (
            <div className="space-y-6">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course for Assignments
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignment Preview */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Assignments to Import:</h3>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-2">
                    {parsedAssignments.map((assignment, index) => (
                      <div key={assignment.id} className="flex items-start space-x-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">{assignment.text}</span>
                          <div className="text-xs text-gray-500">
                            {assignment.date && `Due: ${new Date(assignment.date).toLocaleDateString()}`}
                            {assignment.type && ` • Type: ${assignment.type}`}
                            {assignment.moduleTitle && ` • ${assignment.moduleTitle}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Warning if no courses */}
              {courses.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">No courses found</p>
                    <p className="text-sm text-yellow-700">Please create a course first before importing assignments.</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Parser
                </button>
                <button
                  onClick={handleAssignToCourse}
                  disabled={!selectedCourse || courses.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Import to {courses.find(c => c.id === selectedCourse)?.code || 'Course'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParserModal;
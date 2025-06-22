// src/components/Parser/ParserModal.jsx
// Simplified to use new sequential parser

import React, { useState } from 'react';
import { X, AlertCircle, Brain, Loader } from 'lucide-react';
import Logo from '../Logo/Logo';
import { StudioraDualParser } from '../../services/StudioraDualParser';

function ParserModal({ courses, onClose, onComplete }) {
  const [step, setStep] = useState(1); // 1: Parse, 2: Assign to Course
  const [parsedAssignments, setParsedAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  
  // Parsing state
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState(null);
  
  // Get API key from environment variables
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Please enter some content to parse');
      return;
    }

    setIsLoading(true);
    setProgress([]);
    setError(null);

    try {
      setProgress([{ stage: 'starting', message: 'Initializing parser...' }]);

      const parser = new StudioraDualParser(apiKey);
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      
      const results = await parser.parse(inputText, {
        course: selectedCourseData?.code || 'unknown'
      }, (progressUpdate) => {
        setProgress(prev => [...prev, {
          stage: progressUpdate.stage,
          message: progressUpdate.message,
          timestamp: new Date().toLocaleTimeString()
        }]);
      });

      const assignments = results.assignments || [];
      
      if (assignments.length > 0) {
        const formattedAssignments = assignments.map((assignment, index) => ({
          ...assignment,
          id: assignment.id || `parsed_${Date.now()}_${index}`,
          moduleWeek: assignment.moduleWeek || null,
          moduleTitle: assignment.moduleTitle || null
        }));
        
        setParsedAssignments(formattedAssignments);
        setProgress(prev => [...prev, { 
          stage: 'complete', 
          message: `Successfully found ${formattedAssignments.length} assignments!`
        }]);
        setStep(2);
      } else {
        setProgress(prev => [...prev, { 
          stage: 'complete', 
          message: 'No assignments found in the provided text.' 
        }]);
      }

    } catch (err) {
      setError(err.message);
      setProgress(prev => [...prev, { 
        stage: 'error', 
        message: `❌ Parsing failed: ${err.message}` 
      }]);
    } finally {
      setIsLoading(false);
    }
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
                  ? 'Paste your syllabus, course page, or assignment list' 
                  : `${parsedAssignments.length} assignments found - Select a course`}
              </p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  disabled={isLoading}
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Content
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your syllabus, course page, or assignment list here..."
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Progress Display */}
              {progress.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Progress</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {progress.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {item.stage === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        ) : isLoading && index === progress.length - 1 ? (
                          <Loader className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        <span className={item.stage === 'error' ? 'text-red-600' : ''}>
                          {item.message}
                        </span>
                        {item.timestamp && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {item.timestamp}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-800">Error</span>
                  </div>
                  <p className="text-red-700 mt-1">{error}</p>
                </div>
              )}

              {/* API Key Warning */}
              {!apiKey && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">No API Key</span>
                  </div>
                  <p className="text-yellow-700 mt-1">
                    Studiora enhancement will be skipped. Only regex parsing will be used.
                  </p>
                </div>
              )}

              {/* Parse Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleParse}
                  disabled={!inputText.trim() || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  {isLoading ? 'Parsing...' : 'Parse Content'}
                </button>
              </div>
            </div>
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
                      <div key={assignment.id} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                        <div className="font-medium">{assignment.text}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {assignment.date && `Due: ${new Date(assignment.date).toLocaleDateString()}`}
                          {assignment.type && ` • Type: ${assignment.type}`}
                          {assignment.hours && ` • ${assignment.hours}h`}
                          {assignment.source && ` • Source: ${assignment.source}`}
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
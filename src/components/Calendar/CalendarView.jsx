import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, BookOpen, Plus, X, Check, FileText, Download, Upload, Edit2, Trash2, Brain, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Settings } from 'lucide-react';

// API Configuration
const API_CONFIG = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4',
  temperature: 0.3,
  maxTokens: 10000
};

// Dual Parser Component
function StudioraDualParser({ onParsed, onError }) {
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('mixed');
  const [isLoading, setIsLoading] = useState(false);
  const [parseMethod, setParseMethod] = useState('hybrid');
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState(null);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Regex patterns for different document types
  const patterns = {
    'canvas-modules': {
      moduleTitle: /(?:Module|Week|Unit|Chapter)\s*(\d+)[:\s-]*([^\n]+)/gi,
      assignment: /(?:^|\n)[-•*]?\s*([^:\n]+?)(?:\s*[-–—]\s*|\s*:\s*)?(?:Due|due|DUE)?\s*([A-Za-z]+\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/gm,
      points: /\((\d+(?:\.\d+)?)\s*(?:points?|pts?)\)/gi,
      time: /(?:at|@)\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/gi
    },
    'syllabus': {
      weekSection: /Week\s*(\d+)[:\s-]*([^\n]+)/gi,
      dateRange: /([A-Za-z]+\.?\s*\d{1,2}(?:st|nd|rd|th)?(?:\s*[-–—]\s*[A-Za-z]+\.?\s*\d{1,2}(?:st|nd|rd|th)?)?)/g,
      topic: /(?:Topic|Subject|Focus)[:\s-]*([^\n]+)/gi,
      assignment: /(?:Assignment|Project|Quiz|Exam|Test|Paper|Homework)[:\s-]*([^\n]+?)(?:\s*[-–—]\s*)?(?:Due|due)?\s*([A-Za-z]+\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/gi
    }
  };

  // Regex-based parser
  const parseWithRegex = (text, type) => {
    const results = [];
    const lines = text.split('\n');
    let currentModule = null;
    let confidence = 0;
    let totalMatches = 0;

    // Parse based on document type
    if (type === 'canvas-modules' || type === 'canvas-assignments') {
      // Look for module headers
      const moduleMatches = [...text.matchAll(patterns['canvas-modules'].moduleTitle)];
      totalMatches += moduleMatches.length;

      moduleMatches.forEach(match => {
        currentModule = {
          week: parseInt(match[1]),
          title: match[2].trim(),
          assignments: []
        };
        results.push(currentModule);
      });

      // Look for assignments
      lines.forEach(line => {
        const assignmentMatch = line.match(/[-•*]?\s*([^:\n]+?)(?:\s*[-–—]\s*|\s*:\s*)?(?:Due|due|DUE)?\s*([A-Za-z]+\.?\s*\d{1,2}(?:st|nd|rd|th)?,?\s*\d{2,4}|\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/);
        if (assignmentMatch && currentModule) {
          totalMatches++;
          const assignment = {
            text: assignmentMatch[1].trim(),
            date: parseDate(assignmentMatch[2]),
            type: detectAssignmentType(assignmentMatch[1])
          };

          // Extract points if present
          const pointsMatch = line.match(/\((\d+(?:\.\d+)?)\s*(?:points?|pts?)\)/i);
          if (pointsMatch) {
            assignment.points = parseFloat(pointsMatch[1]);
          }

          currentModule.assignments.push(assignment);
        }
      });
    } else if (type === 'syllabus') {
      // Parse syllabus format
      const weekMatches = [...text.matchAll(patterns.syllabus.weekSection)];
      totalMatches += weekMatches.length;

      weekMatches.forEach(match => {
        const week = {
          week: parseInt(match[1]),
          title: match[2].trim(),
          assignments: []
        };
        results.push(week);
      });

      // Look for assignments in syllabus
      const assignmentMatches = [...text.matchAll(patterns.syllabus.assignment)];
      totalMatches += assignmentMatches.length;

      assignmentMatches.forEach(match => {
        if (results.length > 0) {
          results[results.length - 1].assignments.push({
            text: match[1].trim(),
            date: parseDate(match[2]),
            type: detectAssignmentType(match[1])
          });
        }
      });
    }

    // Calculate confidence score
    confidence = Math.min(100, (totalMatches * 10));

    return { results, confidence };
  };

  // Parse date from various formats
  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    const cleaned = dateStr.trim();
    const currentYear = new Date().getFullYear();

    // Try different date formats
    const formats = [
      /([A-Za-z]+)\.?\s*(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})?/,
      /(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/
    ];

    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        if (format === formats[0]) {
          // Month name format
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthIndex = months.findIndex(m => match[1].toLowerCase().startsWith(m));
          if (monthIndex !== -1) {
            const day = parseInt(match[2]);
            const year = match[3] ? parseInt(match[3]) : currentYear;
            return new Date(year, monthIndex, day);
          }
        } else {
          // Numeric format
          const month = parseInt(match[1]) - 1;
          const day = parseInt(match[2]);
          const year = match[3] ? parseInt(match[3]) : currentYear;
          return new Date(year, month, day);
        }
      }
    }

    // Fallback to native Date parsing
    const parsed = new Date(cleaned);
    return isNaN(parsed) ? null : parsed;
  };

  // Detect assignment type
  const detectAssignmentType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('quiz')) return 'quiz';
    if (lower.includes('exam') || lower.includes('test')) return 'exam';
    if (lower.includes('paper') || lower.includes('essay')) return 'paper';
    if (lower.includes('discussion') || lower.includes('forum')) return 'discussion';
    if (lower.includes('lab')) return 'lab';
    if (lower.includes('project')) return 'project';
    if (lower.includes('reading') || lower.includes('chapter')) return 'reading';
    if (lower.includes('video') || lower.includes('watch')) return 'video';
    if (lower.includes('clinical')) return 'clinical';
    return 'assignment';
  };

  // AI Parser using OpenAI
  const parseWithAI = async (text, type) => {
    if (!apiKey || !apiKey.trim()) {
      throw new Error('OpenAI API key not configured. Please check your environment variables.');
    }

    const systemPrompt = `You are an expert at parsing academic documents and extracting structured information. 
    Extract assignments, due dates, and organize them by modules/weeks. 
    Return valid JSON only, no markdown or explanation.`;

    const userPrompt = `Parse this ${type} document and extract all assignments with their due dates. 
    Return JSON in this exact format:
    {
      "modules": [
        {
          "week": 1,
          "title": "Module Title",
          "assignments": [
            {
              "text": "Assignment name",
              "date": "2024-01-15",
              "type": "quiz|exam|paper|discussion|lab|project|reading|video|clinical|assignment",
              "points": 10
            }
          ]
        }
      ],
      "confidence": 95
    }
    
    Document to parse:
    ${text}`;

    try {
      const response = await fetch(API_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_AI_MODEL || API_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE) || API_CONFIG.temperature,
          max_tokens: API_CONFIG.maxTokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'AI parsing failed');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse JSON response
      const parsed = JSON.parse(content);

      // Convert to expected format
      const results = parsed.modules.map(module => ({
        week: module.week,
        title: module.title,
        assignments: module.assignments.map(a => ({
          ...a,
          date: a.date ? new Date(a.date) : null
        }))
      }));

      return { results, confidence: parsed.confidence || 90 };
    } catch (error) {
      console.error('AI parsing error:', error);
      throw error;
    }
  };

  // Main parse function
  const handleParse = async () => {
    if (!content.trim()) {
      setError('Please paste content to parse');
      return;
    }

    setIsLoading(true);
    setError('');
    setParsedData(null);
    setConfidenceScores(null);

    try {
      let results = null;
      let aiResults = null;
      let regexResults = null;
      let finalConfidence = 0;

      if (parseMethod === 'ai' || parseMethod === 'hybrid') {
        try {
          const aiParsed = await parseWithAI(content, docType);
          aiResults = aiParsed.results;
          finalConfidence = aiParsed.confidence;
        } catch (aiError) {
          console.error('AI parsing failed:', aiError);
          if (parseMethod === 'ai') {
            throw aiError;
          }
        }
      }

      if (parseMethod === 'regex' || parseMethod === 'hybrid') {
        const regexParsed = parseWithRegex(content, docType);
        regexResults = regexParsed.results;
        if (!aiResults) {
          finalConfidence = regexParsed.confidence;
        }
      }

      // Combine results if hybrid
      if (parseMethod === 'hybrid' && aiResults && regexResults) {
        results = mergeResults(aiResults, regexResults);
        finalConfidence = Math.max(aiResults.confidence || 0, regexResults.confidence || 0);
      } else {
        results = aiResults || regexResults;
      }

      if (!results || results.length === 0) {
        throw new Error('No assignments found. Try a different document type or parsing method.');
      }

      setParsedData(results);
      setConfidenceScores({ overall: finalConfidence });
      onParsed(results);
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Merge AI and regex results
  const mergeResults = (aiResults, regexResults) => {
    const merged = [...aiResults];

    // Add any unique assignments from regex results
    regexResults.forEach(regexModule => {
      const existingModule = merged.find(m => m.week === regexModule.week);
      if (existingModule) {
        regexModule.assignments.forEach(regexAssignment => {
          const exists = existingModule.assignments.some(a =>
            a.text.toLowerCase() === regexAssignment.text.toLowerCase()
          );
          if (!exists) {
            existingModule.assignments.push(regexAssignment);
          }
        });
      } else {
        merged.push(regexModule);
      }
    });

    return merged;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Brain className="mr-2" />
        Smart Course Parser
      </h2>

      {/* Parse Method Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parsing Method
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setParseMethod('hybrid')}
            className={`px-4 py-2 rounded ${parseMethod === 'hybrid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Hybrid (Recommended)
          </button>
          <button
            onClick={() => setParseMethod('ai')}
            className={`px-4 py-2 rounded ${parseMethod === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            AI Only
          </button>
          <button
            onClick={() => setParseMethod('regex')}
            className={`px-4 py-2 rounded ${parseMethod === 'regex' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Pattern Only
          </button>
        </div>
      </div>

      {/* Document Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="mixed">Auto-Detect</option>
          <option value="canvas-modules">Canvas Modules Page</option>
          <option value="canvas-assignments">Canvas Assignments Page</option>
          <option value="syllabus">Course Syllabus</option>
          <option value="schedule">Course Schedule/Outline</option>
        </select>
      </div>

      {/* Content Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Course Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your Canvas page, syllabus, or course schedule here..."
          className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={isLoading || (!apiKey && parseMethod !== 'regex')}
        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            Parsing...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5 mr-2" />
            Parse Content
          </>
        )}
      </button>

      {/* Results Preview */}
      {parsedData && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-800">Parse Results</h3>
            {confidenceScores && (
              <span className="text-sm text-green-600">
                Confidence: {confidenceScores.overall}%
              </span>
            )}
          </div>
          <p className="text-sm text-green-700">
            Found {parsedData.length} modules with {
              parsedData.reduce((sum, m) => sum + m.assignments.length, 0)
            } assignments
          </p>
          <div className="mt-2 max-h-40 overflow-y-auto">
            {parsedData.map((module, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-medium text-sm">{module.title}</div>
                <div className="text-xs text-gray-600">
                  {module.assignments.length} assignments
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar View Component
function CalendarView({ course, assignments = [], completedAssignments, onToggleAssignment, onUpdateAssignment, allCourses = [], showAllCourses = true }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month');
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
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [manualEvents, setManualEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReschedulePrompt, setShowReschedulePrompt] = useState(false);
  const [viewMode, setViewMode] = useState(showAllCourses ? 'all' : 'single');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    type: 'event',
    hours: 1,
    description: '',
    time: '09:00',
    needsStudyTime: false,
    courseCode: course?.code || ''
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all assignments from all courses if in 'all' view mode
  const allAssignments = useMemo(() => {
    if (viewMode === 'all' && allCourses.length > 0) {
      return allCourses.flatMap(c =>
        c.assignments.map(a => ({ ...a, courseCode: c.code, courseName: c.name }))
      );
    }
    return assignments.map(a => ({ ...a, courseCode: course.code, courseName: course.name }));
  }, [viewMode, allCourses, assignments, course]);

  // Extract events from assignments
  const extractedEvents = useMemo(() => {
    const eventsFromAssignments = allAssignments.filter(a => {
      const type = a.type?.toLowerCase() || '';
      return ['exam', 'quiz', 'clinical', 'lab', 'presentation'].includes(type) ||
        a.text?.toLowerCase().includes('exam') ||
        a.text?.toLowerCase().includes('quiz') ||
        a.text?.toLowerCase().includes('clinical');
    }).map(a => ({
      id: `event_${a.id}`,
      title: a.text,
      date: new Date(a.date),
      type: a.type || 'exam',
      hours: a.hours || 2,
      assignmentId: a.id,
      courseCode: a.courseCode,
      courseName: a.courseName,
      source: 'assignment'
    }));

    return eventsFromAssignments;
  }, [allAssignments]);

  // Combine all events
  const allEvents = useMemo(() => {
    return [...extractedEvents, ...studyBlocks, ...manualEvents];
  }, [extractedEvents, studyBlocks, manualEvents]);

  // Regenerate schedule after assignment completion
  useEffect(() => {
    if (showReschedulePrompt) {
      const timer = setTimeout(() => {
        setShowReschedulePrompt(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showReschedulePrompt]);

  // Generate study schedule
  const generateStudySchedule = () => {
    setIsGenerating(true);
    const newStudyBlocks = [];

    // Get assignments that need study time (not events)
    const studyableAssignments = allAssignments.filter(a => {
      if (!a.date) return false;
      const isEvent = extractedEvents.some(e => e.assignmentId === a.id);
      const isCompleted = completedAssignments.has(a.id);
      return !isEvent && !isCompleted;
    });

    // Sort by due date and priority
    studyableAssignments.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const priorityA = a.priority || (a.type === 'exam' ? 1 : 3);
      const priorityB = b.priority || (b.type === 'exam' ? 1 : 3);

      if (dateA.getTime() === dateB.getTime()) {
        return priorityA - priorityB;
      }
      return dateA - dateB;
    });

    // Schedule each assignment
    studyableAssignments.forEach(assignment => {
      const dueDate = new Date(assignment.date);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      let hoursNeeded = assignment.hours || estimateHours(assignment);

      // Apply difficulty multiplier if enabled
      if (preferences.difficultyMultiplier && assignment.difficulty) {
        hoursNeeded *= (1 + (assignment.difficulty - 3) * 0.2);
      }

      let currentDate = new Date(startDate);

      while (hoursNeeded > 0 && currentDate <= dueDate) {
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Adjust max hours based on energy level
        let maxToday = isWeekend ? preferences.weekendMax : preferences.dailyMax;
        if (preferences.energyLevel === 'low') maxToday *= 0.8;
        if (preferences.energyLevel === 'high') maxToday *= 1.2;

        // Check existing hours for this day
        const existingHours = newStudyBlocks
          .filter(b => b.date.toDateString() === currentDate.toDateString())
          .reduce((sum, b) => sum + b.hours, 0);

        if (existingHours < maxToday) {
          const hoursToSchedule = Math.min(
            preferences.blockDuration,
            hoursNeeded,
            maxToday - existingHours
          );

          newStudyBlocks.push({
            id: `study_${Date.now()}_${Math.random()}`,
            date: new Date(currentDate),
            title: `Study: ${assignment.text.substring(0, 30)}...`,
            fullTitle: assignment.text,
            type: 'study',
            hours: hoursToSchedule,
            assignmentId: assignment.id,
            courseCode: assignment.courseCode,
            courseName: assignment.courseName,
            description: `Study block for: ${assignment.text}`,
            source: 'generated'
          });

          hoursNeeded -= hoursToSchedule;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    setStudyBlocks(newStudyBlocks);
    setTimeout(() => setIsGenerating(false), 500);
  };

  // Estimate study hours
  const estimateHours = (assignment) => {
    const type = assignment.type?.toLowerCase() || '';
    const text = assignment.text?.toLowerCase() || '';

    if (type === 'reading' || text.includes('chapter')) {
      const chapterCount = (text.match(/chapter/gi) || []).length;
      return Math.max(chapterCount * 1.5, 2);
    }

    if (type === 'video' || text.includes('video') || text.includes('watch')) {
      return 1;
    }

    if (type === 'paper' || type === 'project' || text.includes('paper') || text.includes('project')) {
      return 4;
    }

    if (type === 'discussion' || text.includes('discussion') || text.includes('post')) {
      return 1;
    }

    return 2;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toDateString();
    return allEvents.filter(event => event.date.toDateString() === dateStr);
  };

  // Handle event click with completion toggle
  const handleEventClick = (event) => {
    // If it's an assignment event and user clicks on it from calendar
    if (event.source === 'assignment' && onToggleAssignment) {
      const assignment = allAssignments.find(a => a.id === event.assignmentId);
      if (assignment && !completedAssignments.has(assignment.id)) {
        // Show completion option in the modal
      }
    }
    setSelectedEvent(event);
    setShowEventModal(true);
    setIsEditing(false);
  };

  // Watch for assignment completion to trigger reschedule prompt
  useEffect(() => {
    const checkForCompletions = () => {
      const hasStudyBlocks = studyBlocks.length > 0;
      const hasIncompleteAssignments = allAssignments.some(a =>
        !completedAssignments.has(a.id) && !extractedEvents.some(e => e.assignmentId === a.id)
      );

      if (hasStudyBlocks && hasIncompleteAssignments) {
        // Assignment was just completed, show reschedule prompt
        setShowReschedulePrompt(true);
      }
    };

    checkForCompletions();
  }, [completedAssignments]);

  // Handle event update
  const handleEventUpdate = (updatedEvent) => {
    if (updatedEvent.source === 'assignment' && onUpdateAssignment) {
      onUpdateAssignment(updatedEvent.assignmentId, {
        text: updatedEvent.title,
        date: updatedEvent.date,
        type: updatedEvent.type,
        hours: updatedEvent.hours,
        description: updatedEvent.description
      });
    } else if (updatedEvent.source === 'manual') {
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

  // Handle event delete
  const handleEventDelete = (event) => {
    if (event.source === 'manual') {
      setManualEvents(prev => prev.filter(e => e.id !== event.id));
    } else if (event.source === 'generated') {
      setStudyBlocks(prev => prev.filter(b => b.id !== event.id));
    }
    setShowEventModal(false);
  };

  // Handle add new event
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

    // If it needs study time, regenerate schedule
    if (event.needsStudyTime) {
      setTimeout(() => generateStudySchedule(), 100);
    }

    setShowAddModal(false);
  };

  // Check if date is today
  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  // Month view component
  const MonthView = () => {
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
              className={`bg-white p-1 sm:p-2 relative ${!date ? 'bg-gray-50' : ''} ${date && isToday(date) ? 'ring-2 ring-blue-500 ring-inset' : ''
                } min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] overflow-hidden`}
            >
              {date && (
                <>
                  <div className={`font-semibold text-xs sm:text-sm mb-1 ${isToday(date) ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                    {isToday(date) && <span className="hidden sm:inline text-xs ml-1 text-blue-600">Today</span>}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] lg:max-h-[100px]">
                    {getEventsForDate(date).map((event, i) => (
                      <div
                        key={i}
                        onClick={() => handleEventClick(event)}
                        className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${event.type === 'lecture' ? 'bg-purple-100 text-purple-700' :
                          event.type === 'clinical' ? 'bg-pink-100 text-pink-700' :
                            event.type === 'exam' || event.type === 'quiz' ? 'bg-red-100 text-red-700' :
                              event.type === 'study' ? 'bg-blue-100 text-blue-700' :
                                event.type === 'assignment' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-700'
                          } ${event.source === 'generated' ? 'ring-1 ring-blue-200' : ''
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
  };

  // Week view component
  const WeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-px bg-gray-200 p-px rounded-t">
          {days.map((day, index) => (
            <div
              key={index}
              className={`bg-gray-50 p-2 text-center ${isToday(day) ? 'bg-blue-50' : ''
                }`}
            >
              <div className="text-xs text-gray-600">
                <span className="hidden sm:inline">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="sm:hidden">{day.toLocaleDateString('en-US', { weekday: 'short' }).substr(0, 1)}</span>
              </div>
              <div className={`text-lg font-semibold ${isToday(day) ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 p-px rounded-b overflow-y-auto">
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white p-1 sm:p-2 space-y-1 overflow-y-auto">
              {getEventsForDate(day).map((event, eventIndex) => (
                <div
                  key={eventIndex}
                  onClick={() => handleEventClick(event)}
                  className={`text-xs p-1 sm:p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${event.type === 'lecture' ? 'bg-purple-100 text-purple-700' :
                    event.type === 'clinical' ? 'bg-pink-100 text-pink-700' :
                      event.type === 'exam' || event.type === 'quiz' ? 'bg-red-100 text-red-700' :
                        event.type === 'study' ? 'bg-blue-100 text-blue-700' :
                          event.type === 'assignment' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                    } ${event.source === 'generated' ? 'ring-1 ring-blue-200' : ''
                    }`}
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
        </div>
      </div>
    );
  };

  // Event Modal
  const EventModal = () => {
    if (!showEventModal || !selectedEvent) return null;

    if (isEditing) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={editData.time || ''}
                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="lecture">Lecture</option>
                    <option value="clinical">Clinical</option>
                    <option value="exam">Exam</option>
                    <option value="study">Study Block</option>
                    <option value="assignment">Assignment</option>
                    <option value="event">Other Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input
                    type="number"
                    value={editData.hours}
                    onChange={(e) => setEditData({ ...editData, hours: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    step="0.5"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              {selectedEvent?.source === 'manual' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData.needsStudyTime}
                    onChange={(e) => setEditData({ ...editData, needsStudyTime: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Needs study time scheduled</span>
                </label>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEventUpdate({
                    ...selectedEvent,
                    ...editData,
                    date: new Date(editData.date)
                  })}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">{selectedEvent?.title}</h3>
            <button
              onClick={() => setShowEventModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">
                {selectedEvent?.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {selectedEvent?.time && (
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-medium">{selectedEvent.time}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium capitalize">{selectedEvent?.type}</p>
            </div>

            {selectedEvent?.hours && (
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{selectedEvent.hours} hours</p>
              </div>
            )}

            {selectedEvent?.description && (
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{selectedEvent.description}</p>
              </div>
            )}

            {selectedEvent?.source && (
              <div>
                <p className="text-sm text-gray-600">Source</p>
                <p className="font-medium capitalize">
                  {selectedEvent.source === 'generated' ? 'Auto-generated' : selectedEvent.source}
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              {(selectedEvent?.source === 'manual' || selectedEvent?.source === 'generated') && (
                <>
                  <button
                    onClick={() => {
                      setEditData({
                        title: selectedEvent.title,
                        date: selectedEvent.date.toISOString().split('T')[0],
                        time: selectedEvent.time || '',
                        type: selectedEvent.type,
                        hours: selectedEvent.hours || 1,
                        description: selectedEvent.description || '',
                        needsStudyTime: selectedEvent.needsStudyTime || false
                      });
                      setIsEditing(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this event?')) {
                        handleEventDelete(selectedEvent);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Event Modal
  const AddEventModal = () => {
    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Add New Event</h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Event title..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="lecture">Lecture</option>
                  <option value="clinical">Clinical</option>
                  <option value="exam">Exam</option>
                  <option value="study">Study Block</option>
                  <option value="assignment">Assignment</option>
                  <option value="event">Other Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hours</label>
                <input
                  type="number"
                  value={newEvent.hours}
                  onChange={(e) => setNewEvent({ ...newEvent, hours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  step="0.5"
                  min="0"
                  placeholder="2"
                />
              </div>
            </div>

            {viewMode === 'all' && allCourses.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select
                  value={newEvent.courseCode}
                  onChange={(e) => setNewEvent({ ...newEvent, courseCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {allCourses.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                placeholder="Additional details..."
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newEvent.needsStudyTime}
                onChange={(e) => setNewEvent({ ...newEvent, needsStudyTime: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm">Needs study time scheduled</span>
            </label>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newEvent.title.trim()) {
                    handleAddEvent(newEvent);
                  }
                }}
                disabled={!newEvent.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (7 * direction));
    setCurrentDate(newDate);
  };

  // Settings Modal Component
  const SettingsModal = () => {
    if (!showSettingsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Scheduler Settings
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>

            <div className="space-y-6">
              {/* Study Time Limits */}
              <div>
                <h4 className="font-medium mb-3">Study Time Limits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Daily Max (hours)</label>
                    <input
                      type="number"
                      value={preferences.dailyMax}
                      onChange={(e) => setPreferences({ ...preferences, dailyMax: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Weekend Max (hours)</label>
                    <input
                      type="number"
                      value={preferences.weekendMax}
                      onChange={(e) => setPreferences({ ...preferences, weekendMax: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Block Duration (hours)</label>
                    <input
                      type="number"
                      value={preferences.blockDuration}
                      onChange={(e) => setPreferences({ ...preferences, blockDuration: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0.5"
                      max="4"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Buffer Days Before Due</label>
                    <input
                      type="number"
                      value={preferences.bufferDays}
                      onChange={(e) => setPreferences({ ...preferences, bufferDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="1"
                      max="7"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h4 className="font-medium mb-3">Advanced Settings</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Energy Level</label>
                    <select
                      value={preferences.energyLevel}
                      onChange={(e) => setPreferences({ ...preferences, energyLevel: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="low">Low (80% capacity)</option>
                      <option value="medium">Medium (100% capacity)</option>
                      <option value="high">High (120% capacity)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty Multiplier</label>
                    <input
                      type="number"
                      value={preferences.difficultyMultiplier}
                      onChange={(e) => setPreferences({ ...preferences, difficultyMultiplier: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                      min="0.5"
                      max="2"
                      step="0.1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Adjusts time based on assignment difficulty</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    generateStudySchedule();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply & Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stats
  const stats = useMemo(() => {
    const studyableAssignments = allAssignments.filter(a =>
      !extractedEvents.some(e => e.assignmentId === a.id) && a.date && !completedAssignments.has(a.id)
    );

    return {
      totalAssignments: studyableAssignments.length,
      totalStudyHours: studyableAssignments.reduce((sum, a) => sum + (a.hours || estimateHours(a)), 0),
      scheduledHours: studyBlocks.reduce((sum, b) => sum + b.hours, 0),
      upcomingEvents: extractedEvents.filter(e => e.date >= new Date()).length,
      manualEvents: manualEvents.length
    };
  }, [allAssignments, extractedEvents, studyBlocks, manualEvents, completedAssignments]);

  return (
    <div className="space-y-6">
      {/* Reschedule Prompt */}
      {showReschedulePrompt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-green-800">Task completed! Would you like to reschedule your remaining study blocks?</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowReschedulePrompt(false);
                generateStudySchedule();
              }}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Yes, Reschedule
            </button>
            <button
              onClick={() => setShowReschedulePrompt(false)}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              No, Thanks
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Scheduler Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Dynamic Study Scheduler
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'all' ? 'single' : 'all')}
              className={`px-3 py-2 rounded flex items-center gap-2 ${viewMode === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {viewMode === 'all' ? 'All Courses' : 'Single Course'}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
            <button
              onClick={generateStudySchedule}
              disabled={isGenerating || stats.totalAssignments === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Generate Schedule</span>
                </>
              )}
            </button>
            <button
              onClick={() => setStudyBlocks([])}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600">Daily Max (hrs)</label>
            <input
              type="number"
              value={preferences.dailyMax}
              onChange={(e) => setPreferences({ ...preferences, dailyMax: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="1"
              max="12"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Weekend Max (hrs)</label>
            <input
              type="number"
              value={preferences.weekendMax}
              onChange={(e) => setPreferences({ ...preferences, weekendMax: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="1"
              max="8"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Block Duration</label>
            <input
              type="number"
              value={preferences.blockDuration}
              onChange={(e) => setPreferences({ ...preferences, blockDuration: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
              min="0.5"
              max="3"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Buffer Days</label>
            <input
              type="number"
              value={preferences.bufferDays}
              onChange={(e) => setPreferences({ ...preferences, bufferDays: parseInt(e.target.value) })}
              className="w-full p-2 border rounded"
              min="1"
              max="7"
            />
          </div>
        </div>

        {/* Schedule Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600 font-medium">{stats.totalAssignments}</div>
            <div className="text-xs text-blue-700">Study Tasks</div>
          </div>
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
      </div>

      {/* Calendar Views */}
      <div className="bg-white rounded-lg shadow overflow-hidden h-[600px] lg:h-[700px] flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => currentView === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <button
                onClick={() => currentView === 'month' ? navigateMonth(1) : navigateWeek(1)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-3 py-1 rounded ${currentView === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Month
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-3 py-1 rounded ${currentView === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Week
              </button>
            </div>
          </div>

          {viewMode === 'all' && (
            <div className="text-sm text-purple-600 font-medium">
              Showing events from all {allCourses.length} courses
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden p-2">
          {currentView === 'month' && <MonthView />}
          {currentView === 'week' && <WeekView />}
        </div>
      </div>

      {/* Event Modals */}
      <EventModal />

      {/* Add Event Modal */}
      <AddEventModal />

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}

// Export components
export default CalendarView;
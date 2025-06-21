// src/utils/assignmentHelpers.js - FINAL VERSION

export const formatAssignmentForDisplay = (assignment) => {
  const actionVerbs = {
    'reading': 'READ', 
    'video': 'WATCH', 
    'quiz': 'QUIZ', 
    'exam': 'TEST',
    'assignment': 'DO', 
    'discussion': 'DISCUSS', 
    'clinical': 'ATTEND',
    'simulation': 'PRACTICE', 
    'prep': 'STUDY', 
    'activity': 'COMPLETE', 
    'remediation': 'REVIEW',
    'lab': 'COMPLETE',
    'project': 'WORK ON',
    'paper': 'WRITE'
  };

  const priorities = {
    'exam': 'HIGH', 
    'quiz': 'MEDIUM', 
    'clinical': 'HIGH', 
    'assignment': 'MEDIUM',
    'reading': 'LOW', 
    'video': 'LOW',
    'discussion': 'LOW',
    'lab': 'HIGH',
    'project': 'HIGH',
    'paper': 'HIGH'
  };

  const actionVerb = actionVerbs[assignment.type] || 'DO';
  const priority = priorities[assignment.type] || 'MEDIUM';
  
  let cleanText = assignment.text
    .replace(/^(assignment|quiz|exam|reading|video|discussion)[\s:]+/i, '')
    .replace(/\s*\(due[^)]*\)/i, '')
    .trim();

  return {
    ...assignment,
    actionVerb, 
    priority, 
    cleanText,
    displayTitle: `${actionVerb}: ${cleanText}`,
    hours: assignment.hours || estimateHours(assignment)
  };
};

export const estimateHours = (assignment) => {
  const type = assignment.type?.toLowerCase() || '';
  const text = assignment.text?.toLowerCase() || '';

  if (type === 'reading' || text.includes('chapter')) {
    const chapterCount = (text.match(/chapter/gi) || []).length;
    return Math.max(chapterCount * 1.5, 2);
  }

  if (type === 'video' || text.includes('video') || text.includes('watch')) {
    return 1;
  }

  if (type === 'paper' || text.includes('paper')) {
    if (text.includes('final') || text.includes('research')) return 8;
    return 4;
  }

  if (type === 'project' || text.includes('project')) {
    if (text.includes('final') || text.includes('group')) return 6;
    return 4;
  }

  if (type === 'discussion' || text.includes('discussion') || text.includes('post')) {
    return 1;
  }

  if (type === 'quiz') {
    return 1.5;
  }

  if (type === 'exam' || type === 'clinical' || type === 'lab') {
    return 0; // These are events, not study tasks
  }

  return 2; // Default estimate
};

export const getActionIcon = (actionVerb) => {
  const icons = {
    'READ': '📖', 
    'WATCH': '📺', 
    'QUIZ': '❓', 
    'TEST': '📝', 
    'DO': '✏️',
    'DISCUSS': '💬', 
    'ATTEND': '🏥', 
    'PRACTICE': '🎯', 
    'STUDY': '📚',
    'COMPLETE': '✅', 
    'REVIEW': '🔄',
    'WORK ON': '🔨',
    'WRITE': '✍️'
  };
  return icons[actionVerb] || '📋';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'HIGH': 'bg-red-100 text-red-700 border-red-200',
    'MEDIUM': 'bg-yellow-100 text-yellow-700 border-yellow-200', 
    'LOW': 'bg-green-100 text-green-700 border-green-200'
  };
  return colors[priority] || colors['MEDIUM'];
};
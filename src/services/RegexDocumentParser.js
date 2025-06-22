// src/services/RegexDocumentParser.js
// Generic parser for any educational content

export class RegexDocumentParser {
  constructor() {
    this.patterns = {
      // Universal date patterns
      date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+\w+\s+\d{4})|(\w+\s+\d{1,2})|(\d{1,2}\/\d{1,2})|(\d{1,2}-\d{1,2})/gi,
      
      // Assignment patterns - universal terms
      assignment: /(?:assignment|quiz|exam|test|project|paper|discussion|reading|chapter|video|lab|homework|worksheet|case\s*study|activity|exercise|review|study|complete|submit|turn\s*in|due)[\s:]*(.+?)(?=\n|$)/gi,
      
      // Due date patterns
      dueDate: /(?:due|deadline|submit\s*by|turn\s*in\s*by|complete\s*by|finish\s*by)[\s:]*(.*?)(?=\n|$)/gi,
      
      // Week/module patterns
      module: /(?:module|unit|chapter|week|lesson|section)\s*(\d+):?\s*(.+?)(?=(?:module|unit|chapter|week|lesson|section)\s*\d+|\n\n|$)/gis,
      
      // Time patterns
      time: /(\d{1,2}:\d{2}\s*[AaPp][Mm])|(\d{1,2}[AaPp][Mm])|(\d{1,2}:\d{2})/gi,
      
      // Points/grade patterns
      points: /(\d+)\s*(?:points?|pts?|%)/gi,
      
      // Relative date patterns
      relativeDate: /(?:next\s+week|this\s+week|next\s+\w+day|tomorrow|today|end\s+of\s+week)/gi
    };
  }

  parse(text) {
    const results = {
      assignments: [],
      modules: [],
      events: [],
      metadata: {
        originalLength: text.length,
        parsingMethod: 'regex-generic'
      }
    };

    try {
      text = this.cleanText(text);
      
      // Extract modules/weeks first for context
      this.extractModules(text, results);
      
      // Extract assignments
      this.extractAssignments(text, results);
      
      // Post-process results
      this.postProcess(results);
      
    } catch (error) {
      console.error('RegexDocumentParser error:', error);
      results.metadata.error = error.message;
    }

    return results;
  }

  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, '    ')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  extractModules(text, results) {
    const moduleMatches = text.matchAll(this.patterns.module);
    
    for (const match of moduleMatches) {
      const module = {
        number: parseInt(match[1]),
        title: match[2].trim(),
        assignments: [],
        source: 'regex-module'
      };
      
      // Find assignments within this module
      const moduleText = match[0];
      const moduleAssignments = this.extractAssignmentsFromSection(moduleText);
      module.assignments = moduleAssignments;
      
      results.modules.push(module);
    }
  }

  extractAssignments(text, results) {
    // Extract from assignment patterns
    const assignmentMatches = text.matchAll(this.patterns.assignment);
    for (const match of assignmentMatches) {
      const assignment = this.parseAssignment(match[0], text);
      if (assignment && !this.isDuplicate(assignment, results.assignments)) {
        results.assignments.push(assignment);
      }
    }
    
    // Extract from due date patterns
    const dueDateMatches = text.matchAll(this.patterns.dueDate);
    for (const match of dueDateMatches) {
      const assignment = this.parseAssignmentFromDueDate(match[0], text);
      if (assignment && !this.isDuplicate(assignment, results.assignments)) {
        results.assignments.push(assignment);
      }
    }
  }

  extractAssignmentsFromSection(sectionText) {
    const assignments = [];
    const assignmentMatches = sectionText.matchAll(this.patterns.assignment);
    
    for (const match of assignmentMatches) {
      const assignment = this.parseAssignment(match[0], sectionText);
      if (assignment) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  }

  parseAssignment(text, fullContext) {
    const assignment = {
      id: this.generateId(),
      text: this.cleanAssignmentText(text),
      date: this.extractDate(text, fullContext),
      type: this.determineType(text),
      hours: this.estimateHours(text),
      points: this.extractPoints(text),
      confidence: 0.8,
      source: 'regex',
      extractedFrom: text.trim()
    };

    return assignment.text ? assignment : null;
  }

  parseAssignmentFromDueDate(text, fullContext) {
    const parts = text.split(/due|deadline|submit/i);
    if (parts.length < 2) return null;

    const assignmentPart = parts[0].trim();
    const datePart = parts[1].trim();
    
    if (!assignmentPart) return null;

    return {
      id: this.generateId(),
      text: this.cleanAssignmentText(assignmentPart),
      date: this.parseDate(datePart),
      type: this.determineType(assignmentPart),
      hours: this.estimateHours(assignmentPart),
      points: this.extractPoints(text),
      confidence: 0.7,
      source: 'regex-due-date',
      extractedFrom: text.trim()
    };
  }

  cleanAssignmentText(text) {
    return text
      .replace(this.patterns.assignment, '$1')
      .replace(/^[\s:-]+|[\s:-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractDate(text, context) {
    // Try direct date patterns
    const dateMatch = text.match(this.patterns.date);
    if (dateMatch) {
      return this.parseDate(dateMatch[0]);
    }

    // Try due date patterns
    const dueDateMatch = text.match(this.patterns.dueDate);
    if (dueDateMatch) {
      return this.parseDate(dueDateMatch[1]);
    }

    // Try relative dates
    const relativeDateMatch = text.match(this.patterns.relativeDate);
    if (relativeDateMatch) {
      return this.parseRelativeDate(relativeDateMatch[0]);
    }

    // Look in surrounding context
    const contextLines = context.split('\n');
    const textIndex = contextLines.findIndex(line => line.includes(text));
    
    if (textIndex !== -1) {
      for (let i = Math.max(0, textIndex - 2); i <= Math.min(contextLines.length - 1, textIndex + 2); i++) {
        const lineDate = contextLines[i].match(this.patterns.date);
        if (lineDate) {
          return this.parseDate(lineDate[0]);
        }
      }
    }

    return null;
  }

  parseDate(dateStr) {
    if (!dateStr) return null;
    
    const currentYear = new Date().getFullYear();
    
    try {
      // Handle "Month Day" format
      if (/^\w+\s+\d{1,2}$/.test(dateStr.trim())) {
        const date = new Date(`${dateStr}, ${currentYear}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      // Handle MM/DD or MM/DD/YY formats
      if (/^\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?$/.test(dateStr.trim())) {
        const parts = dateStr.split(/[\/\-]/);
        const month = parseInt(parts[0]) - 1;
        const day = parseInt(parts[1]);
        const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : currentYear;
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }

      // Try parsing as-is
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }

    } catch (e) {
      console.warn('Date parsing failed:', dateStr, e);
    }

    return null;
  }

  parseRelativeDate(dateStr) {
    const now = new Date();
    const lowerDate = dateStr.toLowerCase();

    // Map weekdays
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < weekdays.length; i++) {
      if (lowerDate.includes(weekdays[i])) {
        const targetDay = i;
        const currentDay = now.getDay();
        let daysUntil = targetDay - currentDay;
        
        if (daysUntil <= 0) {
          daysUntil += 7;
        }
        
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntil);
        return targetDate.toISOString().split('T')[0];
      }
    }

    // Handle other relative terms
    if (lowerDate.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }

    if (lowerDate.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    if (lowerDate.includes('today')) {
      return now.toISOString().split('T')[0];
    }

    // Default fallback
    const defaultDate = new Date(now);
    defaultDate.setDate(now.getDate() + 7);
    return defaultDate.toISOString().split('T')[0];
  }

  determineType(text) {
    const lowerText = text.toLowerCase();
    
    if (/\b(?:exam|test|midterm|final)\b/i.test(text)) return 'exam';
    if (/\b(?:quiz|assessment)\b/i.test(text)) return 'quiz';
    if (/\b(?:reading|chapter|textbook)\b/i.test(text)) return 'reading';
    if (/\b(?:video|watch|view)\b/i.test(text)) return 'video';
    if (/\b(?:discussion|forum|post)\b/i.test(text)) return 'discussion';
    if (/\b(?:lab|laboratory)\b/i.test(text)) return 'lab';
    if (/\b(?:project|paper|essay|report)\b/i.test(text)) return 'project';
    if (/\b(?:homework|hw|worksheet)\b/i.test(text)) return 'homework';
    if (/\b(?:case\s*study|scenario)\b/i.test(text)) return 'case-study';
    if (/\b(?:presentation|present)\b/i.test(text)) return 'presentation';
    
    return 'assignment';
  }

  estimateHours(text) {
    const type = this.determineType(text);
    const baseHours = {
      'reading': 2,
      'video': 1,
      'quiz': 1,
      'exam': 2,
      'assignment': 2,
      'discussion': 1,
      'lab': 3,
      'project': 4,
      'homework': 2,
      'case-study': 2,
      'presentation': 3
    };

    let hours = baseHours[type] || 2;

    // Adjust based on content indicators
    if (/\b(?:final|comprehensive|major)\b/i.test(text)) {
      hours *= 1.5;
    }

    return Math.max(0.5, Math.min(8, hours));
  }

  extractPoints(text) {
    const pointsMatch = text.match(this.patterns.points);
    return pointsMatch ? parseInt(pointsMatch[1]) : null;
  }

  isDuplicate(newAssignment, existingAssignments) {
    return existingAssignments.some(existing => {
      const textSimilarity = this.calculateTextSimilarity(existing.text, newAssignment.text);
      const sameDate = existing.date === newAssignment.date;
      
      return textSimilarity > 0.8 || (sameDate && textSimilarity > 0.6);
    });
  }

  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  postProcess(results) {
    // Remove duplicates
    results.assignments = this.deduplicateAssignments(results.assignments);
    
    // Sort by date
    results.assignments.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

    // Update metadata
    results.metadata.assignmentsFound = results.assignments.length;
    results.metadata.modulesFound = results.modules.length;
  }

  deduplicateAssignments(assignments) {
    const unique = [];
    const seen = new Set();
    
    assignments.forEach(assignment => {
      const key = `${assignment.text.toLowerCase()}-${assignment.date}-${assignment.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(assignment);
      }
    });
    
    return unique;
  }

  generateId() {
    return `regex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default RegexDocumentParser;
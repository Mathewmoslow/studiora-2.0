// src/services/StudioraDualParser.js
// Sequential enhancement: Regex → AI Consolidation

import { RegexDocumentParser } from './RegexDocumentParser';
import { StudiorAIService } from './StudiorAIService';

export class StudioraDualParser {
  constructor(apiKey, options = {}) {
    this.regexParser = new RegexDocumentParser();
    this.aiService = new StudiorAIService(apiKey, options);
    this.parsingId = `parse_${Date.now()}`;
    
    console.log('🎓 StudioraDualParser initialized');
    console.log('🔑 API Key present:', !!apiKey);
  }

  async parse(text, options = {}, onProgress = null) {
    const { course = 'unknown' } = options;
    
    console.log('🎓 Starting sequential enhancement parsing...');
    console.log('📄 Text length:', text.length);
    console.log('📚 Target course:', course);
    
    onProgress?.({ stage: 'starting', message: 'Initializing sequential parser...' });
    
    try {
      // STAGE 1: Regex parsing (always runs)
      onProgress?.({ stage: 'regex', message: 'Regex extracting assignments...' });
      
      const regexResults = await this.parseWithRegex(text, course);
      
      console.log('📊 Regex found:', regexResults.assignments.length, 'assignments');
      onProgress?.({ 
        stage: 'regex-complete', 
        message: `Regex found ${regexResults.assignments.length} assignments`,
        results: regexResults 
      });

      // STAGE 2: AI consolidation (if API key available)
      let finalResults = regexResults;
      if (this.aiService.apiKey) {
        onProgress?.({ stage: 'ai-consolidate', message: 'AI consolidating results...' });
        
        const remainingText = this.removeFoundContent(text, regexResults.assignments);
        console.log('📄 Remaining text length:', remainingText.length, 'characters');
        
        const consolidatedResults = await this.aiService.consolidateResults(
          regexResults.assignments, 
          remainingText,
          { onProgress }
        );
        
        console.log('✅ AI consolidation completed');
        console.log('📊 Final count:', consolidatedResults.assignments.length);
        
        // Estimate AI cost
        const estimatedInputTokens = Math.ceil(remainingText.length / 4);
        const estimatedOutputTokens = Math.ceil(JSON.stringify(consolidatedResults).length / 4);
        const inputCost = (estimatedInputTokens / 1000000) * 2.50; // $2.50 per 1M input tokens
        const outputCost = (estimatedOutputTokens / 1000000) * 10.00; // $10.00 per 1M output tokens
        const totalCost = inputCost + outputCost;
        console.log(`💰 Estimated AI cost: ${totalCost.toFixed(4)} (${estimatedInputTokens} input + ${estimatedOutputTokens} output tokens)`);
        
        finalResults = this.formatFinalResults(
          consolidatedResults,
          regexResults,
          course
        );
      } else {
        console.warn('⚠️ No API key - using regex results only');
        finalResults = this.formatResults(regexResults, 'regex-only', course);
      }

      console.log('✅ Final result:', finalResults.assignments.length, 'total assignments');
      
      onProgress?.({ 
        stage: 'complete', 
        message: `Completed: ${finalResults.assignments.length} assignments found`,
        results: finalResults 
      });
      
      return finalResults;
      
    } catch (error) {
      console.error('❌ Sequential parsing failed:', error);
      onProgress?.({ stage: 'error', message: `Error: ${error.message}` });
      throw error;
    }
  }

  async parseWithRegex(text, course) {
    const results = this.regexParser.parse(text);
    
    // Add course context to all assignments
    results.assignments.forEach(assignment => {
      assignment.course = course;
    });
    
    return {
      ...results,
      confidence: this.calculateRegexConfidence(results, text)
    };
  }

  removeFoundContent(originalText, foundAssignments) {
    let remainingText = originalText;
    
    // Sort by position in text (reverse order to avoid index shifts)
    const sortedAssignments = [...foundAssignments].sort((a, b) => {
      const posA = a.extractedFrom ? originalText.indexOf(a.extractedFrom) : -1;
      const posB = b.extractedFrom ? originalText.indexOf(b.extractedFrom) : -1;
      return posB - posA;
    });
    
    // Remove found content
    sortedAssignments.forEach(assignment => {
      if (assignment.extractedFrom) {
        const lines = remainingText.split('\n');
        const filteredLines = lines.filter(line => {
          const trimmedLine = line.trim();
          const extractedTrimmed = assignment.extractedFrom.trim();
          
          // Only remove if exact match or clear substring
          return !(trimmedLine === extractedTrimmed || 
                  (trimmedLine.includes(extractedTrimmed) && 
                   trimmedLine.length < extractedTrimmed.length * 1.5));
        });
        
        remainingText = filteredLines.join('\n');
      }
    });
    
    return remainingText;
  }

  formatFinalResults(consolidatedResults, originalRegexResults, course) {
    const assignments = (consolidatedResults.assignments || []).map(assignment => ({
      ...assignment,
      course: course
    }));

    const finalConfidence = this.calculateFinalConfidence(
      originalRegexResults.assignments?.length || 0,
      assignments.length
    );
    
    return {
      assignments: assignments,
      modules: originalRegexResults.modules || [],
      events: originalRegexResults.events || [],
      metadata: {
        method: 'sequential-consolidation',
        confidence: finalConfidence,
        summary: consolidatedResults.summary || `Found ${assignments.length} assignments`,
        stages: {
          regexFound: originalRegexResults.assignments?.length || 0,
          aiConsolidated: assignments.length
        },
        course: course,
        parsingId: this.parsingId,
        timestamp: Date.now(),
        version: '2.1-consolidated'
      }
    };
  }

  formatResults(results, method, course) {
    const assignments = (results.assignments || []).map(assignment => ({
      ...assignment,
      course: course
    }));

    return {
      assignments: assignments,
      modules: results.modules || [],
      events: results.events || [],
      metadata: {
        method: method,
        confidence: this.calculateRegexConfidence(results, ''),
        summary: `Found ${assignments.length} assignments using ${method}`,
        course: course,
        parsingId: this.parsingId,
        timestamp: Date.now(),
        version: '2.1-consolidated'
      }
    };
  }

  calculateRegexConfidence(results, text) {
    let confidence = 0.5;
    
    if (results.assignments.length > 0) {
      const withDates = results.assignments.filter(a => a.date).length;
      confidence += (withDates / results.assignments.length) * 0.3;
      
      const withTypes = results.assignments.filter(a => a.type !== 'assignment').length;
      confidence += (withTypes / results.assignments.length) * 0.1;
    }
    
    // Content indicators
    if (/\b(?:quiz|exam|assignment|reading|video|discussion)\b/i.test(text)) confidence += 0.1;
    
    return Math.min(0.9, confidence);
  }

  calculateFinalConfidence(regexCount, finalCount) {
    if (finalCount === 0) return 0.1;
    
    let confidence = 0.6; // Base for sequential method
    
    // Boost for AI consolidation
    if (finalCount > regexCount) {
      confidence += 0.2; // AI found additional items
    }
    
    // Boost for reasonable counts
    if (finalCount >= 5 && finalCount <= 100) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }
}

export default StudioraDualParser;
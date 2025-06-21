// src/services/StudiorAIService.js
// StudiorAIService - Refined for Studiora 2.0 with Advanced Prompt Engineering
// Handles AI parsing, enhancement, and validation of assignments

export class StudiorAIService {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.model = options.model || import.meta.env.VITE_AI_MODEL || 'gpt-4';
    this.baseURL = options.baseURL || 'https://api.openai.com/v1';
    this.timeout = parseInt(import.meta.env.VITE_AI_TIMEOUT) || 60000;
    this.maxRetries = 3;

    this.tokenLimits = {
      'gpt-4': 128000,
      'gpt-4-turbo': 128000,
      'gpt-4o': 128000,
      'gpt-3.5-turbo': 16000
    };

    this.maxTokens = this.tokenLimits[this.model] || 8000;

    console.log(`🤖 StudiorAIService initialized: ${this.model}`);
  }

  async parseWithAI(text, options = {}) {
    const { documentType = 'mixed', onProgress } = options;
    onProgress?.({ stage: 'ai-start', message: 'AI parsing started...' });

    try {
      if (this.needsChunking(text)) {
        return await this.parseInChunks(text, options);
      }

      const prompt = this.buildParsingPrompt(text, documentType);
      const result = await this.makeRequest(prompt, {
        temperature: 0.3,
        taskType: 'parsing'
      });

      onProgress?.({ stage: 'ai-complete', message: 'AI parsing complete' });
      return this.validateResult(result);
    } catch (error) {
      console.error('🤖 AI parsing failed:', error);
      throw error;
    }
  }

  async enhanceRegexResults(assignments, originalText, options = {}) {
    const { onProgress } = options;
    onProgress?.({ stage: 'ai-enhance', message: 'AI enhancing regex results...' });

    const prompt = this.buildEnhancementPrompt(assignments, originalText);

    try {
      const result = await this.makeRequest(prompt, {
        temperature: 0.2,
        taskType: 'enhancement'
      });
      
      const enhanced = this.mergeEnhancements(assignments, result);
      
      // Return expected structure for StudioraDualParser
      return {
        validatedAssignments: enhanced,
        confidence: enhanced.length > 0 ? 0.9 : 0.7,
        insights: [`Enhanced ${enhanced.length} assignments`]
      };
    } catch (error) {
      console.error('🤖 AI enhancement failed:', error);
      return {
        validatedAssignments: assignments,
        confidence: 0.7,
        insights: ['Enhancement failed, using original assignments']
      };
    }
  }

  async findAdditionalAssignments(remainingText, existingAssignments, options = {}) {
    const { onProgress } = options;
    onProgress?.({ stage: 'ai-additional', message: 'AI searching for additional assignments...' });

    const prompt = this.buildAdditionalSearchPrompt(remainingText, existingAssignments);

    try {
      const result = await this.makeRequest(prompt, {
        temperature: 0.3,
        taskType: 'additional-search'
      });
      return this.validateResult(result);
    } catch (error) {
      console.error('🤖 AI additional search failed:', error);
      return { assignments: [] };
    }
  }

  buildParsingPrompt(text, documentType) {
    const currentDate = new Date().toISOString().split('T')[0];

    return `You are an expert educational parser. Your ONLY job is to extract structured assignment data.

Follow these steps exactly:
1. Identify all task-like statements (explicit or implied).
2. Extract or infer values for each assignment.
3. Use the format below, exactly as shown.
4. If a field is unknown, use null (not blank).
5. Return ONLY valid, parsable JSON. No prose. No markdown.

STRICT JSON FORMAT:
{
  "assignments": [
    {
      "text": "Complete assignment description",
      "date": "YYYY-MM-DD",
      "type": "quiz|exam|reading|assignment|discussion|clinical|lab",
      "hours": 1.5,
      "points": 10,
      "module": "Module name or number",
      "confidence": 0.95
    }
  ],
  "metadata": {
    "documentType": "${documentType}",
    "totalAssignments": 0,
    "dateRange": {
      "start": "YYYY-MM-DD",
      "end": "YYYY-MM-DD"
    }
  }
}

DOCUMENT DATE: ${currentDate}

DOCUMENT TO PARSE:
${text.substring(0, 15000)} ${text.length > 15000 ? '...[truncated]' : ''}`;
  }

  buildEnhancementPrompt(assignments, originalText) {
    return `You are enhancing structured assignment data.

INSTRUCTIONS:
- Use the surrounding original text to fill in or correct the assignment details.
- Fix vague descriptions and approximate values.
- Improve each entry's accuracy without removing valid items.
- Return JSON ONLY in the format below. Do not wrap in markdown.

ORIGINAL TEXT:
${originalText.substring(0, 5000)}

ASSIGNMENTS TO ENHANCE:
${JSON.stringify(assignments, null, 2)}

OUTPUT FORMAT:
{
  "enhancedAssignments": [
    {
      "id": "original_id",
      "isValid": true,
      "text": "Enhanced description",
      "date": "YYYY-MM-DD",
      "type": "assignment_type",
      "hours": 1.5,
      "enhancements": ["what was improved"]
    }
  ]
}`;
  }

  buildAdditionalSearchPrompt(remainingText, existingAssignments) {
    return `You are detecting assignments that may have been missed.

RULES:
- Do not duplicate any existing assignment.
- Look for implicit, preparatory, or narrative-format tasks.
- Treat review, prep, or study suggestions as assignments if actionable.
- Output ONLY clean JSON in this format:

{
  "assignments": [
    {
      "text": "Assignment description",
      "date": "YYYY-MM-DD or null",
      "type": "assignment_type",
      "hours": 1.5,
      "reason": "Why this is an assignment"
    }
  ]
}

ALREADY FOUND:
${existingAssignments.slice(0, 5).map(a => `- ${a.text} (${a.date})`).join('\n')}
${existingAssignments.length > 5 ? `...and ${existingAssignments.length - 5} more` : ''}

REMAINING TEXT:
${remainingText.substring(0, 10000)}`;
  }

  async makeRequest(prompt, options = {}) {
    const { temperature = 0.3, taskType = 'general' } = options;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are an expert AI parser. Return only valid, parsable JSON. Never return markdown or prose.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature,
            max_tokens: Math.min(4000, this.maxTokens)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(`API error ${response.status}: ${error.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) throw new Error('No content in API response');
        return this.parseJSON(content);
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error.message);
        if (attempt === this.maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  parseJSON(content) {
    const cleaned = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  needsChunking(text) {
    const estimatedTokens = text.length / 4;
    return estimatedTokens > (this.maxTokens * 0.6);
  }

  async parseInChunks(text, options) {
    const chunks = this.createChunks(text);
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      options.onProgress?.({ stage: 'ai-chunk', message: `Processing chunk ${i + 1}/${chunks.length}...` });
      const chunkResult = await this.parseWithAI(chunks[i], { ...options, isChunk: true });
      if (chunkResult.assignments?.length > 0) results.push(chunkResult);
      if (i < chunks.length - 1) await this.delay(1000);
    }
    return this.mergeChunkResults(results);
  }

  createChunks(text) {
    const maxChunkSize = Math.floor(this.maxTokens * 2.5);
    const chunks = [];
    const weekPattern = /Week \d+|Module \d+/g;
    const splits = text.split(weekPattern);
    if (splits.length > 1) {
      let currentChunk = '';
      for (const split of splits) {
        if (currentChunk.length + split.length > maxChunkSize) {
          chunks.push(currentChunk);
          currentChunk = split;
        } else {
          currentChunk += split;
        }
      }
      if (currentChunk) chunks.push(currentChunk);
    } else {
      for (let i = 0; i < text.length; i += maxChunkSize) {
        chunks.push(text.substring(i, i + maxChunkSize));
      }
    }
    return chunks;
  }

  mergeChunkResults(results) {
    const merged = {
      assignments: [],
      metadata: {
        totalAssignments: 0,
        chunks: results.length
      }
    };
    const seen = new Set();
    results.forEach(result => {
      if (result.assignments) {
        result.assignments.forEach(a => {
          const key = `${a.text}-${a.date}`;
          if (!seen.has(key)) {
            merged.assignments.push(a);
            seen.add(key);
          }
        });
      }
    });
    merged.metadata.totalAssignments = merged.assignments.length;
    return merged;
  }

  mergeEnhancements(originalAssignments, enhancementResult) {
    const enhanced = enhancementResult.enhancedAssignments || [];
    const enhancedMap = new Map(enhanced.map(e => [e.id, e]));
    return originalAssignments.map(original => {
      const enhancement = enhancedMap.get(original.id);
      if (enhancement && enhancement.isValid) {
        return {
          ...original,
          ...enhancement,
          aiEnhanced: true,
          source: 'regex+ai'
        };
      }
      return original;
    }).filter(a => {
      const enhancement = enhancedMap.get(a.id);
      return !enhancement || enhancement.isValid !== false;
    });
  }

  validateResult(result) {
    if (!result || typeof result !== 'object') return { assignments: [] };
    const assignments = (result.assignments || []).filter(a => a.text && a.text.length > 5).map(a => ({
      ...a,
      id: a.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: this.validateDate(a.date),
      type: a.type || 'assignment',
      hours: this.validateHours(a.hours),
      confidence: Math.max(0, Math.min(1, a.confidence || 0.8)),
      source: 'ai'
    }));
    return {
      ...result,
      assignments
    };
  }

  validateDate(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      if (year < 2024 || year > 2026) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  validateHours(hours) {
    const h = parseFloat(hours);
    if (isNaN(h)) return 1.5;
    return Math.max(0.25, Math.min(8, h));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default StudiorAIService;
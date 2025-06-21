// src/components/Parser/StudioraDualParser.jsx - FINAL VERSION
import React, { useState } from 'react';
import { Brain, RefreshCw, AlertCircle } from 'lucide-react';

function StudioraDualParser({ onParsed, onError }) {
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState('mixed');
  const [isLoading, setIsLoading] = useState(false);
  const [parseMethod, setParseMethod] = useState('hybrid');
  const [error, setError] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState(null);

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
      // Import the parser service
      const { StudioraDualParser } = await import('../../services/StudioraDualParser');
      
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const parser = new StudioraDualParser(apiKey);
      
      const results = await parser.parse(content, docType, (progress) => {
        // Could add progress tracking here if needed
        console.log('Parse progress:', progress);
      });

      if (!results.assignments || results.assignments.length === 0) {
        throw new Error('No assignments found. Try a different document type or parsing method.');
      }

      // Format results for parent component
      const formattedModules = results.modules || [{
        week: 1,
        title: 'Parsed Assignments',
        assignments: results.assignments
      }];

      setParsedData(formattedModules);
      setConfidenceScores({ overall: results.metadata?.confidence || 0 });
      onParsed(formattedModules);
      
    } catch (err) {
      setError(err.message);
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Parse Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parsing Method
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setParseMethod('hybrid')}
            className={`px-4 py-2 rounded ${
              parseMethod === 'hybrid' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Hybrid (Recommended)
          </button>
          <button
            onClick={() => setParseMethod('ai')}
            className={`px-4 py-2 rounded ${
              parseMethod === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            AI Only
          </button>
          <button
            onClick={() => setParseMethod('regex')}
            className={`px-4 py-2 rounded ${
              parseMethod === 'regex' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Pattern Only
          </button>
        </div>
      </div>

      {/* Document Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Document Type
        </label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="mixed">Auto-Detect</option>
          <option value="canvas-modules">Canvas Modules Page</option>
          <option value="canvas-assignments">Canvas Assignments Page</option>
          <option value="syllabus">Course Syllabus</option>
          <option value="schedule">Course Schedule/Outline</option>
        </select>
      </div>

      {/* Content Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Course Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your Canvas page, syllabus, or course schedule here..."
          className="w-full h-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Supports Canvas pages, syllabi, course schedules, and more
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={isLoading || !content.trim()}
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-green-800">Parse Results</h3>
            {confidenceScores && (
              <span className="text-sm text-green-600">
                Confidence: {Math.round(confidenceScores.overall)}%
              </span>
            )}
          </div>
          <p className="text-sm text-green-700">
            Found {parsedData.length} modules with {
              parsedData.reduce((sum, m) => sum + m.assignments.length, 0)
            } assignments
          </p>
        </div>
      )}
    </div>
  );
}

export default StudioraDualParser;
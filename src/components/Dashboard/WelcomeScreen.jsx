// src/components/Dashboard/WelcomeScreen.jsx - With Import
import React, { useRef } from 'react';
import { Plus, Upload, Calendar, Clock } from 'lucide-react';
import Logo from '../Logo/Logo';

function WelcomeScreen({ onCreateCourse, onImportData }) {
  const fileInputRef = useRef(null);

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // Handle different backup formats
        let dataToSave;
        if (importedData.courses) {
          dataToSave = {
            courses: importedData.courses || [],
            completed: importedData.completed || [],
            parsingResults: importedData.parsingResults || null,
            lastSaved: new Date().toISOString()
          };
        } else {
          throw new Error('Invalid backup format - missing courses data');
        }
        
        localStorage.setItem('studioraData', JSON.stringify(dataToSave));
        alert('Data imported successfully! Refreshing page...');
        window.location.reload();
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <Logo className="h-20 w-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">
            <span className="studiora-text-gradient">Welcome to Studiora</span>
          </h1>
          <p className="text-xl text-gray-600">
            Your intelligent study planner that adapts to your schedule
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={onCreateCourse}
              className="studiora-gradient text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2 justify-center text-lg font-medium"
            >
              <Plus className="h-5 w-5" />
              <span>Create Your First Course</span>
            </button>
            
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 justify-center text-lg font-medium"
              >
                <Upload className="h-5 w-5" />
                <span>Import Backup</span>
              </button>
            </div>
          </div>

          <div className="space-y-6 text-left">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">1. Create Your First Course</h3>
                <p className="text-gray-600">Add your courses with custom names and colors to organize your studies</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-full p-3 flex-shrink-0">
                <Upload className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">2. Import Your Assignments</h3>
                <p className="text-gray-600">Paste your syllabus or Canvas page and let our AI extract all assignments automatically</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 rounded-full p-3 flex-shrink-0">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">3. Generate Your Study Schedule</h3>
                <p className="text-gray-600">Our dynamic scheduler creates optimal study blocks based on your preferences and deadlines</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <h3 className="font-medium">Smart Scheduling</h3>
            <p className="text-sm text-gray-600">Automatically schedules study time based on assignment complexity</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="h-8 w-8 studiora-gradient rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <h3 className="font-medium">AI-Powered Parsing</h3>
            <p className="text-sm text-gray-600">Extracts assignments from any course material format</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium">Dynamic Calendar</h3>
            <p className="text-sm text-gray-600">Visualize your schedule and track progress in real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
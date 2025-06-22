// src/components/Dashboard/Dashboard.jsx - FINAL VERSION
import React, { useState } from 'react';
import { BookOpen, Clock, AlertCircle, Target } from 'lucide-react';
import StatsCard from './StatsCard';
import CourseCard from './CourseCard';
import CourseModal from '../Course/CourseModal';

function Dashboard({ 
  courses, 
  completedAssignments, 
  parsingResults, 
  onCourseSelect, 
  onImport, 
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse 
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Get all assignments across all courses
  const allAssignments = courses.flatMap(course => 
    course.assignments.map(a => ({ 
      ...a, 
      courseCode: course.code, 
      courseName: course.name 
    }))
  );

  // Calculate stats
  const stats = {
    total: allAssignments.length,
    completed: allAssignments.filter(a => completedAssignments.has(a.id)).length,
    totalHours: allAssignments.reduce((sum, a) => sum + (a.hours || 0), 0),
    dueThisWeek: allAssignments.filter(a => {
      if (!a.date) return false;
      const dueDate = new Date(a.date);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return dueDate <= weekFromNow && dueDate >= new Date() && !completedAssignments.has(a.id);
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assignments"
          value={stats.total}
          subtitle={`${stats.completed} completed`}
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Study Hours"
          value={stats.totalHours.toFixed(1)}
          subtitle="Total estimated"
          icon={Clock}
          color="green"
        />
        <StatsCard
          title="Due This Week"
          value={stats.dueThisWeek}
          subtitle="Upcoming"
          icon={AlertCircle}
          color="orange"
        />
        <StatsCard
          title="Completion Rate"
          value={`${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`}
          subtitle="Overall progress"
          icon={Target}
          color="purple"
        />
      </div>

      {/* Courses Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Your Courses</h2>
          {courses.length > 0 && (
            <button
              onClick={() => onCourseSelect(null)} // null indicates all courses view
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              View All Courses Calendar
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">No courses created yet</p>
            <button
              onClick={onCreateCourse}
              className="text-blue-600 hover:text-blue-800"
            >
              Create your first course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                completedAssignments={completedAssignments}
                onSelect={() => onCourseSelect(course)}
                onEdit={() => {
                  setEditingCourse(course);
                  setShowEditModal(true);
                }}
                onDelete={() => onDeleteCourse(course.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {allAssignments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Assignments</h2>
          <div className="space-y-2">
            {allAssignments
              .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
              .slice(0, 5)
              .map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{assignment.displayTitle || assignment.text}</p>
                    <p className="text-xs text-gray-500">
                      {assignment.courseName} • Due {new Date(assignment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-xs">
                    {completedAssignments.has(assignment.id) ? (
                      <span className="text-green-600">Completed</span>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Parsing Results */}
      {parsingResults && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-2">Last Import Results</h3>
          <div className="text-sm space-y-1">
            <div>Method: {parsingResults.metadata?.method || 'Unknown'}</div>
            <div>Confidence: {Math.round((parsingResults.metadata?.confidence || 0) * 100)}%</div>
            <div>Modules Found: {parsingResults.modules?.length || 0}</div>
            <div className="text-xs text-gray-600 mt-2">
              {parsingResults.metadata?.summary || 'Import completed successfully'}
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && (
        <CourseModal
          course={editingCourse}
          onClose={() => {
            setShowEditModal(false);
            setEditingCourse(null);
          }}
          onSave={(updatedData) => {
            onUpdateCourse(editingCourse.id, updatedData);
            setShowEditModal(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
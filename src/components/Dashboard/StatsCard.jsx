// src/components/Dashboard/StatsCard.jsx - FINAL VERSION
import React from 'react';

function StatsCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3">
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
// components/TreeManagement/TreeStats.jsx
import React from 'react';
import { Trees, TrendingUp } from 'lucide-react';

const TreeStats = ({ stats, totalTrees }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 font-semibold">Total Trees</p>
            <p className="text-2xl font-bold text-green-800">{totalTrees || stats?.total_trees || 0}</p>
          </div>
          <Trees className="w-8 h-8 text-green-600" />
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-semibold">Avg Height</p>
            <p className="text-2xl font-bold text-blue-800">{stats?.avg_height || 0}m</p>
          </div>
          <TrendingUp className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-600 font-semibold">Avg Diameter</p>
            <p className="text-2xl font-bold text-purple-800">{stats?.avg_diameter || 0}cm</p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-600" />
        </div>
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-600 font-semibold">Forests</p>
            <p className="text-2xl font-bold text-orange-800">
              {stats?.trees_by_forest?.length || 0}
            </p>
          </div>
          <Trees className="w-8 h-8 text-orange-600" />
        </div>
      </div>
    </div>
  );
};

export default TreeStats;

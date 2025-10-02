import React from 'react';
import { Play, X } from 'lucide-react';

const TutorialInvitation = ({ onStart, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="bg-blue-600 rounded-full p-3 flex-shrink-0">
          <Play className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            First time here? Start with our interactive guide!
          </h3>
          <p className="text-gray-700 mb-4">
            Learn how to create your EUDR report in 5 minutes with our step-by-step tutorial. 
            We'll guide you through each step of the process.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              <Play className="w-5 h-5" />
              Start Guide
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              I prefer to explore on my own
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TutorialInvitation;
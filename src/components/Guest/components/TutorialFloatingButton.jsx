import React from 'react';
import { Play } from 'lucide-react';

const TutorialFloatingButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-xl hover:bg-blue-700 transition-all hover:scale-110 z-50 group"
      title="Restart tutorial"
    >
      <Play className="w-6 h-6" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Need help? Restart the guide
      </span>
    </button>
  );
};

export default TutorialFloatingButton;
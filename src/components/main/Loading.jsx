import React from 'react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white to-slate-100">
      <div className="relative w-32 h-32">
        {/* Orbital paths */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300 animate-spin-slow"></div>
        <div className="absolute inset-4 rounded-full border-2 border-dashed border-blue-400 animate-spin-reverse-slower"></div>

        {/* Orbiting dots */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full shadow-md animate-ping-fast"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-md animate-ping-slow"></div>
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-2.5 h-2.5 bg-pink-400 rounded-full shadow-md animate-ping-delay"></div>
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-md animate-ping-delay-2"></div>
        
        {/* Center pulse */}
        <div className="absolute inset-1/3 w-12 h-12 bg-blue-100/60 rounded-full animate-pulse shadow-xl backdrop-blur-md" />
      </div>
    </div>
  );
};

export default Loading;

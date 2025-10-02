import React from 'react';

const TutorialHighlight = ({ children, isActive = true }) => {
  if (!isActive) return children;

  return (
    <div className="relative">
      <div className="absolute inset-0 ring-4 ring-blue-500 ring-opacity-50 rounded-lg pointer-events-none z-[9998]" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      <div className="relative z-[9999]">
        {children}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default TutorialHighlight;
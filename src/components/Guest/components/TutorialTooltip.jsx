import React from 'react';
import { AlertCircle, X, ChevronRight, ChevronLeft } from 'lucide-react';

const TutorialTooltip = ({ step, onNext, onPrev, onSkip, isFirst, isLast, totalSteps, currentIndex, position = "top" }) => {
  const isWelcomeStep = step.highlight === 'welcome';
  
  if (isWelcomeStep) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-2xl p-6 text-white border-2 border-blue-400 max-w-xl mx-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {step.step}
              </div>
              <h3 className="font-bold text-lg">{step.title}</h3>
            </div>
            <button
              onClick={onSkip}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-white/95 mb-4 text-sm leading-relaxed">
            {step.description}
          </p>

          {/* GIF Demo - Welcome step */}
          {step.gifUrl && (
            <div className="mb-4 rounded-lg overflow-hidden border-2 border-white/20 bg-white/5">
              <img 
                src={step.gifUrl} 
                alt={`${step.title} demonstration`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          )}

          {/* Tips */}
          {step.tips && (
            <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-300" />
                <span className="font-semibold text-sm">Practical tips:</span>
              </div>
              <ul className="space-y-1.5">
                {step.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-white/90 flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-white/20">
            <button
              onClick={onPrev}
              disabled={isFirst}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                isFirst
                  ? 'text-white/40 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={onNext}
              className="flex items-center gap-1 px-4 py-1.5 bg-white text-blue-600 rounded font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              {step.action}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx <= currentIndex
                    ? 'w-8 bg-white'
                    : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }

  // For other steps, relative positioning
  const positionClasses = {
    top: "bottom-full mb-4",
    bottom: "top-full mt-4",
    left: "right-full mr-4",
    right: "left-full ml-4"
  };

  return (
    <div className={`absolute ${positionClasses[position]} left-1/2 -translate-x-1/2 z-[10000] w-96`} style={{ animation: 'fadeIn 0.3s ease-out', pointerEvents: 'auto' }}>
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-2xl p-6 text-white border-2 border-blue-400">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
              {step.step}
            </div>
            <h3 className="font-bold text-lg">{step.title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-white/95 mb-4 text-sm leading-relaxed">
          {step.description}
        </p>

        {/* GIF Demo - Regular steps */}
        {step.gifUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-white/20 bg-white/5">
            <img 
              src={step.gifUrl} 
              alt={`${step.title} demonstration`}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Detailed steps if available */}
        {step.detailedSteps && (
          <div className="mb-4 space-y-2">
            {step.detailedSteps.map((detailStep, idx) => (
              <div key={idx} className="bg-white/10 rounded p-3 backdrop-blur">
                <p className="font-semibold text-sm mb-1">{detailStep.title}</p>
                <p className="text-xs text-white/80">{detailStep.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        {step.tips && (
          <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-300" />
              <span className="font-semibold text-sm">Practical tips:</span>
            </div>
            <ul className="space-y-1.5">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-white/90 flex items-start gap-2">
                  <span className="text-yellow-300 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/20">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
              isFirst
                ? 'text-white/40 cursor-not-allowed'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 bg-white text-blue-600 rounded font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            {isLast ? 'Finish' : step.action}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx <= currentIndex
                  ? 'w-8 bg-white'
                  : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Arrow pointing to element */}
      <div className={`absolute left-1/2 -translate-x-1/2 ${
        position === 'bottom' ? '-top-2' : '-bottom-2'
      }`}>
        <div className={`w-4 h-4 bg-blue-600 rotate-45 border-blue-400 ${
          position === 'bottom' ? 'border-t-2 border-l-2' : 'border-b-2 border-r-2'
        }`} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TutorialTooltip;
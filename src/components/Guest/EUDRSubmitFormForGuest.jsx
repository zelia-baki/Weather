import React, { useState, useRef, useEffect } from "react";
import { useUserInfo } from "./hooks/useUserInfo";
import { useFileUpload } from "./hooks/useFileUpload";
import { useReports } from "./hooks/useReports";
import { useTutorial } from "./hooks/useTutorial";
import { tutorialSteps } from "./config/tutorialSteps";
import StepLocation from "./steps/StepLocation";
import StepReportType from "./steps/StepReportType";
import StepUserInfo from "./steps/StepUserInfo";
import StepPayment from "./steps/StepPayment";
import StepReports from "./steps/StepReports";
import { SendPaymentModal } from "../Payment/SendPaymentModal";
import TutorialTooltip from "./components/TutorialTooltip";
import TutorialInvitation from "./components/TutorialInvitation";
import TutorialFloatingButton from "./components/TutorialFloatingButton";

const EUDRSubmitFormForGuest = () => {
  const [step, setStep] = useState(1);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [tutorialError, setTutorialError] = useState(null);

  const reportRefs = { eudr: useRef(), carbon: useRef() };

  const { files, handleFileChange } = useFileUpload();

  const {
    userInfo,
    setUserInfo,
    handleUserInfoSubmit,
    loading: userLoading,
    isUserInfoValid
  } = useUserInfo(setStep);

  const {
    reports,
    loading,
    showPaymentModal,
    handleReportReady,
    setShowPaymentModal,
  } = useReports({ files, geojson, userInfo, setStep, reportRefs });

  const {
    isActive: isTutorialActive,
    currentStep: tutorialStep,
    showTutorial,
    startTutorial,
    nextStep: nextTutorialStep,
    prevStep: prevTutorialStep,
    skipTutorial,
  } = useTutorial();

  const currentTutorial = tutorialSteps[tutorialStep];
  const isFirstTutorialStep = tutorialStep === 0;
  const isLastTutorialStep = tutorialStep === tutorialSteps.length - 1;

  // Validation: Can proceed to step 2 only if geojson exists
  const canProceedToStep2 = files.geojson || geojson;

  // NEW: Reset tutorialError when validation conditions are met
  useEffect(() => {
    if (tutorialError) {
      if (
        (currentTutorial?.highlight === 'report-type' && canProceedToStep2) ||
        (currentTutorial?.highlight === 'user-info' && selectedFeature) ||
        (currentTutorial?.highlight === 'payment' && isUserInfoValid())
      ) {
        setTutorialError(null);
      }
    }
  }, [canProceedToStep2, selectedFeature, isUserInfoValid, currentTutorial, tutorialError]);

  // Synchronize tutorial step with interface step
  useEffect(() => {
    if (isTutorialActive && currentTutorial && currentTutorial.targetStep !== step) {
      const targetTutorialIndex = tutorialSteps.findIndex(
        (t) => t.targetStep === step && t.highlight !== 'welcome'
      );
      if (targetTutorialIndex !== -1 && targetTutorialIndex !== tutorialStep) {
        for (let i = tutorialStep; i < targetTutorialIndex; i++) {
          nextTutorialStep();
        }
      }
    }
  }, [step, isTutorialActive, currentTutorial, nextTutorialStep, tutorialStep]);

  // Auto-advance tutorial when user completes step 1
  useEffect(() => {
    if (isTutorialActive && step === 1 && canProceedToStep2 && currentTutorial?.targetStep === 1) {
      const currentHighlight = currentTutorial?.highlight;
      if (['mode-toggle', 'search-bar', 'point-mode-info', 'draw-controls'].includes(currentHighlight)) {
        // If polygon is complete, stay on current step until user clicks "Next" in tutorial
      }
    }
  }, [geojson, files.geojson, isTutorialActive, step, currentTutorial]);

  const handleTutorialNext = () => {
    const nextTutorial = tutorialSteps[tutorialStep + 1];

    // Check validations before advancing
    if (nextTutorial) {
      if (nextTutorial.highlight === 'report-type' && !canProceedToStep2) {
        setTutorialError("⚠️ Please upload a GeoJSON file or create a polygon on the map to continue.");
        return;
      }
      if (nextTutorial.highlight === 'user-info' && !selectedFeature) {
        setTutorialError("⚠️ Please select a report type to continue.");
        return;
      }
      if (nextTutorial.highlight === 'payment' && !isUserInfoValid()) {
        setTutorialError("⚠️ Please fill in all required fields with valid information (phone, email) to continue.");
        return;
      }
    }

    setTutorialError(null); // Reset error

    if (isLastTutorialStep) {
      skipTutorial();
    } else {
      nextTutorialStep();
      if (nextTutorial && nextTutorial.targetStep !== currentTutorial?.targetStep) {
        setStep(nextTutorial.targetStep);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStepLocationNext = () => {
    if (canProceedToStep2) {
      setStep(2);
      if (isTutorialActive && currentTutorial?.targetStep === 1) {
        const targetTutorialIndex = tutorialSteps.findIndex(
          (t) => t.highlight === 'report-type'
        );
        if (targetTutorialIndex > tutorialStep) {
          for (let i = tutorialStep; i < targetTutorialIndex; i++) {
            nextTutorialStep();
          }
        }
      }
    }
  };

  const getHighlightClass = (highlightType) => {
    if (!isTutorialActive || !currentTutorial) return "";
    return currentTutorial.highlight === highlightType ? "tutorial-highlight-active" : "";
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Tutorial Invitation */}
      {!isTutorialActive && showTutorial && (
        <TutorialInvitation onStart={startTutorial} onDismiss={skipTutorial} />
      )}

      {(loading || userLoading) && (
        <div className="text-center text-blue-600">⏳ Processing...</div>
      )}

      {/* STEP 1: Location */}
      {step === 1 && (
        <div className="relative">
          <StepLocation
            files={files}
            onFileChange={handleFileChange}
            geojson={geojson}
            setGeojson={setGeojson}
            onNext={handleStepLocationNext}
            canContinue={canProceedToStep2}
            highlightUpload={getHighlightClass('upload')}
            highlightMap={getHighlightClass('map')}
            highlightModeToggle={getHighlightClass('mode-toggle')}
            highlightSearchBar={getHighlightClass('search-bar')}
            highlightPointModeInfo={getHighlightClass('point-mode-info')}
            highlightDrawControls={getHighlightClass('draw-controls')}
          />

          {/* Validation warning */}
          {!canProceedToStep2 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Please upload a GeoJSON file or create a polygon on the map to continue.
              </p>
            </div>
          )}

          {/* Tutorial error message */}
          {tutorialError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{tutorialError}</p>
            </div>
          )}

          {/* Tooltip for welcome */}
          {isTutorialActive && currentTutorial?.highlight === 'welcome' && (
            <TutorialTooltip
              step={currentTutorial}
              onNext={handleTutorialNext}
              onPrev={prevTutorialStep}
              onSkip={skipTutorial}
              isFirst={isFirstTutorialStep}
              isLast={isLastTutorialStep}
              totalSteps={tutorialSteps.length}
              currentIndex={tutorialStep}
            />
          )}

          {/* Tooltip for upload */}
          {isTutorialActive && currentTutorial?.highlight === 'upload' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full z-[10000]" style={{ marginTop: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}

          {/* Tooltip for mode toggle */}
          {isTutorialActive && currentTutorial?.highlight === 'mode-toggle' && (
            <div className="relative">
              <div className="absolute top-0 right-0 w-80 pointer-events-none z-[10000]" style={{ marginTop: '80px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}

          {/* Tooltip for search bar */}
          {isTutorialActive && currentTutorial?.highlight === 'search-bar' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: '80px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}

          {/* Tooltip for point mode info */}
          {isTutorialActive && currentTutorial?.highlight === 'point-mode-info' && (
            <div className="relative">
              <div className="absolute top-0 right-0 w-80 pointer-events-none z-[10000]" style={{ marginTop: '220px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}

          {/* Tooltip for draw controls */}
          {isTutorialActive && currentTutorial?.highlight === 'draw-controls' && (
            <div className="relative">
              <div className="absolute top-0 left-0 pointer-events-none z-[10000]" style={{ marginTop: '80px', marginLeft: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Report Type */}
      {step === 2 && (
        <div className="relative">
          <StepReportType
            onSelect={(feature) => {
              setSelectedFeature(feature);
              setStep(3);
              if (isTutorialActive && currentTutorial?.highlight === 'report-type') {
                nextTutorialStep();
              }
            }}
            highlightReportType={getHighlightClass('report-type')}
          />

          {/* Tutorial error message */}
          {tutorialError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{tutorialError}</p>
            </div>
          )}

          {isTutorialActive && currentTutorial?.highlight === 'report-type' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: User Info */}
      {step === 3 && (
        <div className="relative">
          <StepUserInfo
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            onSubmit={(e) => {
              e.preventDefault();
              if (isUserInfoValid()) {
                handleUserInfoSubmit(e);
                if (isTutorialActive && currentTutorial?.highlight === 'user-info') {
                  nextTutorialStep();
                }
              }
            }}
            loading={userLoading}
            isValid={isUserInfoValid()}
            highlightUserInfo={getHighlightClass('user-info')}
          />

          {/* Validation warning */}
          {!isUserInfoValid() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Please fill in all required fields with valid information (phone, email).
              </p>
            </div>
          )}

          {/* Tutorial error message */}
          {tutorialError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{tutorialError}</p>
            </div>
          )}

          {isTutorialActive && currentTutorial?.highlight === 'user-info' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Payment */}
      {step === 4 && (
        <div className="relative">
          <StepPayment
            selectedFeature={selectedFeature}
            phone={userInfo.phone}
            setShowPaymentModal={setShowPaymentModal}
            loading={loading}
            highlightPayment={getHighlightClass('payment')}
          />

          {isTutorialActive && currentTutorial?.highlight === 'payment' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: Reports */}
      {step === 5 && (
        <div className="relative">
          <StepReports
            reports={reports}
            reportRefs={reportRefs}
            highlightReports={getHighlightClass('reports')}
          />

          {isTutorialActive && currentTutorial?.highlight === 'reports' && (
            <div className="relative">
              <div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: '20px' }}>
                <TutorialTooltip
                  step={currentTutorial}
                  onNext={handleTutorialNext}
                  onPrev={prevTutorialStep}
                  onSkip={skipTutorial}
                  isFirst={isFirstTutorialStep}
                  isLast={isLastTutorialStep}
                  totalSteps={tutorialSteps.length}
                  currentIndex={tutorialStep}
                  position="bottom"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      {step > 1 && (
        <div className="flex justify-start">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Floating Tutorial Button */}
      {!isTutorialActive && !showTutorial && (
        <TutorialFloatingButton onClick={startTutorial} />
      )}

      {/* Modals */}
      {showPaymentModal.eudr && (
        <SendPaymentModal
          isOpen={showPaymentModal.eudr}
          onClose={() =>
            setShowPaymentModal((prev) => ({ ...prev, eudr: false }))
          }
          featureName="reporteudrguest"
          phone={userInfo.phone}
          agent_id={userInfo.agent_id}
          onPaymentSuccess={() => {
            handleReportReady("reporteudrguest");
            setShowPaymentModal((prev) => ({ ...prev, eudr: false }));
          }}
        />
      )}

      {showPaymentModal.carbon && (
        <SendPaymentModal
          isOpen={showPaymentModal.carbon}
          onClose={() =>
            setShowPaymentModal((prev) => ({ ...prev, carbon: false }))
          }
          featureName="reportcarbonguest"
          phone={userInfo.phone}
          agent_id={userInfo.agent_id}
          onPaymentSuccess={() => {
            handleReportReady("reportcarbonguest");
            setShowPaymentModal((prev) => ({ ...prev, carbon: false }));
          }}
        />
      )}

      {/* Styles CSS pour le highlight */}
      <style>{`
        .tutorial-highlight-active {
          position: relative;
          z-index: 9999;
        }
        
        .tutorial-highlight-active::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 4px solid rgb(59, 130, 246);
          border-radius: 8px;
          pointer-events: none;
          animation: tutorialPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          z-index: 9998;
        }
        
        @keyframes tutorialPulse {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default EUDRSubmitFormForGuest;
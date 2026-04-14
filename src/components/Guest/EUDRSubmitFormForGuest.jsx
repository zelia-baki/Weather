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

// ── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Location",  icon: "🛰️" },
  { id: 2, label: "Report",    icon: "📊" },
  { id: 3, label: "Info",      icon: "👤" },
  { id: 4, label: "Payment",   icon: "💳" },
  { id: 5, label: "Results",   icon: "✅" },
];

// ── Progress bar (hidden on step 1 so map is full-screen) ────────────────────
const StepProgressBar = ({ current, onBack }) => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

      .spb-root {
        background: linear-gradient(100deg, #081c09 0%, #0e2810 60%, #081c09 100%);
        border-bottom: 1px solid rgba(74,222,128,0.1);
        box-shadow: 0 4px 24px rgba(0,0,0,0.35);
        font-family: 'DM Sans', sans-serif;
      }

      .spb-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: relative;
        flex: 1;
      }

      .spb-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 15px;
        border: 1.5px solid;
        transition: all 0.3s;
        position: relative;
        z-index: 2;
      }
      .spb-icon.done {
        background: rgba(74,222,128,0.12);
        border-color: rgba(74,222,128,0.4);
        box-shadow: 0 0 12px rgba(74,222,128,0.15);
      }
      .spb-icon.active {
        background: linear-gradient(135deg,#22c55e,#16a34a);
        border-color: #22c55e;
        box-shadow: 0 0 16px rgba(34,197,94,0.4);
      }
      .spb-icon.pending {
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.1);
      }

      .spb-label {
        font-size: 10px;
        letter-spacing: 0.05em;
        font-weight: 600;
        text-transform: uppercase;
        transition: color 0.3s;
      }
      .spb-label.done   { color: rgba(74,222,128,0.7); }
      .spb-label.active { color: #4ade80; }
      .spb-label.pending { color: rgba(255,255,255,0.25); }

      .spb-connector {
        flex: 1;
        height: 1px;
        margin-bottom: 18px;
        transition: background 0.3s;
      }
      .spb-connector.done    { background: rgba(74,222,128,0.35); }
      .spb-connector.pending { background: rgba(255,255,255,0.07); }

      .spb-back {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.55);
        font-size: 12px;
        font-family: 'DM Sans', sans-serif;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .spb-back:hover {
        background: rgba(255,255,255,0.09);
        color: rgba(255,255,255,0.8);
      }

      .spb-title {
        font-family: 'Syne', sans-serif;
        font-size: 11px;
        font-weight: 700;
        color: rgba(74,222,128,0.5);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        flex-shrink: 0;
      }
    `}</style>
    <div className="spb-root">
      <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
        {/* Back */}
        {current > 1 && (
          <button className="spb-back" onClick={onBack}>
            ← Back
          </button>
        )}

        <div className="spb-title hidden sm:block">EUDR</div>

        {/* Steps */}
        <div className="flex items-center flex-1 min-w-0">
          {STEPS.map((s, i) => {
            const state = s.id < current ? "done" : s.id === current ? "active" : "pending";
            return (
              <React.Fragment key={s.id}>
                <div className="spb-step">
                  <div className={`spb-icon ${state}`}>
                    {s.id < current ? "✓" : s.icon}
                  </div>
                  <span className={`spb-label ${state} hidden sm:block`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`spb-connector ${s.id < current ? "done" : "pending"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
const EUDRSubmitFormForGuest = () => {
  const [step, setStep] = useState(1);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [geojson, setGeojson] = useState(null);
  const [tutorialError, setTutorialError] = useState(null);

  const reportRefs = { eudr: useRef(), carbon: useRef() };
  const { files, handleFileChange } = useFileUpload();
  const { userInfo, setUserInfo, handleUserInfoSubmit, loading: userLoading, isUserInfoValid } = useUserInfo(setStep);
  const { reports, loading, showPaymentModal, handleReportReady, setShowPaymentModal } = useReports({ files, geojson, userInfo, setStep, reportRefs });
  const { isActive: isTutorialActive, currentStep: tutorialStep, showTutorial, startTutorial, nextStep: nextTutorialStep, prevStep: prevTutorialStep, skipTutorial } = useTutorial();

  const currentTutorial = tutorialSteps[tutorialStep];
  const isFirstTutorialStep = tutorialStep === 0;
  const isLastTutorialStep = tutorialStep === tutorialSteps.length - 1;
  const canProceedToStep2 = files.geojson || geojson;

  useEffect(() => {
    if (tutorialError) {
      if (
        (currentTutorial?.highlight === "report-type" && canProceedToStep2) ||
        (currentTutorial?.highlight === "user-info" && selectedFeature) ||
        (currentTutorial?.highlight === "payment" && isUserInfoValid())
      ) setTutorialError(null);
    }
  }, [canProceedToStep2, selectedFeature, isUserInfoValid, currentTutorial, tutorialError]);

  useEffect(() => {
    if (isTutorialActive && currentTutorial && currentTutorial.targetStep !== step) {
      const idx = tutorialSteps.findIndex((t) => t.targetStep === step && t.highlight !== "welcome");
      if (idx !== -1 && idx !== tutorialStep) {
        for (let i = tutorialStep; i < idx; i++) nextTutorialStep();
      }
    }
  }, [step, isTutorialActive, currentTutorial, nextTutorialStep, tutorialStep]);

  const handleTutorialNext = () => {
    const next = tutorialSteps[tutorialStep + 1];
    if (next) {
      if (next.highlight === "report-type" && !canProceedToStep2) {
        setTutorialError("⚠️ Please upload a GeoJSON file or create a polygon on the map to continue."); return;
      }
      if (next.highlight === "user-info" && !selectedFeature) {
        setTutorialError("⚠️ Please select a report type to continue."); return;
      }
      if (next.highlight === "payment" && !isUserInfoValid()) {
        setTutorialError("⚠️ Please fill in all required fields (phone, email) to continue."); return;
      }
    }
    setTutorialError(null);
    if (isLastTutorialStep) {
      skipTutorial();
    } else {
      nextTutorialStep();
      if (next && next.targetStep !== currentTutorial?.targetStep) setStep(next.targetStep);
    }
  };

  const handleStepLocationNext = () => {
    if (canProceedToStep2) {
      setStep(2);
      if (isTutorialActive && currentTutorial?.targetStep === 1) {
        const idx = tutorialSteps.findIndex((t) => t.highlight === "report-type");
        if (idx > tutorialStep) for (let i = tutorialStep; i < idx; i++) nextTutorialStep();
      }
    }
  };

  const getHighlightClass = (type) =>
    isTutorialActive && currentTutorial?.highlight === type ? "tutorial-highlight-active" : "";

  const sharedTip = {
    onNext: handleTutorialNext,
    onPrev: prevTutorialStep,
    onSkip: skipTutorial,
    isFirst: isFirstTutorialStep,
    isLast: isLastTutorialStep,
    totalSteps: tutorialSteps.length,
    currentIndex: tutorialStep,
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#f8faf8' }}>

      {/* Tutorial invitation */}
      {!isTutorialActive && showTutorial && (
        <div className="max-w-3xl mx-auto px-6 pt-6">
          <TutorialInvitation onStart={startTutorial} onDismiss={skipTutorial} />
        </div>
      )}

      {(loading || userLoading) && (
        <div className="max-w-3xl mx-auto px-6 pt-4 text-center" style={{ color: '#16a34a', fontFamily: "'DM Sans',sans-serif", fontSize: 14 }}>
          ⏳ Processing your request…
        </div>
      )}

      {/* ── STEP 1: full-width map ── */}
      {step === 1 && (
        <div className="relative w-full">
          <StepLocation
            files={files}
            onFileChange={handleFileChange}
            geojson={geojson}
            setGeojson={setGeojson}
            onNext={handleStepLocationNext}
            canContinue={canProceedToStep2}
            highlightUpload={getHighlightClass("upload")}
            highlightMap={getHighlightClass("map")}
            highlightModeToggle={getHighlightClass("mode-toggle")}
            highlightSearchBar={getHighlightClass("search-bar")}
            highlightPointModeInfo={getHighlightClass("point-mode-info")}
            highlightDrawControls={getHighlightClass("draw-controls")}
          />

          {!canProceedToStep2 && (
            <div className="px-4 py-3">
              <div className="max-w-3xl mx-auto">
                <div style={{
                  background: 'rgba(234,179,8,0.07)',
                  border: '1px solid rgba(234,179,8,0.25)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}>
                  <span>⚠️</span>
                  Upload a GeoJSON file or draw a polygon on the map above to continue.
                </div>
              </div>
            </div>
          )}

          {tutorialError && (
            <div className="px-4 py-2">
              <div className="max-w-3xl mx-auto p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800" style={{ fontFamily: "'DM Sans',sans-serif" }}>
                {tutorialError}
              </div>
            </div>
          )}

          {/* Tutorial tooltips */}
          {isTutorialActive && currentTutorial?.highlight === "welcome" && <TutorialTooltip step={currentTutorial} {...sharedTip} />}
          {isTutorialActive && currentTutorial?.highlight === "upload" && (
            <div className="relative"><div className="absolute top-0 left-0 w-full z-[10000]" style={{ marginTop: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
          )}
          {isTutorialActive && currentTutorial?.highlight === "mode-toggle" && (
            <div className="relative"><div className="absolute top-0 right-0 w-80 pointer-events-none z-[10000]" style={{ marginTop: 80 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
          )}
          {isTutorialActive && currentTutorial?.highlight === "search-bar" && (
            <div className="relative"><div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: 80 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
          )}
          {isTutorialActive && currentTutorial?.highlight === "point-mode-info" && (
            <div className="relative"><div className="absolute top-0 right-0 w-80 pointer-events-none z-[10000]" style={{ marginTop: 220 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
          )}
          {isTutorialActive && currentTutorial?.highlight === "draw-controls" && (
            <div className="relative"><div className="absolute top-0 left-0 pointer-events-none z-[10000]" style={{ marginTop: 80, marginLeft: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
          )}
        </div>
      )}

      {/* ── STEPS 2–5: progress bar + constrained content ── */}
      {step > 1 && (
        <>
          <StepProgressBar current={step} onBack={() => setStep(step - 1)} />

          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

            {/* STEP 2 */}
            {step === 2 && (
              <div className="relative">
                <StepReportType
                  onSelect={(feature) => {
                    setSelectedFeature(feature);
                    setStep(3);
                    if (isTutorialActive && currentTutorial?.highlight === "report-type") nextTutorialStep();
                  }}
                  highlightReportType={getHighlightClass("report-type")}
                />
                {tutorialError && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{tutorialError}</div>}
                {isTutorialActive && currentTutorial?.highlight === "report-type" && (
                  <div className="relative"><div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
                )}
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="relative">
                <StepUserInfo
                  userInfo={userInfo}
                  setUserInfo={setUserInfo}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isUserInfoValid()) {
                      handleUserInfoSubmit(e);
                      if (isTutorialActive && currentTutorial?.highlight === "user-info") nextTutorialStep();
                    }
                  }}
                  loading={userLoading}
                  isValid={isUserInfoValid()}
                  highlightUserInfo={getHighlightClass("user-info")}
                />
                {!isUserInfoValid() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    ⚠️ Please fill in all required fields with valid information (phone, email).
                  </div>
                )}
                {tutorialError && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{tutorialError}</div>}
                {isTutorialActive && currentTutorial?.highlight === "user-info" && (
                  <div className="relative"><div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
                )}
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="relative">
                <StepPayment
                  selectedFeature={selectedFeature}
                  phone={userInfo.phone}
                  setShowPaymentModal={setShowPaymentModal}
                  loading={loading}
                  highlightPayment={getHighlightClass("payment")}
                />
                {isTutorialActive && currentTutorial?.highlight === "payment" && (
                  <div className="relative"><div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
                )}
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="relative">
                <StepReports
                  reports={reports}
                  reportRefs={reportRefs}
                  highlightReports={getHighlightClass("reports")}
                />
                {isTutorialActive && currentTutorial?.highlight === "reports" && (
                  <div className="relative"><div className="absolute top-0 left-0 w-full pointer-events-none z-[10000]" style={{ marginTop: 20 }}><TutorialTooltip step={currentTutorial} {...sharedTip} position="bottom" /></div></div>
                )}
              </div>
            )}

          </div>
        </>
      )}

      {/* Floating Tutorial */}
      {!isTutorialActive && !showTutorial && <TutorialFloatingButton onClick={startTutorial} />}

      {/* Payment modals */}
      {showPaymentModal.eudr && (
        <SendPaymentModal
          isOpen={showPaymentModal.eudr}
          onClose={() => setShowPaymentModal((p) => ({ ...p, eudr: false }))}
          featureName="reporteudrguest"
          phone={userInfo.phone}
          agent_id={userInfo.agent_id}
          onPaymentSuccess={() => { handleReportReady("reporteudrguest"); setShowPaymentModal((p) => ({ ...p, eudr: false })); }}
        />
      )}
      {showPaymentModal.carbon && (
        <SendPaymentModal
          isOpen={showPaymentModal.carbon}
          onClose={() => setShowPaymentModal((p) => ({ ...p, carbon: false }))}
          featureName="reportcarbonguest"
          phone={userInfo.phone}
          agent_id={userInfo.agent_id}
          onPaymentSuccess={() => { handleReportReady("reportcarbonguest"); setShowPaymentModal((p) => ({ ...p, carbon: false })); }}
        />
      )}

      {/* Tutorial highlight styles */}
      <style>{`
        .tutorial-highlight-active { position: relative; z-index: 9999; }
        .tutorial-highlight-active::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 3px solid rgb(59,130,246);
          border-radius: 8px;
          pointer-events: none;
          animation: tPulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
          z-index: 9998;
        }
        @keyframes tPulse {
          0%,100% { opacity:1; box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
          50%      { opacity:0.7; box-shadow: 0 0 0 10px rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
};

export default EUDRSubmitFormForGuest;
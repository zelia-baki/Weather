import React, { useState, useRef } from "react";
import { useUserInfo } from "./hooks/useUserInfo";
import { useFileUpload } from "./hooks/useFileUpload";
import { useReports } from "./hooks/useReports";
import StepLocation from "./steps/StepLocation";
import StepReportType from "./steps/StepReportType";
import StepUserInfo from "./steps/StepUserInfo";
import StepPayment from "./steps/StepPayment";
import StepReports from "./steps/StepReports";
import { SendPaymentModal } from "../Payment/SendPaymentModal";

const EUDRSubmitFormForGuest = () => {
  const [step, setStep] = useState(1);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [geojson, setGeojson] = useState(null);

  const reportRefs = { eudr: useRef(), carbon: useRef() };

  const { files, handleFileChange } = useFileUpload();

  const {
    userInfo,
    setUserInfo,
    handleUserInfoSubmit,
    loading: userLoading
  } = useUserInfo(setStep);

  const {
    reports,
    loading,
    showPaymentModal,
    handleReportReady,
    setShowPaymentModal,
  } = useReports({ files, userInfo, setStep, reportRefs });

  // 🔙 Revenir au step précédent
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {(loading || userLoading) && (
        <div className="text-center text-blue-600">⏳ Processing...</div>
      )}

      {step === 1 && (
        <StepLocation
          files={files}
          onFileChange={handleFileChange}
          geojson={geojson}
          setGeojson={setGeojson}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <StepReportType
          onSelect={(feature) => {
            setSelectedFeature(feature);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <StepUserInfo
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onSubmit={handleUserInfoSubmit}
          loading={userLoading}
        />
      )}

      {step === 4 && (
        <StepPayment
          selectedFeature={selectedFeature}
          phone={userInfo.phone}
          setShowPaymentModal={setShowPaymentModal}
          loading={loading}
        />
      )}

      {step === 5 && (
        <StepReports reports={reports} reportRefs={reportRefs} />
      )}

      {/* 🔙 Bouton Back affiché si step > 1 */}
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

      {/* Modals */}
      {showPaymentModal.eudr && (
        <SendPaymentModal
          isOpen={showPaymentModal.eudr}
          onClose={() =>
            setShowPaymentModal((prev) => ({ ...prev, eudr: false }))
          }
          featureName="reporteudrguest"
          phone={userInfo.phone}
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
          onPaymentSuccess={() => {
            handleReportReady("reportcarbonguest");
            setShowPaymentModal((prev) => ({ ...prev, carbon: false }));
          }}
        />
      )}
    </div>
  );
};

export default EUDRSubmitFormForGuest;

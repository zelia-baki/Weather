import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import UploadCard from './components/UploadCard';
import CarbonReportSection from './components/CarbonReportSection';
import EudrReportSection from './components/EudrReportSection';
import { SendPaymentModal } from '../Payment/SendPaymentModal';
import { generatePdfBlob } from './utils/pdfUtils';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const EUDRSubmitFormForGuest = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({ eudr: null, carbon: null });
  const [userInfo, setUserInfo] = useState({ phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [reports, setReports] = useState({ eudr: null, carbon: null });
  const [showPaymentModal, setShowPaymentModal] = useState({ eudr: false, carbon: false });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const reportRefs = { eudr: useRef(), carbon: useRef() };
  const [loadingCard, setLoadingCard] = useState({ eudr: false, carbon: false });
  const [rdata, setrdata] = useState({});

  const handleUploadClick = async (inputName) => {
    setLoadingCard(prev => ({ ...prev, [inputName]: true }));
    await new Promise(resolve => setTimeout(resolve, 2000)); // Minimum 2s loading
    setStep(2);
    setLoadingCard(prev => ({ ...prev, [inputName]: false }));
  };
  const handleFileChange = (inputName, e) => {
    const file = e.target.files[0];
    setFiles(prev => ({ ...prev, [inputName]: file }));
  };

  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    if (userInfo.phone && userInfo.email) {
      setLoading(true);
      await wait(2000);
      localStorage.setItem('guest_phone', userInfo.phone);
      localStorage.setItem('guest_email', userInfo.email);
      setStep(3);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("📦 Nouvelle valeur de reports :", reports);
  }, [reports]);

  const sendPdfByEmail = async (inputName, email) => {
    console.log(`📤 Début d'envoi d'email avec ${inputName.toUpperCase()} vers ${email}`);

    try {
      const ref = reportRefs[inputName];
      const pdfBlob = await generatePdfBlob(ref, inputName);
      console.log('📄 PDF généré', pdfBlob);

      const reader = new FileReader();
      reader.readAsArrayBuffer(pdfBlob);

      reader.onloadend = async () => {
        console.log('🧠 Conversion base64 en cours...');
        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        const binary = uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '');
        const base64data = btoa(binary);

        try {
          console.log("📡 Envoi vers /api/notifications/email");
          await axiosInstance.post('/api/notifications/email', {
            to_email: email,
            report_type: inputName.toUpperCase(),
            pdf_base64: base64data
          });
          console.log('✅ Email envoyé via backend');
        } catch (error) {
          console.error('❌ Erreur lors de l’envoi vers le backend :', error);
        }
      };

      reader.onerror = (err) => {
        console.error('❌ Erreur FileReader :', err);
      };

    } catch (err) {
      console.error('❌ Erreur dans sendPdfByEmail :', err);
    }
  };


  const handleReportReady = async (featureName) => {
    const key = featureName === 'reporteudrguest' ? 'eudr' : 'carbon';
    const file = files[key];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    await wait(2000);
    try {
      const res = await axiosInstance.post(
        `/api/gfw/Geojson/${featureName === 'reportcarbonguest' ? 'CarbonReportFromFile' : 'ReportFromFile'}`,
        formData,
        {
          headers: {
            'X-Guest-ID': localStorage.getItem('guest_id'),
            'X-Guest-Phone': userInfo.phone
          }
        }
      );
      let rdata = res.data.report;
      console.log("✅ rdata complet :", rdata["landmark indigenous and community lands"]?.[0]?.data_fields);
      setReports(prev => ({ ...prev, [key]: res.data.report }));
      const reportData = res.data.report;

      console.log("reportData", reportData['tree cover loss']?.[0]?.data_fields?.area__ha);
      let message = '';

      if (key === 'carbon') {
        // Récupère la valeur du flux net de carbone
        const carbonValue = reportData?.["forest carbon net flux"]?.[0]?.data_fields?.gfw_forest_carbon_net_flux__Mg_CO2e;

        let value = "X";
        let interpretation = "Carbon data not available";

        if (typeof carbonValue === 'number') {
          value = (Math.abs(carbonValue) / 22).toFixed(2);

          if (carbonValue > 0) {
            interpretation = `Your plot of land is a net carbon emitter estimated to about ${value} MT CO2e per year.`;
          } else if (carbonValue < 0) {
            interpretation = `Your plot of land is a net carbon sink estimated to about ${value} MT CO2e per year.`;
          } else {
            interpretation = `Your plot of land has a neutral carbon balance (0 MT CO₂e) per year.`;
          }
        }

        message = `${interpretation} For more details, contact us on WhatsApp +256783130358 or lwetutb@agriyields.com, nkusu@agriyields.com.`;

      } else if (key === 'eudr') {
        const areaHa = rdata['tree cover loss']?.data_fields?.area__ha;

        let valueElement;
        if (areaHa !== undefined && areaHa !== null) {
          valueElement = parseFloat(areaHa) !== 0 ? (
            <p>Not Compliant</p>
          ) : (
            <p>100% Compliance</p>
          );
        } else {
          valueElement = <p>Data Not Available</p>;
        }

        message = `The result shows that your plot of land is ${typeof areaHa === 'number' && areaHa !== 0
            ? 'Not Compliant'
            : areaHa === 0
              ? '100% Compliant'
              : 'Data Not Available'
          }. For more details, contact us on WhatsApp +256783130358 or lwetutb@agriyields.com nkusu@agriyields.com`;

        value = valueElement;
      }


      setStep(4);
      await sendPdfByEmail(key, userInfo.email);
      await axiosInstance.post('/api/notifications/sms', {
        phone: userInfo.phone,
        message: `✅ ${message} ${userInfo.email}.`
      });
    } catch (err) {
      setErrors(prev => ({ ...prev, [featureName]: 'Error generating report.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {loading && <div className="text-center text-blue-600 font-semibold fade-in">⏳ Processing...</div>}

      {step === 1 && (
        <div className="fade-in space-y-4">
          <UploadCard
            inputName="eudr"
            title="Upload farm location details to find out your plot level deforestation risk and EUDR compliance"
            onFileChange={handleFileChange}
            onUpload={handleUploadClick}
            loading={loadingCard.eudr}
          />
          <UploadCard
            inputName="carbon"
            title="The primary goal of the UNFCCC & Paris Agreement is to keep global average temperature rise well below 2degC, as close as possible to 1.5degC above pre-Industrial levels by reducing greenhouse gas emissions.  This call starts with you .. Find out whether your plot of land is a net carbon sink or emitter and take remedial actions..."
            onFileChange={handleFileChange}
            onUpload={handleUploadClick}
            loading={loadingCard.carbon}
          />
        </div>
      )}


      {step === 2 && (
        <form onSubmit={handleUserInfoSubmit} className="bg-white p-6 rounded shadow fade-in transition-all duration-500">
          <h2 className="text-xl font-bold mb-4">Enter Your Contact Info</h2>
          <input
            type="text"
            value={userInfo.phone}
            onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
            placeholder="Phone number"
            className="block w-full mb-3 p-2 border rounded"
            required
          />
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
            placeholder="Email"
            className="block w-full mb-4 p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded transition duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              'Continue to Payment'
            )}
          </button>
        </form>
      )}


      {step === 3 && (
        <div className="text-center fade-in">
          <h2 className="text-xl font-semibold mb-4">Click to pay and unlock your reports</h2>
          {files.eudr && <button disabled={loading} onClick={() => { setSelectedFeature('reporteudrguest'); setShowPaymentModal({ eudr: true, carbon: false }); }} className={`bg-blue-600 text-white px-4 py-2 rounded m-2 ${loading ? 'button-loading' : 'hover:bg-blue-700'}`}>Pay for EUDR</button>}
          {files.carbon && <button disabled={loading} onClick={() => { setSelectedFeature('reportcarbonguest'); setShowPaymentModal({ carbon: true, eudr: false }); }} className={`bg-blue-600 text-white px-4 py-2 rounded m-2 ${loading ? 'button-loading' : 'hover:bg-blue-700'}`}>Pay for Carbon</button>}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center fade-in">
          {reports.eudr && (
            <>
              <EudrReportSection results={reports.eudr} reportRef={reportRefs.eudr} />
              <button onClick={async () => {
                const blob = await generatePdfBlob(reportRefs.eudr, 'eudr');
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'EUDR_Report.pdf';
                  link.click();
                }
              }} className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300">Download the EUDR PDF</button>
            </>
          )}

          {reports.carbon && (
            <>
              <CarbonReportSection results={reports.carbon} reportRef={reportRefs.carbon} />
              <button onClick={async () => {
                const blob = await generatePdfBlob(reportRefs.carbon, 'carbon');
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'Carbon_Report.pdf';
                  link.click();
                }
              }} className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300">Download the Carbon PDF</button>
            </>
          )}
        </div>
      )}

      {showPaymentModal.eudr && (
        <SendPaymentModal
          isOpen={showPaymentModal.eudr}
          onClose={() => setShowPaymentModal({ ...showPaymentModal, eudr: false })}
          featureName="reporteudrguest"
          phone={userInfo.phone}
          onPaymentSuccess={() => handleReportReady('reporteudrguest')}
        />
      )}

      {showPaymentModal.carbon && (
        <SendPaymentModal
          isOpen={showPaymentModal.carbon}
          onClose={() => setShowPaymentModal({ ...showPaymentModal, carbon: false })}
          featureName="reportcarbonguest"
          phone={userInfo.phone}
          onPaymentSuccess={() => handleReportReady('reportcarbonguest')}
        />
      )}
    </div>
  );
};

export default EUDRSubmitFormForGuest;

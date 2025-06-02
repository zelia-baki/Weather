import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../axiosInstance';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import UploadCard from './components/UploadCard';
import CarbonReportSection from './components/CarbonReportSection';
import EudrReportSection from './components/EudrReportSection';

const CarbonReportUploader = () => {
  const [userInfo, setUserInfo] = useState({ phone: '', email: '' });
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState({ eudr: null, carbon: null });
  const [loading, setLoading] = useState({ eudr: false, carbon: false });
  const [results, setResults] = useState({ eudr: {}, carbon: {} });
  const [error, setError] = useState({ eudr: '', carbon: '' });

  const reportRefs = {
    eudr: useRef(),
    carbon: useRef(),
  };

  useEffect(() => {
    let guestId = localStorage.getItem("guest_id");
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("guest_id", guestId);
    }
  }, []);

  const generatePdf = async (inputName) => {
    const element = reportRefs[inputName].current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${inputName.toUpperCase()}_Report.pdf`);
  };

  const handleFileChange = (inputName, e) => {
    setFiles((prev) => ({ ...prev, [inputName]: e.target.files[0] }));
    setResults((prev) => ({ ...prev, [inputName]: {} }));
    setError((prev) => ({ ...prev, [inputName]: '' }));
  };

  const handleUpload = async (inputName) => {
    const file = files[inputName];
    if (!file) {
      setError((prev) => ({ ...prev, [inputName]: 'Please select a GeoJSON file.' }));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    const guestId = localStorage.getItem("guest_id");

    const urlMap = {
      eudr: '/api/gfw/Geojson/ReportFromFile',
      carbon: '/api/gfw/Geojson/CarbonReportFromFile',
    };

    setLoading((prev) => ({ ...prev, [inputName]: true }));
    setError((prev) => ({ ...prev, [inputName]: '' }));

    try {
      const response = await axiosInstance.post(urlMap[inputName], formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Guest-ID': guestId,
        },
      });
      console.log("REPORT:", response.data.report);
      setResults((prev) => ({ ...prev, [inputName]: response.data.report || {} }));
    } catch (err) {
      setError((prev) => ({
        ...prev,
        [inputName]: err.response?.data?.error || 'An error has occurred.',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [inputName]: false }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (userInfo.phone && userInfo.email) {
      localStorage.setItem('guest_phone', userInfo.phone);
      localStorage.setItem('guest_email', userInfo.email);
      setSubmitted(true);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {!submitted ? (
        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold mb-4">Enter your details to continue</h2>
          <input type="text" placeholder="Your Phone number" value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} className="block w-full p-2 border rounded mb-4" required />
          <input type="email" placeholder="Your Email" value={userInfo.email} onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })} className="block w-full p-2 border rounded mb-4" required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Continue</button>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6">
            <UploadCard
              inputName="eudr"
              title="Upload your geojson for your farm location details to find out your plot level deforestation risk and EUDR compliance"
              onFileChange={handleFileChange}
              onUpload={handleUpload}
              loading={loading.eudr}
            />
            <UploadCard
              inputName="carbon"
              title="Upload your geojson to determine if your land is a net carbon sink (Carbon Report)"
              onFileChange={handleFileChange}
              onUpload={handleUpload}
              loading={loading.carbon}
            />
          </div>

          {['eudr', 'carbon'].map((key) => (
            <div key={key} className="flex justify-center flex-col items-center text-xl mt-10">
              {error[key] && <p className="text-red-600">{error[key]}</p>}
              {results[key] && Object.keys(results[key]).length > 0 && (
                <>
                  {key === 'carbon' ? (
                    <CarbonReportSection results={results[key]} reportRef={reportRefs[key]} />
                  ) : (
                    <EudrReportSection results={results[key]} reportRef={reportRefs[key]} />
                  )}
                  <button
                    onClick={() => generatePdf(key)}
                    className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300"
                  >
                    Télécharger le PDF
                  </button>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CarbonReportUploader;

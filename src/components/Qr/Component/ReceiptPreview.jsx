import React from "react";

const ReceiptPreview = ({ qrData, onDownloadPDF, isDownloading }) => {
  if (!qrData) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded animate-pulse"></div>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Receipt Preview
        </h3>
        <p className="text-gray-400">
          Complete the form to generate your QR code and digital receipt
        </p>
      </div>
    );
  }

  return (
    <>
      <div id="receipt" className="bg-white p-6 rounded-lg shadow-lg border">
        {/* ... the rest of your preview code */}
        <div className="text-center mb-4">
          <img
            src="https://www.nkusu.com/parrotlogo.png"
            alt="Logo"
            className="w-16 h-16 mx-auto mb-2"
          />
          <h2 className="text-xl font-bold text-teal-700">NKUSU DIGITAL STAMPS</h2>
          <p className="text-gray-600">Digital receipt for produce transaction</p>
        </div>
        <div className="text-center mb-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
            alt="QR Code"
            className="mx-auto border rounded"
          />
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-40">
          {qrData}
        </pre>
      </div>

      <button
        onClick={onDownloadPDF}
        className={`w-full mt-4 text-white px-6 py-3 rounded-lg shadow transition-colors ${
          isDownloading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
        disabled={isDownloading} // Disable the button while downloading
      >
        {isDownloading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </span>
        ) : (
          "Download PDF"
        )}
      </button>
    </>
  );
};

export default ReceiptPreview;
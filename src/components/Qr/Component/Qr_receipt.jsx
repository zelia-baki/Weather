import React from "react";
import "./Receipt.css";

const Receipt = ({
  description,
  qrData,
  logo = "https://www.nkusu.com/parrotlogo.png", // ✅ logo par défaut
}) => {
  return (
    <article
      id="receipt"
      className="receipt"
      role="document"
      aria-label="Reçu avec QR code"
    >
      {/* Logo */}
      <img className="logo" src={logo} alt="Logo" />

      <h1 className="title">NKUSU DIGITAL STAMPS</h1>
      {description && <p className="desc">{description}</p>}

      {/* QR code */}
      {qrData && (
        <div className="qr-wrap">
          <div className="qr">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                qrData
              )}`}
              alt="QR code"
            />
          </div>
        </div>
      )}

      {/* Contenu formaté */}
      {qrData && (
        <pre className="rows">{qrData}</pre>
      )}
    </article>
  );
};

export default Receipt;

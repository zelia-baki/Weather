import React, { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const QRCodeRenderer = ({ qrCodes }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (qrCodes.length > 0 && containerRef.current) {
      containerRef.current.innerHTML = "";
      qrCodes.forEach((data) => {
        const qr = new QRCodeStyling({
          width: 300,
          height: 300,
          dotsOptions: { color: "#4267b2", type: "rounded" },
          imageOptions: { crossOrigin: "anonymous", margin: 20 },
          data,
        });
        const div = document.createElement("div");
        qr.append(div);
        containerRef.current.appendChild(div);
      });
    }
  }, [qrCodes]);

  return <div ref={containerRef} className="mt-12" />;
};

export default QRCodeRenderer;

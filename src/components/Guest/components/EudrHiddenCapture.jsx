import { useEffect, useRef } from "react";
import EudrReportSection from "./EudrReportSection";

const CAPTURE_TIMEOUT_MS = 10000;

const EudrHiddenCapture = ({ data, onCaptured }) => {
  const firedRef = useRef(false);

  const fire = (base64) => {
    if (firedRef.current) return;
    firedRef.current = true;
    onCaptured(base64);
  };

  useEffect(() => {
    // ✅ Filet de sécurité : si pas de points wri_tropical_tree_cover_extent,
    // StaticForestMap n'appelle jamais onImageCaptured → on continue sans heatmap.
    const timeout = setTimeout(() => fire(null), CAPTURE_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
      <EudrReportSection
        results={data}
        reportRef={{ current: null }}
        reportType="guest"
        onForestMapCaptured={fire}
      />
    </div>
  );
};

export default EudrHiddenCapture;
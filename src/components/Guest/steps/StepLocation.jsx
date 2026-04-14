import PolygonDrawer from "../../mapbox/PolygonDrawer";

const StepLocation = ({
  files,
  onFileChange,
  geojson,
  setGeojson,
  onNext,
  canContinue = false,
  highlightUpload = "",
  highlightMap = "",
  highlightModeToggle = "",
  highlightSearchBar = "",
  highlightPointModeInfo = "",
  highlightDrawControls = "",
}) => {
  const handlePolygonChange = (polygon) => {
    setGeojson(polygon);
    localStorage.setItem("polygon_geojson", JSON.stringify(polygon));
  };

  const hasFile = !!files?.geojson;
  const hasPolygon = !!geojson;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        .sl-root { font-family: 'DM Sans', sans-serif; }

        .sl-topbar {
          background: linear-gradient(100deg, #081c09 0%, #0e2810 60%, #081c09 100%);
          border-bottom: 1px solid rgba(74,222,128,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        }

        .sl-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: #f0fdf4;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sl-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.02em;
        }

        .sl-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.09);
          flex-shrink: 0;
        }

        .sl-file-label {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.05);
          border: 1.5px dashed rgba(74,222,128,0.3);
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          transition: all 0.22s ease;
          flex: 1;
          min-width: 0;
          max-width: 340px;
          font-family: 'DM Sans', sans-serif;
        }
        .sl-file-label:hover {
          background: rgba(74,222,128,0.07);
          border-color: rgba(74,222,128,0.55);
          color: #dcfce7;
        }
        .sl-file-label.has-file {
          border-style: solid;
          border-color: rgba(74,222,128,0.5);
          background: rgba(74,222,128,0.07);
          color: #86efac;
        }

        .sl-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sl-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: all 0.3s;
        }
        .sl-dot.on {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.2);
          animation: dot-pulse 2s ease-in-out infinite;
        }
        .sl-dot.off { background: rgba(255,255,255,0.18); }

        @keyframes dot-pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(74,222,128,0.2); }
          50%      { box-shadow: 0 0 0 7px rgba(74,222,128,0.04); }
        }

        .sl-next-btn {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 9px 22px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.22s ease;
          flex-shrink: 0;
        }
        .sl-next-btn.on {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          color: #fff;
          box-shadow: 0 4px 18px rgba(34,197,94,0.35), 0 0 0 1px rgba(34,197,94,0.2);
        }
        .sl-next-btn.on:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(34,197,94,0.5), 0 0 0 1px rgba(34,197,94,0.3);
        }
        .sl-next-btn.off {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.25);
          cursor: not-allowed;
          box-shadow: none;
        }

        #sl-file-input { display: none; }
      `}</style>

      <div className="sl-root flex flex-col w-full">

        {/* TOP BAR */}
        <div className={`sl-topbar ${highlightUpload}`}>
          <div className="max-w-7xl mx-auto px-5 py-3 flex flex-wrap sm:flex-nowrap items-center gap-3">

            {/* Icon + label */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div style={{
                width: 34, height: 34,
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>🛰️</div>
              <div>
                <div className="sl-title">Step 1 — Farm Location</div>
                <div className="sl-hint">Upload a file or draw directly on the map</div>
              </div>
            </div>

            <div className="sl-divider hidden sm:block" />

            {/* File picker */}
            <input
              id="sl-file-input"
              type="file"
              accept=".geojson,application/geo+json"
              name="geojson"
              onChange={(e) => onFileChange("geojson", e)}
            />
            <label htmlFor="sl-file-input" className={`sl-file-label ${hasFile ? "has-file" : ""}`}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="truncate">
                {hasFile ? `✓  ${files.geojson.name}` : "Choose .geojson file…"}
              </span>
            </label>

            {/* Status dots */}
            <div className="flex items-center gap-5 flex-shrink-0">
              <div className="sl-status">
                <div className={`sl-dot ${hasFile ? "on" : "off"}`} />
                <span className="sl-hint">File</span>
              </div>
              <div className="sl-status">
                <div className={`sl-dot ${hasPolygon ? "on" : "off"}`} />
                <span className="sl-hint">Polygon</span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1 hidden sm:block" />

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!canContinue}
              className={`sl-next-btn ${canContinue ? "on" : "off"}`}
            >
              Continue →
            </button>
          </div>
        </div>

        {/* MAP */}
        <div className={`w-full ${highlightMap}`}>
          <PolygonDrawer
            onChange={handlePolygonChange}
            highlightModeToggle={highlightModeToggle}
            highlightSearchBar={highlightSearchBar}
            highlightPointModeInfo={highlightPointModeInfo}
            highlightDrawControls={highlightDrawControls}
            fullscreen={false}
          />
        </div>
      </div>
    </>
  );
};

export default StepLocation;
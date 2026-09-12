import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { downloadPdfFile } from "../utils/pdfDownload";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// Neutral graphite toolbar with a single accent color for pop — closer to a
// standard document-viewer chrome than the previous full-color gradients.
const ACCENTS = {
  emerald: { bg: "linear-gradient(180deg, #1f2937 0%, #161d29 100%)", solid: "#059669", soft: "rgba(5,150,105,0.18)", text: "#34d399" },
  blue: { bg: "linear-gradient(180deg, #1f2937 0%, #161d29 100%)", solid: "#2563eb", soft: "rgba(37,99,235,0.18)", text: "#60a5fa" },
};

const PdfViewer = ({ url, filename = "report.pdf", title = "Report", accent = "emerald" }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const blobRef = useRef(null); // full PDF bytes, reused for download/open-in-tab

  const theme = ACCENTS[accent] || ACCENTS.emerald;

  useEffect(() => {
    let cancelled = false;
    if (!url) return;

    setStatus("loading");
    setNumPages(0);
    setPageNum(1);
    blobRef.current = null;

    // Fetch the whole file ourselves and hand pdf.js the raw bytes instead
    // of a URL. Letting pdf.js issue its own byte-range HTTP requests makes
    // the transfer look like a streamed media/download to tools such as
    // IDM/XDM, which then grab it and break the in-page preview. A single
    // same-origin fetch consumed entirely in memory avoids that pattern
    // (and is a no-op network-wise when `url` is already a blob: URL).
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(async (blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        const data = await blob.arrayBuffer();
        if (cancelled) return;
        return pdfjsLib.getDocument({ data, disableStream: true, disableAutoFetch: true }).promise;
      })
      .then((pdf) => {
        if (cancelled || !pdf) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("❌ PdfViewer: échec du chargement du PDF", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [url]);

  const renderPage = useCallback(async (num, currentScale) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    renderTaskRef.current?.cancel?.();

    const page = await pdf.getPage(num);
    const containerWidth = containerRef.current?.clientWidth || 700;
    const baseViewport = page.getViewport({ scale: 1 });
    const fitScale = (Math.min(containerWidth, 820) / baseViewport.width) * currentScale;

    const dpr = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: fitScale });

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const task = page.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") throw err;
    }
  }, []);

  useEffect(() => {
    if (status === "ready") renderPage(pageNum, scale);
  }, [status, pageNum, scale, renderPage]);

  const goPrev = () => setPageNum((p) => Math.max(1, p - 1));
  const goNext = () => setPageNum((p) => Math.min(numPages, p + 1));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)));
  const zoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)));

  const handleOpenNewTab = () => {
    const blob = blobRef.current;
    if (!blob) return;
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  };

  const handleDownload = () => {
    if (blobRef.current) downloadPdfFile(blobRef.current, filename);
    else downloadPdfFile(url, filename);
  };

  return (
    <div
      className="pdfv-root"
      style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 18px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.08)" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .pdfv-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: 6px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85); cursor: pointer; transition: all .15s ease;
          font-size: 14px; user-select: none;
        }
        .pdfv-btn:hover:not(:disabled) { background: rgba(255,255,255,0.14); }
        .pdfv-btn:disabled { opacity: 0.3; cursor: default; }
        .pdfv-page-wrap::-webkit-scrollbar { width: 10px; height: 10px; }
        .pdfv-page-wrap::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
      `}</style>

      {/* Toolbar */}
      <div
        style={{
          background: theme.bg,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13, letterSpacing: "0.04em", color: theme.text, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className="pdfv-btn" onClick={goPrev} disabled={pageNum <= 1} title="Previous page">‹</button>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, minWidth: 54, textAlign: "center" }}>
            {numPages ? `${pageNum} / ${numPages}` : "…"}
          </span>
          <button className="pdfv-btn" onClick={goNext} disabled={pageNum >= numPages} title="Next page">›</button>

          <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

          <button className="pdfv-btn" onClick={zoomOut} disabled={scale <= 0.5} title="Zoom out">−</button>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, minWidth: 40, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
          <button className="pdfv-btn" onClick={zoomIn} disabled={scale >= 2.5} title="Zoom in">+</button>

          <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />

          <button className="pdfv-btn" onClick={handleOpenNewTab} disabled={!blobRef.current} title="Open in new tab">⤢</button>
          <button className="pdfv-btn" onClick={handleDownload} title="Download">⭳</button>
        </div>
      </div>

      {/* Page area */}
      <div
        ref={containerRef}
        className="pdfv-page-wrap"
        style={{
          background: "radial-gradient(ellipse at top, #f1f2f4 0%, #dfe1e6 100%)",
          minHeight: 420,
          maxHeight: "78vh",
          overflow: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: status === "ready" ? "flex-start" : "center",
          padding: "24px 16px",
        }}
      >
        {status === "loading" && (
          <div style={{ textAlign: "center", color: "#5b6270" }}>
            <div
              style={{
                width: 34, height: 34, margin: "0 auto 10px", borderRadius: "50%",
                border: `3px solid ${theme.soft}`, borderTopColor: theme.solid,
                animation: "pdfv-spin 0.8s linear infinite",
              }}
            />
            <style>{`@keyframes pdfv-spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 13 }}>Loading report…</p>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", color: "#7f1d1d", maxWidth: 320 }}>
            <p style={{ fontSize: 13, marginBottom: 8 }}>⚠️ Unable to preview this PDF.</p>
            <a href={url} target="_blank" rel="noreferrer" style={{ color: theme.solid, fontSize: 13, fontWeight: 600 }}>
              Open it in a new tab instead
            </a>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            display: status === "ready" ? "block" : "none",
            background: "#fff",
            boxShadow: "0 4px 22px rgba(0,0,0,0.18)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};

export default PdfViewer;

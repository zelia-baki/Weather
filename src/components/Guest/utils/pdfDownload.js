// Download managers (IDM, XDM, ...) hook the browser's native Downloads
// pipeline (chrome.downloads.onCreated) to grab any file the browser tries
// to save — including blob: URLs triggered via <a download>.click(). When
// that happens the manager can't actually fetch a blob: URL from outside
// the page, the save silently fails, and the user is left with nothing.
//
// The File System Access API (showSaveFilePicker) writes the file directly
// from page JS and never goes through that Downloads pipeline, so it is
// invisible to IDM/XDM. We use it when available and fall back to the
// classic anchor-click technique everywhere else (Firefox, Safari, older
// Chromium).
export const downloadPdfFile = async (source, filename = "report.pdf") => {
  if (!source) return;

  let blob = source;
  if (!(source instanceof Blob)) {
    const res = await fetch(source);
    blob = await res.blob();
  }

  if (typeof window !== "undefined" && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err) {
      if (err?.name === "AbortError") return; // user cancelled the save dialog
      // Fall through to the anchor fallback for any other failure.
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
};

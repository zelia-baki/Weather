import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import html2pdf from "html2pdf.js";

const UserStatsCertificate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const userId = location.state?.userId || null;
    const certificateType = location.state?.certificateType || "all";

    const [stats, setStats]                   = useState(null);
    const [areaStats, setAreaStats]           = useState([]);
    const [areaLoading, setAreaLoading]       = useState(true);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [certificateId, setCertificateId]   = useState(null);

    // ── Fetch area stats (optional — page works without it) ──
    useEffect(() => {
        const fetchAreaStats = async () => {
            try {
                const res = await axiosInstance.get('/api/farm/area/by-compliance');
                if (res.data?.status === 'success' && Array.isArray(res.data.data)) {
                    setAreaStats(res.data.data);
                }
                // If empty or error → keep areaStats = [] and continue
            } catch (err) {
                console.warn('Area stats unavailable (no polygons yet):', err.message);
                // Not fatal — certificate renders without area data
            } finally {
                setAreaLoading(false);
            }
        };
        fetchAreaStats();
    }, []);

    // ── Fetch user farm stats ──
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                // Guard: no location state → navigate to a valid entry point
                if (!location.state) {
                    setError("No certificate data provided. Please access this page from the EUDR section.");
                    setLoading(false);
                    return;
                }

                const url = userId
                    ? `/api/farm/stats/by-user/${userId}`
                    : "/api/farm/stats/by-user";

                const response = await axiosInstance.get(url);

                if (response.data?.status === "success") {
                    let statsData = response.data.data;

                    // Handle array response
                    if (Array.isArray(statsData)) {
                        statsData = statsData.length > 0 ? statsData[0] : null;
                    }

                    if (!statsData) {
                        setError("No farm statistics found for this account.");
                        setLoading(false);
                        return;
                    }

                    // Ensure required nested fields exist with safe defaults
                    statsData.compliance_status = {
                        compliant_100:    0,
                        likely_compliant: 0,
                        not_compliant:    0,
                        no_report:        0,
                        ...(statsData.compliance_status || {}),
                    };
                    statsData.compliance_percentages = {
                        compliant_100_percent:    0,
                        likely_compliant_percent: 0,
                        not_compliant_percent:    0,
                        overall_rate:             0,
                        ...(statsData.compliance_percentages || {}),
                    };
                    statsData.total_farms    = statsData.total_farms    ?? 0;
                    statsData.username       = statsData.username        ?? "N/A";
                    statsData.company_name   = statsData.company_name   ?? statsData.username ?? "N/A";
                    statsData.user_type      = statsData.user_type       ?? "N/A";
                    statsData.id_start       = statsData.id_start        ?? "N/A";
                    statsData.user_id        = statsData.user_id         ?? userId ?? "N/A";

                    setStats(statsData);
                } else {
                    setError(response.data?.message || "Failed to load statistics.");
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Failed to load statistics.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userId]);  // eslint-disable-line

    // ── Area helpers — safe against empty areaStats ──────────
    const hasAreaData = areaStats.length > 0;

    const getAreaByStatus = (status) =>
        areaStats.find((a) => a.compliance_status === status)?.total_area || 0;

    const getTreeLossByStatus = (status) =>
        areaStats.find((a) => a.compliance_status === status)?.total_tree_cover_loss || 0;

    const getAreaPercentages = () => {
        if (!hasAreaData) return { compliant: "N/A", likely: "N/A", not: "N/A" };
        const totalArea = areaStats.reduce((acc, a) => acc + (a.total_area || 0), 0);
        if (totalArea === 0) return { compliant: "0.00", likely: "0.00", not: "0.00" };
        return {
            compliant: ((getAreaByStatus("100% Compliant")  / totalArea) * 100).toFixed(2),
            likely:    ((getAreaByStatus("Likely Compliant") / totalArea) * 100).toFixed(2),
            not:       ((getAreaByStatus("Not Compliant")    / totalArea) * 100).toFixed(2),
        };
    };

    const getTotalAreaForCertificate = () => {
        if (!hasAreaData) return null; // null = "not available"
        const areaMap = {
            compliant:        getAreaByStatus("100% Compliant"),
            likely_compliant: getAreaByStatus("Likely Compliant"),
            not_compliant:    getAreaByStatus("Not Compliant"),
        };
        return areaMap[certificateType] ??
            areaStats.reduce((acc, a) => acc + (a.total_area || 0), 0);
    };

    const getTotalTreeCoverLoss = () => {
        if (!hasAreaData) return null;
        const lossMap = {
            compliant:        getTreeLossByStatus("100% Compliant"),
            likely_compliant: getTreeLossByStatus("Likely Compliant"),
            not_compliant:    getTreeLossByStatus("Not Compliant"),
        };
        return lossMap[certificateType] ??
            areaStats.reduce((acc, a) => acc + (a.total_tree_cover_loss || 0), 0);
    };

    // ── PDF helpers ───────────────────────────────────────────
    const toDataURL = (url) =>
        fetch(url)
            .then(res => res.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror   = reject;
                reader.readAsDataURL(blob);
            }));

    const saveCertificateToDatabase = async (stats, certType) => {
        try {
            const response = await axiosInstance.post('/api/certificate/generate', {
                userId: stats.user_id,
                certificateType: certType,
                stats: {
                    total_farms:              stats.total_farms,
                    compliance_status:        stats.compliance_status,
                    compliance_percentages:   stats.compliance_percentages,
                },
            });
            if (response.data?.status === 'success') {
                setCertificateId(response.data.data.certificate_id);
                return response.data.data.id;
            }
            return null;
        } catch (err) {
            console.error('Error saving certificate:', err);
            return null;
        }
    };

    const trackDownload = async (certId) => {
        try {
            await axiosInstance.post(`/api/certificate/download/${certId}`);
        } catch (err) {
            console.error('Error tracking download:', err);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);
            const savedCertId = await saveCertificateToDatabase(stats, certificateType);
            const element     = document.getElementById("certificate-content");
            const images      = element.querySelectorAll("img");
            const originalSrcs = [];

            await Promise.all(Array.from(images).map(async (img, index) => {
                try {
                    originalSrcs[index] = img.src;
                    if (img.src.startsWith("http")) {
                        const dataUrl = await toDataURL(img.src);
                        img.src = dataUrl;
                        await new Promise(resolve => {
                            if (img.complete) resolve();
                            else { img.onload = resolve; img.onerror = resolve; }
                        });
                    }
                } catch (err) {
                    console.error("Error converting image:", err);
                }
            }));

            const opt = {
                margin:   0,
                filename: `${stats.username}_${certificateType}_certificate.pdf`,
                image:    { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2, useCORS: false, logging: false, allowTaint: true,
                    onclone: (clonedDoc) => {
                        clonedDoc.querySelectorAll('header img').forEach(img => {
                            if (img.alt === "Parrot Logo") {
                                Object.assign(img.style, { width: '80px', height: '96px', objectFit: 'contain', display: 'block' });
                            } else {
                                Object.assign(img.style, { width: '96px', height: '96px', objectFit: 'contain', display: 'block' });
                            }
                        });
                        clonedDoc.querySelectorAll('.signature-img').forEach(img => {
                            Object.assign(img.style, { width: '150px', height: 'auto', maxHeight: '60px', objectFit: 'contain', display: 'block' });
                        });
                    }
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(opt).from(element).save();
            images.forEach((img, index) => { if (originalSrcs[index]) img.src = originalSrcs[index]; });
            if (savedCertId) await trackDownload(savedCertId);
            alert("Certificate downloaded successfully!");
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Error generating PDF. Please try again.");
        } finally {
            setDownloadingPDF(false);
        }
    };

    // ── Loading state ─────────────────────────────────────────
    if (loading || areaLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading certificate data…</p>
            </div>
        </div>
    );

    // ── Error state (replaces blank page) ─────────────────────
    if (error || !stats) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
                <div className="text-5xl mb-4">📄</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {error ? "Unable to Load Certificate" : "No Data Available"}
                </h2>
                <p className="text-gray-500 mb-2 text-sm">
                    {error || "No farm statistics found for this account."}
                </p>
                {!hasAreaData && !error && (
                    <p className="text-amber-600 text-xs mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        ⚠️ No GPS polygon data found. The certificate will show farm counts only, without area calculations. Add GPS coordinates to your farms for full coverage metrics.
                    </p>
                )}
                <div className="flex gap-3 justify-center mt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-gray-600 text-white px-5 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Derived values ────────────────────────────────────────
    const areaPercentages = getAreaPercentages();
    const totalArea       = getTotalAreaForCertificate();  // null if no polygons
    const totalTreeLoss   = getTotalTreeCoverLoss();        // null if no polygons

    const certConfig = {
        compliant: {
            title:      "EUDR CERTIFICATE OF FULL COMPLIANCE",
            farmsCount: stats.compliance_status.compliant_100,
            percentage: areaPercentages.compliant,
            color:      "text-green-700",
        },
        likely_compliant: {
            title:      "EUDR CERTIFICATE OF LIKELY COMPLIANCE",
            farmsCount: stats.compliance_status.likely_compliant,
            percentage: areaPercentages.likely,
            color:      "text-yellow-700",
        },
        not_compliant: {
            title:      "EUDR CERTIFICATE OF NON-COMPLIANCE",
            farmsCount: stats.compliance_status.not_compliant,
            percentage: areaPercentages.not,
            color:      "text-red-700",
        },
        all: {
            title:      "EUDR COMPLIANCE CERTIFICATE",
            farmsCount: stats.total_farms,
            percentage: hasAreaData
                ? (parseFloat(areaPercentages.compliant) + parseFloat(areaPercentages.likely)).toFixed(2)
                : "N/A",
            color: "text-blue-700",
        },
    };

    const { title, farmsCount, percentage, color } = certConfig[certificateType] || certConfig.all;
    const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // ── Sub-component: one compliance row ─────────────────────
    const ComplianceItem = ({ label, status, colorClass }) => {
        const area     = getAreaByStatus(status);
        const treeLoss = getTreeLossByStatus(status);
        const keyMap   = {
            "100% Compliant":  "compliant_100",
            "Likely Compliant": "likely_compliant",
            "Not Compliant":   "not_compliant",
            "No Report":       "no_report",
        };
        const count = stats.compliance_status[keyMap[status]] ?? 0;
        const pct   = areaPercentages[
            status === "100% Compliant"  ? "compliant" :
            status === "Likely Compliant" ? "likely"   : "not"
        ];

        return (
            <li className="space-y-1">
                <div className="flex justify-between">
                    <span>{label}:</span>
                    <strong className={colorClass}>
                        {count} farms{hasAreaData && pct !== "N/A" ? ` (${pct}%)` : ""}
                    </strong>
                </div>
                {hasAreaData && (
                    <div className="flex justify-between text-sm pl-4">
                        <span>Project Area:</span>
                        <span className="font-medium">{area.toFixed(2)} ha</span>
                    </div>
                )}
                {hasAreaData && treeLoss > 0 && (
                    <div className="flex justify-between text-sm pl-4 text-red-600">
                        <span>Tree Cover Loss:</span>
                        <span className="font-medium">{treeLoss.toFixed(2)} ha</span>
                    </div>
                )}
            </li>
        );
    };

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white">
            <style>{`
                @page { size: A4 portrait; margin: 0; }
                @media print {
                    body * { visibility: hidden !important; }
                    #certificate-content, #certificate-content * { visibility: visible !important; }
                    #certificate-content { position: absolute; left: 0; top: 0; width: 210mm; height: 297mm; overflow: hidden; }
                    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                }
                #certificate-content {
                    width: 210mm !important;
                    min-height: 297mm !important;
                    margin: 0 auto !important;
                    background: white !important;
                }
                #certificate-content header img {
                    width: 96px !important; height: 96px !important; object-fit: contain !important;
                    min-width: 96px !important; min-height: 96px !important;
                    max-width: 96px !important; max-height: 96px !important; display: block !important;
                }
                #certificate-content header img[alt="Parrot Logo"] {
                    width: 80px !important; min-width: 80px !important; max-width: 80px !important;
                }
                .signature-img {
                    width: 150px !important; height: auto !important; max-height: 60px !important;
                    object-fit: contain !important; display: block !important;
                }
            `}</style>

            {/* ── Boutons d'action ── */}
            <div className="no-print max-w-4xl mx-auto mb-4 flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate(-1)}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                    Back
                </button>
                <button onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Print
                </button>
                <button onClick={handleDownloadPDF} disabled={downloadingPDF}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
                    {downloadingPDF ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating PDF…</span>
                        </>
                    ) : "Download PDF"}
                </button>
            </div>

            {/* ── Avertissement sans polygones ── */}
            {!hasAreaData && (
                <div className="no-print max-w-4xl mx-auto mb-4">
                    <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <strong>No GPS polygon data available.</strong> Area coverage and tree cover loss metrics are not shown. The certificate is still valid — add GPS polygons to your farms to include full area statistics.
                        </div>
                    </div>
                </div>
            )}

            {certificateId && (
                <div className="no-print max-w-4xl mx-auto mb-4 text-center">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>Certificate ID:</strong> {certificateId}
                    </div>
                </div>
            )}

            {/* ── CONTENU DU CERTIFICAT ── */}
            <div id="certificate-content" className="page-wrap bg-white shadow-2xl p-[12mm] mx-auto">
                <div className="border-[12px] border-[#3b2418] p-2 h-full">
                    <div className="border-[6px] border-[#d0c7b8] h-full p-2 bg-gradient-to-b from-white to-[#fcfbf9] flex flex-col justify-between">

                        {/* EN-TÊTE */}
                        <header className="flex items-center justify-between gap-5 mb-5">
                            <div className="flex-shrink-0" style={{ width: '96px', height: '96px' }}>
                                <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1 text-center" />
                            <div className="flex-shrink-0" style={{ width: '80px', height: '96px' }}>
                                <img src="/parrotlogo.svg" alt="Parrot Logo" className="w-20 h-24 object-contain" />
                            </div>
                        </header>

                        {/* TITRE */}
                        <div className="text-center my-4">
                            <h1 className={`text-3xl font-bold tracking-[3px] ${color}`}>{title}</h1>
                        </div>

                        {/* CONTENU PRINCIPAL */}
                        <div className="px-4 py-2 text-gray-700 text-sm flex-1">
                            <p className="text-center mb-3">This certifies that</p>
                            <div className="text-center text-2xl font-bold my-2">
                                {stats.company_name.toUpperCase()}
                            </div>

                            <p className="max-w-[900px] mx-auto text-justify leading-relaxed mb-4">
                                has been evaluated according to the European Union Deforestation Regulation
                                (EU Regulation 2023/1115) and shows a compliance rate across{" "}
                                <strong>{farmsCount}</strong> farm{farmsCount !== 1 ? "s" : ""}
                                {totalArea !== null && (
                                    <> covering a total area of{" "}
                                        <strong>{totalArea.toFixed(2)} hectares</strong>
                                        {totalTreeLoss !== null && totalTreeLoss > 0 && (
                                            <span> with a tree cover loss of{" "}
                                                <strong className="text-red-600">{totalTreeLoss.toFixed(2)} hectares</strong>
                                            </span>
                                        )}
                                    </>
                                )}
                                . This certificate confirms the environmental compliance status indicated below.
                            </p>

                            {/* Résumé de conformité */}
                            <div className="bg-[#f3efc8] border border-[#e4dda6] p-4 my-4 max-w-[900px] mx-auto shadow-inner">
                                <div className="font-bold mb-2">Compliance Summary</div>
                                {certificateType === "all" ? (
                                    <ul className="space-y-3 text-sm">
                                        <ComplianceItem label="100% Compliant"  status="100% Compliant"  colorClass="text-green-700" />
                                        <ComplianceItem label="Likely Compliant" status="Likely Compliant" colorClass="text-yellow-700" />
                                        <ComplianceItem label="Not Compliant"   status="Not Compliant"   colorClass="text-red-700" />
                                    </ul>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="text-lg font-semibold">
                                            {farmsCount} farm{farmsCount !== 1 ? "s" : ""}
                                            {percentage !== "N/A" ? ` (${percentage}%)` : ""}
                                        </div>
                                        {totalArea !== null ? (
                                            <div className="text-md font-medium text-gray-700">
                                                Total Area: {totalArea.toFixed(2)} hectares
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic">
                                                Area data not available — no GPS polygons recorded
                                            </div>
                                        )}
                                        {totalTreeLoss !== null && totalTreeLoss > 0 && (
                                            <div className="text-md font-medium text-red-600">
                                                Tree Cover Loss: {totalTreeLoss.toFixed(2)} hectares
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* QR + EORI */}
                            <div className="flex justify-between items-center mt-4 gap-4">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=UserID:${stats.user_id}|IdStart:${stats.id_start}|Type:${certificateType}${totalArea !== null ? `|Area:${totalArea.toFixed(2)}ha` : ""}${totalTreeLoss !== null && totalTreeLoss > 0 ? `|TreeLoss:${totalTreeLoss.toFixed(2)}ha` : ""}`}
                                        alt="QR code"
                                        className="qr-code w-24 h-24 object-cover border border-gray-300 bg-white"
                                    />
                                    <div className="text-xs text-gray-500 text-center">
                                        Certificate ID: {stats.user_id}-{new Date().getFullYear()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm">Operator EORI : HRUG000004679</div>
                                    <div className="text-xs text-gray-600">Environmental Compliance Officer</div>
                                </div>
                            </div>

                            {/* Signature + infos bas */}
                            <div className="flex justify-between mt-5 text-xs text-gray-600 items-end">
                                <div>
                                    <div><strong>Date Issued:</strong> {currentDate}</div>
                                    <div><strong>User ID:</strong> {stats.id_start}</div>
                                    <div><strong>Email:</strong> nkusu@agriyields.com</div>
                                </div>
                                <div className="text-right">
                                    <div><strong>Total Farms:</strong> {stats.total_farms}</div>
                                    <div><strong>User Type:</strong> {stats.user_type}</div>
                                    <div className="mt-3 flex flex-col items-end">
                                        <img src="/signature.jpg" alt="Authorized Signature" className="signature-img" />
                                        <div className="text-xs text-gray-500 mt-1 border-t border-gray-300 pt-1"
                                            style={{ width: '150px', textAlign: 'center' }}>
                                            Authorized Signature
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PIED DE PAGE */}
                        <footer className="text-center text-gray-500 text-xs mt-6 border-t border-gray-200 pt-2">
                            This certificate is generated automatically by the EUDR Compliance System
                            and reflects the current status of the user's farm assessments.
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserStatsCertificate;
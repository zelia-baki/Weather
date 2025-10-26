import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import html2pdf from "html2pdf.js";

const UserStatsCertificate = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId || null;
    const certificateType = location.state?.certificateType || "all";

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [certificateId, setCertificateId] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const url = userId
                    ? `/api/farm/stats/by-user/${userId}`
                    : "/api/farm/stats/by-user";

                const response = await axiosInstance.get(url);
                if (response.data.status === "success") {
                    const statsData = Array.isArray(response.data.data)
                        ? response.data.data[0]
                        : response.data.data;
                    setStats(statsData);
                } else {
                    setError(response.data.message || "Failed to load statistics");
                }
            } catch (err) {
                console.error("Error fetching stats:", err);
                setError(err.response?.data?.message || "Failed to load statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [userId]);

    const handlePrint = () => window.print();

    const toDataURL = (url) =>
        fetch(url)
            .then((response) => response.blob())
            .then(
                (blob) =>
                    new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    })
            );

    const saveCertificateToDatabase = async (stats, certificateType) => {
        try {
            const response = await axiosInstance.post('/api/certificate/generate', {
                userId: stats.user_id,
                certificateType: certificateType,
                stats: {
                    total_farms: stats.total_farms,
                    compliance_status: stats.compliance_status,
                    compliance_percentages: stats.compliance_percentages
                }
            });

            if (response.data.status === 'success') {
                setCertificateId(response.data.data.certificate_id);
                console.log('Certificate saved:', response.data.data.certificate_id);
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
            console.log('Download tracked for certificate:', certId);
        } catch (err) {
            console.error('Error tracking download:', err);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);

            // Sauvegarder d'abord le certificat dans la BDD
            const savedCertId = await saveCertificateToDatabase(stats, certificateType);

            const element = document.getElementById("certificate-content");

            // Convertir les images distantes en Base64 avant la capture
            const images = element.querySelectorAll("img");
            await Promise.all(
                Array.from(images).map(async (img) => {
                    try {
                        if (img.src.startsWith("http")) {
                            const dataUrl = await toDataURL(img.src);
                            img.src = dataUrl;
                        }
                    } catch (err) {
                        console.error("Error converting image:", err);
                    }
                })
            );

            const opt = {
                margin: 0,
                filename: `${stats.username}_${certificateType}_certificate.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: false,
                    logging: false
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(opt).from(element).save();

            // Tracker le téléchargement
            if (savedCertId) {
                await trackDownload(savedCertId);
            }

            alert("Certificate downloaded and saved successfully!");
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Erreur lors de la génération du PDF. Veuillez réessayer.");
        } finally {
            setDownloadingPDF(false);
        }
    };

    const handleBack = () => navigate(-1);

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading statistics...</p>
                </div>
            </div>
        );

    if (error)
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center text-red-600">
                    <h2 className="text-xl font-bold mb-2">Error Loading Statistics</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );

    if (!stats) return null;

    let title = "";
    let farmsCount = 0;
    let percentage = 0;
    let color = "";

    switch (certificateType) {
        case "compliant":
            title = "CERTIFICATE OF FULL COMPLIANCE";
            farmsCount = stats.compliance_status.compliant_100;
            percentage = stats.compliance_percentages.compliant_100_percent;
            color = "text-green-700";
            break;
        case "likely_compliant":
            title = "CERTIFICATE OF LIKELY COMPLIANCE";
            farmsCount = stats.compliance_status.likely_compliant;
            percentage = stats.compliance_percentages.likely_compliant_percent;
            color = "text-yellow-700";
            break;
        case "not_compliant":
            title = "CERTIFICATE OF NON-COMPLIANCE";
            farmsCount = stats.compliance_status.not_compliant;
            percentage = stats.compliance_percentages.not_compliant_percent;
            color = "text-red-700";
            break;
        default:
            title = "GLOBAL COMPLIANCE CERTIFICATE";
            farmsCount = stats.total_farms;
            percentage = stats.total_farms
                ? ((stats.compliance_status.compliant_100 / stats.total_farms) * 100).toFixed(1)
                : 0;
            color = "text-blue-700";
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);
    const validUntilStr = validUntil.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="min-h-screen bg-gray-100 py-8 print:bg-white">
            <style>{`
                @page { size: A4; margin: 0; }
                @media print {
                    body * { visibility: hidden !important; }
                    #certificate-content, #certificate-content * { visibility: visible !important; }
                    #certificate-content { position: absolute; left: 0; top: 0; width: 100%; }
                    html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
                }
            `}</style>

            <div className="no-print max-w-4xl mx-auto mb-4 flex flex-wrap gap-3 justify-center">
                <button
                    onClick={handleBack}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
                >
                    Back
                </button>
                <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Print
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {downloadingPDF ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating PDF...</span>
                        </>
                    ) : (
                        "Download PDF"
                    )}
                </button>
            </div>

            {certificateId && (
                <div className="no-print max-w-4xl mx-auto mb-4 text-center">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>Certificate ID:</strong> {certificateId}
                    </div>
                </div>
            )}

            <div
                id="certificate-content"
                className="page-wrap max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-[18mm]"
            >
                <div className="border-[12px] border-[#3b2418] p-2 h-full">
                    <div className="border-[6px] border-[#d0c7b8] h-full p-7 bg-gradient-to-b from-white to-[#fcfbf9]">
                        <header className="flex items-center gap-5 mb-5">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain" />
                                <img src="/parrotlogo.svg" alt="Parrot Logo" className="w-24 h-24 object-contain" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-500">EUDR COMPLIANCE REPORT</div>
                                <div className="text-xl font-bold tracking-wider">NKUSU</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Based on EU Regulation (2023/1115) on deforestation-free products.
                                </div>
                            </div>
                        </header>

                        <div className="text-center my-4">
                            <h1 className={`text-5xl font-bold tracking-[3px] ${color}`}>
                                {title}
                            </h1>
                        </div>

                        <div className="px-4 py-2 text-gray-700 text-sm">
                            <p className="text-center mb-3">This certifies that</p>
                            <div className="text-center text-2xl font-bold my-2">
                                {stats.username.toUpperCase()}
                            </div>

                            <p className="max-w-[900px] mx-auto text-justify leading-relaxed mb-4">
                                has been evaluated according to the European Union Deforestation Regulation (EUDR)
                                and shows a compliance rate of <strong>{percentage}%</strong> across{" "}
                                <strong>{farmsCount}</strong> farms.
                                This certificate confirms the environmental compliance status indicated below.
                            </p>

                            <div className="bg-[#f3efc8] border border-[#e4dda6] p-4 my-4 max-w-[900px] mx-auto shadow-inner">
                                <div className="font-bold mb-2">Compliance Summary</div>

                                {certificateType === "all" ? (
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex justify-between">
                                            <span>100% Compliant:</span>
                                            <strong className="text-green-700">
                                                {stats.compliance_status.compliant_100} farms (
                                                {stats.compliance_percentages.compliant_100_percent}%)
                                            </strong>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Likely Compliant:</span>
                                            <strong className="text-yellow-700">
                                                {stats.compliance_status.likely_compliant} farms (
                                                {stats.compliance_percentages.likely_compliant_percent}%)
                                            </strong>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Not Compliant:</span>
                                            <strong className="text-red-700">
                                                {stats.compliance_status.not_compliant} farms (
                                                {stats.compliance_percentages.not_compliant_percent}%)
                                            </strong>
                                        </li>
                                    </ul>
                                ) : (
                                    <div className="text-center text-lg font-semibold mt-2">
                                        {farmsCount} farms ({percentage}%)
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end mt-6 gap-3">
                                <div>
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UserID:${stats.user_id}|Type:${certificateType}|Rate:${percentage}%`}
                                        alt="QR code"
                                        className="w-28 h-28 object-cover border border-gray-300 bg-white"
                                    />
                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                        Certificate ID: {stats.user_id}-{new Date().getFullYear()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">EORI : HRUG000004679</div>
                                    <div className="text-sm text-gray-600">Environmental Compliance Officer</div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-5 text-xs text-gray-600">
                                <div>
                                    <div><strong>Date Issued:</strong> {currentDate}</div>
                                    <div><strong>User ID:</strong> {stats.user_id}</div>
                                    <div><strong>Email:</strong> {stats.email}</div>
                                </div>
                                <div className="text-right">
                                    <div><strong>Valid Until:</strong> {validUntilStr}</div>
                                    <div><strong>User Type:</strong> {stats.user_type}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserStatsCertificate;
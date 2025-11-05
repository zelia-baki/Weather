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
    const [areaStats, setAreaStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [certificateId, setCertificateId] = useState(null);

    // Fetch area stats
    useEffect(() => {
        const fetchAreaStats = async () => {
            try {
                const res = await axiosInstance.get('/api/farm/area/by-compliance');
                if (res.data.status === 'success') setAreaStats(res.data.data);
            } catch (err) {
                console.error('Error fetching area stats:', err);
            }
        };
        fetchAreaStats();
    }, []);

    // Fetch user stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const url = userId ? `/api/farm/stats/by-user/${userId}` : "/api/farm/stats/by-user";
                const response = await axiosInstance.get(url);
                if (response.data.status === "success") {
                    const statsData = Array.isArray(response.data.data) 
                        ? response.data.data[0] 
                        : response.data.data;
                        console.log("Stat data ",statsData);
                    setStats(statsData);
                } else {
                    setError(response.data.message || "Failed to load statistics");
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load statistics");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userId]);

    // Calculate area percentages
    const getAreaPercentages = () => {
        if (!areaStats.length) return { compliant: 0, likely: 0, not: 0 };
        const totalArea = areaStats.reduce((acc, a) => acc + (a.total_area || 0), 0);
        if (totalArea === 0) return { compliant: 0, likely: 0, not: 0 };

        const getArea = (status) => areaStats.find((a) => a.compliance_status === status)?.total_area || 0;
        return {
            compliant: ((getArea("100% Compliant") / totalArea) * 100).toFixed(2),
            likely: ((getArea("Likely Compliant") / totalArea) * 100).toFixed(2),
            not: ((getArea("Not Compliant") / totalArea) * 100).toFixed(2),
        };
    };

    // Get total area for certificate type
    const getTotalAreaForCertificate = () => {
        if (!areaStats.length) return 0;
        const getArea = (status) => areaStats.find((a) => a.compliance_status === status)?.total_area || 0;
        
        const areaMap = {
            compliant: getArea("100% Compliant"),
            likely_compliant: getArea("Likely Compliant"),
            not_compliant: getArea("Not Compliant")
        };
        
        return areaMap[certificateType] || areaStats.reduce((acc, a) => acc + (a.total_area || 0), 0);
    };

    // Convert URL to Data URL
    const toDataURL = (url) =>
        fetch(url)
            .then(res => res.blob())
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }));

    // Save certificate to database
    const saveCertificateToDatabase = async (stats, certificateType) => {
        try {
            const response = await axiosInstance.post('/api/certificate/generate', {
                userId: stats.user_id,
                certificateType,
                stats: {
                    total_farms: stats.total_farms,
                    compliance_status: stats.compliance_status,
                    compliance_percentages: stats.compliance_percentages
                }
            });
            if (response.data.status === 'success') {
                setCertificateId(response.data.data.certificate_id);
                return response.data.data.id;
            }
            return null;
        } catch (err) {
            console.error('Error saving certificate:', err);
            return null;
        }
    };

    // Track download
    const trackDownload = async (certId) => {
        try {
            await axiosInstance.post(`/api/certificate/download/${certId}`);
        } catch (err) {
            console.error('Error tracking download:', err);
        }
    };

    // Download PDF
    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);
            const savedCertId = await saveCertificateToDatabase(stats, certificateType);
            const element = document.getElementById("certificate-content");

            // Convert images to data URL directly in original element
            const images = element.querySelectorAll("img");
            const originalSrcs = [];
            
            await Promise.all(Array.from(images).map(async (img, index) => {
                try {
                    originalSrcs[index] = img.src; // Save original src
                    
                    if (img.src.startsWith("http")) {
                        const dataUrl = await toDataURL(img.src);
                        img.src = dataUrl;
                        
                        await new Promise(resolve => {
                            if (img.complete) resolve();
                            else {
                                img.onload = resolve;
                                img.onerror = resolve;
                            }
                        });
                    }
                } catch (err) {
                    console.error("Error converting image:", err);
                }
            }));

            const opt = {
                margin: 0,
                filename: `${stats.username}_${certificateType}_certificate.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: false,
                    logging: false,
                    allowTaint: true,
                    onclone: (clonedDoc) => {
                        // Force image dimensions in cloned document
                        clonedDoc.querySelectorAll('header img').forEach(img => {
                            if (img.alt === "Parrot Logo") {
                                Object.assign(img.style, {
                                    width: '80px', 
                                    height: '96px', 
                                    objectFit: 'contain', 
                                    display: 'block'
                                });
                            } else {
                                Object.assign(img.style, {
                                    width: '96px', 
                                    height: '96px', 
                                    objectFit: 'contain', 
                                    display: 'block'
                                });
                            }
                        });
                    }
                },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(opt).from(element).save();

            // Restore original image sources
            images.forEach((img, index) => {
                if (originalSrcs[index]) {
                    img.src = originalSrcs[index];
                }
            });

            if (savedCertId) await trackDownload(savedCertId);
            alert("Certificate downloaded and saved successfully!");
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Error generating PDF. Please try again.");
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading statistics...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center text-red-600">
                <h2 className="text-xl font-bold mb-2">Error Loading Statistics</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Go Back
                </button>
            </div>
        </div>
    );

    if (!stats) return null;

    const areaPercentages = getAreaPercentages();
    const totalArea = getTotalAreaForCertificate();

    // Certificate configuration
    const certConfig = {
        compliant: {
            title: "EUDR CERTIFICATE OF FULL COMPLIANCE",
            farmsCount: stats.compliance_status.compliant_100,
            percentage: areaPercentages.compliant,
            color: "text-green-700"
        },
        likely_compliant: {
            title: "EUDR CERTIFICATE OF LIKELY COMPLIANCE",
            farmsCount: stats.compliance_status.likely_compliant,
            percentage: areaPercentages.likely,
            color: "text-yellow-700"
        },
        not_compliant: {
            title: "EUDR CERTIFICATE OF NON-COMPLIANCE",
            farmsCount: stats.compliance_status.not_compliant,
            percentage: areaPercentages.not,
            color: "text-red-700"
        },
        all: {
            title: "EUDR COMPLIANCE CERTIFICATE",
            farmsCount: stats.total_farms,
            percentage: (parseFloat(areaPercentages.compliant) + parseFloat(areaPercentages.likely)).toFixed(2),
            color: "text-blue-700"
        }
    };

    const { title, farmsCount, percentage, color } = certConfig[certificateType] || certConfig.all;
    const currentDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const logoStyle = {
        width: '80px', height: '96px', objectFit: 'contain',
        minWidth: '80px', minHeight: '96px',
        maxWidth: '80px', maxHeight: '96px', display: 'block'
    };

    const ComplianceItem = ({ label, status, colorClass }) => {
        const area = areaStats.find(a => a.compliance_status === status)?.total_area || 0;
        const count = stats.compliance_status[status.toLowerCase().replace(/\s+/g, '_').replace('%', '')] || 0;
        const pct = areaPercentages[status === "100% Compliant" ? "compliant" : status === "Likely Compliant" ? "likely" : "not"];
        return (
            <li className="flex justify-between">
                <span>{label}:</span>
                <strong className={colorClass}>{count} farms ({pct}%) - {area.toFixed(2)} ha</strong>
            </li>
        );
    };

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
                #certificate-content header img {
                    width: 96px !important; height: 96px !important; object-fit: contain !important;
                    min-width: 96px !important; min-height: 96px !important;
                    max-width: 96px !important; max-height: 96px !important; display: block !important;
                }
                #certificate-content header img[alt="Parrot Logo"] {
                    width: 80px !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
            `}</style>

            <div className="no-print max-w-4xl mx-auto mb-4 flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate(-1)} className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                    Back
                </button>
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Print
                </button>
                <button onClick={handleDownloadPDF} disabled={downloadingPDF}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2">
                    {downloadingPDF ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generating PDF...</span>
                        </>
                    ) : "Download PDF"}
                </button>
            </div>

            {certificateId && (
                <div className="no-print max-w-4xl mx-auto mb-4 text-center">
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        <strong>Certificate ID:</strong> {certificateId}
                    </div>
                </div>
            )}

            <div id="certificate-content" className="page-wrap max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-[18mm]">
                <div className="border-[12px] border-[#3b2418] p-2 h-full">
                    <div className="border-[6px] border-[#d0c7b8] h-full p-7 bg-gradient-to-b from-white to-[#fcfbf9]">
                        <header className="flex items-center justify-between gap-5 mb-5">
                            <div className="flex-shrink-0" style={{ width: '96px', height: '96px' }}>
                                <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain" style={logoStyle} />
                            </div>
                            <div className="flex-1 text-center">
                                {/* <div className="text-sm text-gray-500">EUDR COMPLIANCE REPORT</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Based on EU Regulation (2023/1115) on deforestation-free products.
                                </div> */}
                            </div>
                            <div className="flex-shrink-0" style={{ width: '80px', height: '96px' }}>
                                <img src="/parrotlogo.svg" alt="Parrot Logo" className="w-20 h-24 object-contain" style={logoStyle} />
                            </div>
                        </header>

                        <div className="text-center my-4">
                            <h1 className={`text-5xl font-bold tracking-[3px] ${color}`}>{title}</h1>
                        </div>

                        <div className="px-4 py-2 text-gray-700 text-sm">
                            <p className="text-center mb-3">This certifies that</p>
                            <div className="text-center text-2xl font-bold my-2">{stats.company_name.toUpperCase()}</div>

                            <p className="max-w-[900px] mx-auto text-justify leading-relaxed mb-4">
                                has been evaluated according to the European Union Deforestation Regulation (Based on EU Regulation (2023/1115) on deforestation-free products.)
                                and shows a compliance rate across <strong>{farmsCount}</strong> farms covering a total area of{" "}
                                <strong>{totalArea.toFixed(2)} hectares</strong>. This certificate confirms the environmental compliance status indicated below.
                            </p>

                            <div className="bg-[#f3efc8] border border-[#e4dda6] p-4 my-4 max-w-[900px] mx-auto shadow-inner">
                                <div className="font-bold mb-2">Compliance Summary (based on total area)</div>

                                {certificateType === "all" ? (
                                    <ul className="space-y-1 text-sm">
                                        <ComplianceItem label="100% Compliant" status="100% Compliant" colorClass="text-green-700" />
                                        <ComplianceItem label="Likely Compliant" status="Likely Compliant" colorClass="text-yellow-700" />
                                        <ComplianceItem label="Not Compliant" status="Not Compliant" colorClass="text-red-700" />
                                        <li className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                                            <span>Total Area:</span>
                                            <strong className="text-blue-700">
                                                {areaStats.reduce((acc, a) => acc + (a.total_area || 0), 0).toFixed(2)} ha
                                            </strong>
                                        </li>
                                    </ul>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-lg font-semibold mt-2">{farmsCount} farms ({percentage}%)</div>
                                        <div className="text-md font-medium text-gray-700 mt-1">Total Area: {totalArea.toFixed(2)} hectares</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end mt-6 gap-3">
                                <div>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=UserID:${stats.user_id}|IdStart:${stats.id_start}|Type:${certificateType}|Area:${totalArea.toFixed(2)}ha`}
                                        alt="QR code" className="qr-code w-28 h-28 object-cover border border-gray-300 bg-white" />
                                    <div className="text-xs text-gray-500 mt-1 text-center">
                                        Certificate ID: {stats.user_id}-{new Date().getFullYear()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">Operator EORI : HRUG000004679</div>
                                    <div className="text-sm text-gray-600">Environmental Compliance Officer</div>
                                </div>
                            </div>

                            <div className="flex justify-between mt-5 text-xs text-gray-600">
                                <div>
                                    <div><strong>Date Issued:</strong> {currentDate}</div>
                                    <div><strong>User ID:</strong> {stats.id_start}</div>
                                    {/* <div><strong>Email:</strong> {stats.email}</div> */}
                                    <div><strong>Email:</strong> nkusu@agriyields.com</div>
                                </div>
                                <div className="text-right">
                                    <div><strong>Total Farms:</strong> {stats.total_farms}</div>
                                    <div><strong>User Type:</strong> {stats.user_type}</div>
                                </div>
                            </div>
                        </div>

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
import React, { useRef } from "react";
import DueDiligenceStatement from './DueDiligenceStatement';
import { generatePdfBlob } from '../Guest/utils/pdfUtils.js';

const SoapResponseDisplay = ({ data, referenceNumber, verificationCode, showPreview }) => {
    const ddsRef = useRef(null);
    console.log("🍃🍃", data.statements);

    const handleDownload = async () => {
        if (!ddsRef.current) return;
        const blob = await generatePdfBlob({ current: ddsRef.current }, `DDS_${referenceNumber}`); if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `DDS_${referenceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        }
    };

    if (!data) return <p className="text-gray-500 italic">Aucune donnée affichée pour le moment.</p>;

    // ✅ Gestion sûre de l'erreur
    if (data.error) {
        const errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error, null, 2);
        return (
            <div className="text-red-600 font-semibold whitespace-pre-wrap">
                {errorMessage}
            </div>
        );
    }
    let producer = null;
    let commodity = {};

    if (data?.local_data?.producers_json) {
        try {
            const parsed = JSON.parse(data.local_data.producers_json);
            if (Array.isArray(parsed) && parsed.length > 0) {
                producer = parsed[0];
            }
        } catch (e) {
            console.error("❌ Erreur parsing producers_json:", e);
        }
    }

    if (Array.isArray(data?.remote_data?.commodities)) {
        commodity = data.remote_data.commodities[0] || {};
    }



    return (
        <div className="space-y-2 text-sm text-gray-800">
            {/* ✅ DDS Identifier */}
            {data.ddsIdentifier && (
                <div>
                    <strong>DDS Identifier:</strong> {data.ddsIdentifier}
                </div>
            )}

            {/* ✅ Amendment */}
            {data.amendStatus && (
                <div className="text-green-700 font-medium">
                    ✅ Amendment successfully completed. <br />
                    <strong>Status:</strong> {data.amendStatus}
                </div>
            )}

            {/* ✅ Statement info */}
            {data.referenceNumber && (
                <div>
                    <p><strong>Reference Number:</strong> {data.referenceNumber}</p>
                    <p><strong>Activity Type:</strong> {data.activityType}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Status Date:</strong> {new Date(data.statusDate).toLocaleString()}</p>
                    <p><strong>Operator:</strong> {data.operator?.name} ({data.operator?.country})</p>
                </div>
            )}

            {/* ✅ Commodities */}
            {Array.isArray(data?.remote_data?.commodities) && data.remote_data.commodities.length > 0 && (
                <div className="border-t pt-2">
                    <h4 className="font-semibold">Commodity</h4>
                    <p><strong>Description of Goods:</strong> {commodity.descriptionOfGoods}</p>
                    <p><strong>HS Heading:</strong> {commodity.hsHeading}</p>
                    <p><strong>Species:</strong> {commodity.speciesInfo?.scientificName} ({commodity.speciesInfo?.commonName})</p>
                    <p><strong>Net Weight:</strong> {commodity.goodsMeasure?.netWeight}</p>
                    <p><strong>Volume:</strong> {commodity.goodsMeasure?.volume}</p>
                    <p><strong>Supplementary Unit:</strong> {commodity.goodsMeasure?.supplementaryUnit}</p>
                    <p><strong>Qualifier:</strong> {commodity.goodsMeasure?.supplementaryUnitQualifier}</p>

                    {Array.isArray(commodity.producers) && commodity.producers.length > 0 && (
                        <div>
                            <strong>Producers:</strong>
                            <ul className="list-disc pl-5">
                                {commodity.producers.map((p, i) => (
                                    <li key={i}>
                                        {p.country} – GeoJSON: {p.geometryGeojson?.slice(0, 30)}...
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* ✅ Internal Ref statements list */}
            {Array.isArray(data.statements) && (
                <div>
                    <h4 className="font-semibold">Statements related to the Internal Reference</h4>
                    <ul className="divide-y divide-gray-200">
                        {data.statements.map((item, index) => (
                            <li key={index} className="py-2">
                                <p><strong>Identifier:</strong> {item.identifier}</p>
                                <p><strong>Internal Ref:</strong> {item.internalReferenceNumber}</p>
                                {item.referenceNumber && <p><strong>Reference Number:</strong> {item.referenceNumber}</p>}
                                {item.verificationNumber && <p><strong>Verification Code:</strong> {item.verificationNumber}</p>}
                                <p><strong>Status:</strong> {item.status}</p>
                                <p><strong>Date:</strong> {new Date(item.date).toLocaleString()}</p>
                                <p><strong>Updated By:</strong> {item.updatedBy}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ✅ PDF preview */}
            {showPreview && referenceNumber && verificationCode && data?.remote_data && (
                <div className="mt-6 border rounded-lg p-4 bg-white shadow">
                    <h4 className="text-lg font-semibold mb-2">Due Diligence Statement (preview)</h4>
                    <div ref={ddsRef}>
                        <DueDiligenceStatement
                            activity_type={data.remote_data.activityType || ''}
                            border_cross_country={data.local_data?.border_cross_country || ''}
                            hs_heading={commodity.hsHeading || ''}
                            goods={commodity.descriptionOfGoods || ''}
                            Volume={commodity.goodsMeasure?.volume || ''}
                            net_weight={commodity.goodsMeasure?.netWeight || ''}
                            scientifi_name={commodity.speciesInfo?.scientificName || ''}
                            common_name={commodity.speciesInfo?.commonName || ''}
                            s_unit={commodity.goodsMeasure?.supplementaryUnit || ''}
                            q_unit={commodity.goodsMeasure?.supplementaryUnitQualifier || ''}
                            verification_code={verificationCode}
                            producer_name={producer?.name || ''}
                            producer_country={producer?.country || ''}
                            place={data.remote_data.operator?.country || ''}
                            date={new Date(data.remote_data.statusDate || Date.now()).toLocaleDateString()}
                            referenceNumber={data.remote_data.referenceNumber || ''}
                            country_of_activity={data.remote_data.countryOfActivity || ''}
                            operator_country={data.remote_data.operator?.country || ''}
                        />
                    </div>
                    <button
                        onClick={handleDownload}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Download PDF
                    </button>
                </div>
            )}


            {/* ✅ Debug JSON */}
            <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 underline">See JSON</summary>
                <pre className="bg-white p-2 mt-2 rounded border text-xs overflow-x-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default SoapResponseDisplay;

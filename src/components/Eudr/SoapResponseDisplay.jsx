import React, { useRef } from "react";
import DueDiligenceStatement from './DueDiligenceStatement';
import { generatePdfBlob } from '../Guest/utils/pdfUtils.js';

const SoapResponseDisplay = ({ data, referenceNumber, verificationCode }) => {
    const ddsRef = useRef(null);

    const handleDownload = async () => {
        if (!ddsRef.current) return;
        const blob = await generatePdfBlob(ddsRef, `DDS_${referenceNumber}`);
        if (blob) {
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

    console.log("data", data);
    if (!data) {
        return <p className="text-gray-500 italic">Aucune donnée affichée pour le moment.</p>;
    }

    if (data.error) {
        return <div className="text-red-600 font-semibold">{data.error}</div>;
    }

    return (
        <div className="space-y-2 text-sm text-gray-800">
            {/* ✅ Submit */}
            {data.ddsIdentifier && (
                <div>
                    <strong>DDS Identifier:</strong> {data.ddsIdentifier}
                </div>
            )}

            {/* ✅ Amend */}
            {data.amendStatus && (
                <div className="text-green-700 font-medium">
                    ✅ Amendment successfully completed. <br />
                    <strong>Status:</strong> {data.amendStatus}
                </div>
            )}

            {/* ✅ Get by DDS ID */}
            {data.identifier && (
                <div>
                    <p><strong>Identifier:</strong> {data.identifier}</p>
                    <p><strong>Internal Reference:</strong> {data.internalReferenceNumber}</p>
                    <p><strong>Reference Number:</strong> {data.referenceNumber}</p>
                    <p><strong>Verification Code:</strong> {data.verificationNumber}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Date:</strong> {new Date(data.date).toLocaleString()}</p>
                    <p><strong>Updated By:</strong> {data.updatedBy}</p>
                </div>
            )}

            {/* ✅ Submission Date (submit) */}
            {data.submissionDate && (
                <div>
                    <strong>Submission Date:</strong>{" "}
                    {new Date(data.submissionDate).toLocaleString()}
                </div>
            )}

            {/* ✅ Producers */}
            {Array.isArray(data?.statement?.producers) && (
                <div>
                    <strong>Producers:</strong>
                    <ul className="list-disc pl-5">
                        {data.statement.producers.map((producer, index) => (
                            <li key={index}>
                                {producer.name} ({producer.country})
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ✅ Verify info */}
            {data.referenceNumber && data.activityType && (
                <div>
                    <p><strong>Reference Number:</strong> {data.referenceNumber}</p>
                    <p><strong>Activity Type:</strong> {data.activityType}</p>
                    <p><strong>Status:</strong> {data.status}</p>
                    <p><strong>Status Date:</strong> {new Date(data.statusDate).toLocaleString()}</p>
                    <p><strong>Operator:</strong> {data.operatorName} ({data.operatorCountry})</p>
                    <p><strong>Description of Goods:</strong> {data.descriptionOfGoods}</p>
                    <p><strong>Net Weight:</strong> {data.netWeight}</p>
                    <p><strong>Supplementary Unit:</strong> {data.supplementaryUnit}</p>
                    <p><strong>Qualifier:</strong> {data.supplementaryUnitQualifier}</p>
                    <p><strong>HS Heading:</strong> {data.hsHeading}</p>
                    <p><strong>Species:</strong> {data.scientificName} ({data.commonName})</p>
                </div>
            )}

            {/* ✅ Internal Ref: Liste des déclarations */}
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

            {/* ✅ DDS Statement intégré */}
            {referenceNumber && verificationCode && (
                <div className="mt-6 border rounded-lg p-4 bg-white shadow">
                        <h4 className="text-lg font-semibold mb-2">Due Diligence Statement (preview)</h4>
                    <div ref={ddsRef}>
                        <DueDiligenceStatement
                            activity_type={data.activityType}
                            border_cross_country={data.borderCrossCountry}
                            hs_heading={data.hsHeading}
                            goods={data.descriptionOfGoods}
                            Volume={data.volume}
                            net_weight={data.netWeight}
                            scientifi_name={data.scientificName}
                            common_name={data.commonName}
                            s_unit={data.supplementaryUnit}
                            q_unit={data.supplementaryUnitQualifier}
                            verification_code={verificationCode}
                            producer_name={data.producers?.[0]?.name || ''}
                            producer_country={data.producers?.[0]?.country || ''}
                            place={data.operatorPlace || data.operatorCountry || ''}
                            date={new Date(data.statusDate || data.date).toLocaleDateString()}
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

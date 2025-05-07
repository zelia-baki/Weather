import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';

const EUDRManager = () => {
  const [formData, setFormData] = useState({
    internalReferenceNumber: '',
    activityType: '',
    borderCrossCountry: '',
    comment: '',
    descriptionOfGoods: '',
    hsHeading: '',
    geoLocationConfidential: false,
    goodsMeasure: {
      volume: '',
      netWeight: '',
      supplementaryUnit: '',
      supplementaryUnitQualifier: ''
    },
    speciesInfo: {
      scientificName: '',
      commonName: ''
    },
    producers: [{
      country: '',
      name: ''
    }]

  });

  const [geojson, setGeojson] = useState('');
  const [ddsIdentifier, setDdsIdentifier] = useState('');
  const [referenceCheck, setReferenceCheck] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [responseData, setResponseData] = useState(null);
  const activityTypes = ["DOMESTIC", "TRADE", "IMPORT", "EXPORT"];
  const countries = [
    "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR",
    "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL",
    "PT", "RO", "SE", "SI", "SK", "XI"
  ];
  const qualifiers = [
    "ASV", "ASVX", "CCT", "CEN", "CTM", "DAP", "DHS", "DTN", "DTNE", "DTNF",
    "DTNG", "DTNL", "DTNM", "DTNR", "DTNS", "DTNZ", "ENP", "EUR", "GFI", "GRM",
    "GRT", "HLT", "HMT", "KAC", "KCC", "KCL", "KGM", "KGMA", "KGME", "KGMG",
    "KGMP", "KGMS", "KGMT", "KLT", "KMA", "KMT", "KNI", "KNS", "KPH", "KPO",
    "KPP", "KSD", "KSH", "KUR", "LPA", "LTR", "LTRA", "MIL", "MPR", "MTK",
    "MTQ", "MTQC", "MTR", "MWH", "NAR", "NARB", "NCL", "NPR", "TJO", "TNE",
    "TNEE", "TNEI", "TNEJ", "TNEK", "TNEM", "TNER", "TNEZ", "WAT"];


  const handleChange = (e) => {
    const { name, value } = e.target;

    // Champs de type producers.quelquechose (tableau index 0)
    if (name.startsWith("producers.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        producers: [
          {
            ...prev.producers[0],
            [field]: field === "country" ? value.toUpperCase() : value
          }
        ]
      }));
      return;
    }

    // Champs imbriqués comme goodsMeasure.volume ou speciesInfo.commonName
    if (name.includes(".")) {
      const [group, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value
        }
      }));
    } else {
      // Champs simples
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleSubmit = async () => {
    let parsedGeojson;
    try {
      parsedGeojson = JSON.parse(geojson);
    } catch (error) {
      setResponseData({ error: "GeoJSON is not valid JSON." });
      return;
    }

    try {
      const res = await axiosInstance.post('/api/eudr/submit', {
        statement: formData,
        geojson: parsedGeojson
      });
      setResponseData(res.data);
    } catch (error) {
      setResponseData({ error: error.response?.data || error.message });
    }
  };



  const handleAmend = async () => {
    let parsedGeojson;
    try {
      parsedGeojson = JSON.parse(geojson);
    } catch (error) {
      setResponseData({ error: "GeoJSON is not valid JSON." });
      return;
    }

    try {
      const res = await axiosInstance.post('/api/eudr/amend', {
        statement: formData,
        geojson: parsedGeojson,
        ddsIdentifier
      });
      setResponseData(res.data);
    } catch (error) {
      setResponseData({ error: error.response?.data || error.message });
    }
  };



  const handleRetract = async () => {
    const res = await axiosInstance.delete(`/api/eudr/retract/${ddsIdentifier}`);
    setResponseData(res.data);
  };

  const handleGetByInternalRef = async () => {
    const res = await axiosInstance.get(`/api/eudr/info/by-internal-ref/${formData.internalReferenceNumber}`);
    setResponseData(res.data);
  };

  const handleGetByDdsId = async () => {
    const res = await axiosInstance.get(`/api/eudr/info/by-dds-id/${ddsIdentifier}`);
    setResponseData(res.data);
  };

  const handleGetByRefAndVerification = async () => {
    const res = await axiosInstance.post('/api/eudr/info/by-ref-verification', {
      reference: referenceCheck,
      verification: verificationCode
    });
    setResponseData(res.data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-screen p-6">
      {/* Formulaire (colonne gauche) */}
      <div className="bg-white p-6 rounded-xl shadow space-y-6 h-full overflow-auto">
      
          <h2 className="text-2xl font-bold">EUDR Statement Manager</h2>

          <div className="grid grid-cols-2 gap-4">
            <input className="border p-2 rounded" name="internalReferenceNumber" placeholder="Internal Reference Number" onChange={handleChange} />
            <select
              className="border p-2 rounded"
              name="activityType"
              onChange={handleChange}
            >
              <option value="">Select Activity Type</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              name="borderCrossCountry"
              onChange={handleChange}
            >
              <option value="">Select Border Cross Country</option>
              {countries.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input className="border p-2 rounded" name="comment" placeholder="Comment" onChange={handleChange} />
            <input className="border p-2 rounded" name="descriptionOfGoods" placeholder="Description of Goods" onChange={handleChange} />
            <input
              type="text"
              pattern="[0-9]{2,8}"
              title="Enter 2 to 8 digits"
              className="border p-2 rounded"
              name="hsHeading"
              placeholder="HS Heading"
              onChange={handleChange}
            />

            <input
              type="number"
              step="any"
              min="0"
              className="border p-2 rounded"
              name="goodsMeasure.volume"
              placeholder="Volume"
              onChange={handleChange}
            />

            <input
              type="number"
              step="any"
              min="0"
              className="border p-2 rounded"
              name="goodsMeasure.netWeight"
              placeholder="Net Weight"
              onChange={handleChange}
            />

            <input
              type="number"
              step="1"
              min="0"
              className="border p-2 rounded"
              name="goodsMeasure.supplementaryUnit"
              placeholder="Supplementary Unit"
              onChange={handleChange}
            />
            <select
              className="border p-2 rounded"
              name="goodsMeasure.supplementaryUnitQualifier"
              onChange={handleChange}
            >
              <option value="">Select Qualifier</option>
              {qualifiers.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
            <input className="border p-2 rounded" name="speciesInfo.scientificName" placeholder="Scientific Name" onChange={handleChange} />
            <input className="border p-2 rounded" name="speciesInfo.commonName" placeholder="Common Name" onChange={handleChange} />
            <input
              type="text"
              pattern="[a-zA-Z]{2}"
              title="Enter exactly 2 letters (e.g., FR, US)"
              className="border p-2 rounded invalid:border-red-500"
              name="producers.country"
              placeholder="Producer Country"
              onChange={handleChange}
              required
            />


            <input className="border p-2 rounded" name="producers.name" placeholder="Producer Name" onChange={handleChange} />
          </div>

          <textarea
            className="w-full border p-2 rounded"
            rows="4"
            placeholder="GeoJSON"
            value={geojson}
            onChange={(e) => setGeojson(e.target.value)}
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.geoLocationConfidential}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  geoLocationConfidential: !prev.geoLocationConfidential
                }))
              }
            />
            <span>Geo Location Confidential</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={handleSubmit}>Submit</button>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700" onClick={handleAmend}>Amend</button>
            <input className="border p-2 rounded" placeholder="DDS Identifier" value={ddsIdentifier} onChange={(e) => setDdsIdentifier(e.target.value)} />
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={handleRetract}>Retract</button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700" onClick={handleGetByInternalRef}>Get by Internal Ref</button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700" onClick={handleGetByDdsId}>Get by DDS ID</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input className="border p-2 rounded" placeholder="Reference" value={referenceCheck} onChange={(e) => setReferenceCheck(e.target.value)} />
            <input className="border p-2 rounded" placeholder="Verification Code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 col-span-2" onClick={handleGetByRefAndVerification}>Verify</button>
          </div>

          {responseData && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          )}
        {/* </div> */}
      </div>
      <div className="bg-gray-50 p-6 rounded-xl shadow space-y-4 h-full overflow-auto">
        <h3 className="text-xl font-semibold text-gray-800">Résultat</h3>

        {responseData ? (
          responseData.error ? (
            <div className="text-red-600 font-semibold">{responseData.error}</div>
          ) : (
            <div className="space-y-2 text-sm text-gray-800">
              {/* Exemple de données extraites */}
              {responseData.ddsIdentifier && (
                <div><strong>DDS Identifier:</strong> {responseData.ddsIdentifier}</div>
              )}
              {responseData.status && (
                <div><strong>Status:</strong> {responseData.status}</div>
              )}
              {responseData.submissionDate && (
                <div><strong>Submission Date:</strong> {new Date(responseData.submissionDate).toLocaleString()}</div>
              )}
              {/* Affichage des producteurs si disponibles */}
              {Array.isArray(responseData?.statement?.producers) && (
                <div>
                  <strong>Producers:</strong>
                  <ul className="list-disc pl-5">
                    {responseData.statement.producers.map((producer, index) => (
                      <li key={index}>
                        {producer.name} ({producer.country})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Affichage JSON brut pour debug */}
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 underline">Voir JSON complet</summary>
                <pre className="bg-white p-2 mt-2 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              </details>
            </div>
          )
        ) : (
          <p className="text-gray-500 italic">Aucune donnée affichée pour le moment.</p>
        )}
      </div>
    </div>
  );
};

export default EUDRManager;

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
    producers: {
      country: '',
      name: ''
    }
  });

  const [geojson, setGeojson] = useState('');
  const [ddsIdentifier, setDdsIdentifier] = useState('');
  const [referenceCheck, setReferenceCheck] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [responseData, setResponseData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [group, field] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [field]: value
        }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async () => {
    const res = await axiosInstance.post('/api/eudr/submit', {
      statement: formData,
      geojson
    });
    setResponseData(res.data);
  };

  const handleAmend = async () => {
    const res = await axiosInstance.post('/api/eudr/amend', {
      statement: formData,
      geojson,
      ddsIdentifier
    });
    setResponseData(res.data);
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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow space-y-6">
      <h2 className="text-2xl font-bold">EUDR Statement Manager</h2>

      <div className="grid grid-cols-2 gap-4">
        <input className="border p-2 rounded" name="internalReferenceNumber" placeholder="Internal Reference Number" onChange={handleChange} />
        <input className="border p-2 rounded" name="activityType" placeholder="Activity Type" onChange={handleChange} />
        <input className="border p-2 rounded" name="borderCrossCountry" placeholder="Border Cross Country" onChange={handleChange} />
        <input className="border p-2 rounded" name="comment" placeholder="Comment" onChange={handleChange} />
        <input className="border p-2 rounded" name="descriptionOfGoods" placeholder="Description of Goods" onChange={handleChange} />
        <input className="border p-2 rounded" name="hsHeading" placeholder="HS Heading" onChange={handleChange} />
        <input className="border p-2 rounded" name="goodsMeasure.volume" placeholder="Volume" onChange={handleChange} />
        <input className="border p-2 rounded" name="goodsMeasure.netWeight" placeholder="Net Weight" onChange={handleChange} />
        <input className="border p-2 rounded" name="goodsMeasure.supplementaryUnit" placeholder="Supplementary Unit" onChange={handleChange} />
        <input className="border p-2 rounded" name="goodsMeasure.supplementaryUnitQualifier" placeholder="Qualifier" onChange={handleChange} />
        <input className="border p-2 rounded" name="speciesInfo.scientificName" placeholder="Scientific Name" onChange={handleChange} />
        <input className="border p-2 rounded" name="speciesInfo.commonName" placeholder="Common Name" onChange={handleChange} />
        <input className="border p-2 rounded" name="producers.country" placeholder="Producer Country" onChange={handleChange} />
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
    </div>
  );
};

export default EUDRManager;

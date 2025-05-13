import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import SoapResponseDisplay from "./SoapResponseDisplay";

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
    }],
    operator: {
      identifierType: '',
      identifierValue: '',
      name: '',
      country: '',
      address: '',
      email: '',
      phone: ''
    },
    countryOfActivity: ''
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

  const identifierTypes = [
    "eori", "vat", "cin", "duns", "comp_reg", "comp_num",
    "cbr", "ship_man_comp_imo", "ship_reg_owner_imo", "remos", "gln", "tin"
  ];

  const [Allcountries, setAllCountries] = useState([]);
  useEffect(() => {

    fetchAllCountries();
  }, []);

  const fetchAllCountries = async () => {
    try {
      const response = await axiosInstance.get('/api/pays/');
      setAllCountries(response.data.pays || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };
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
        ddsIdentifier: ddsIdentifier,
      });

      setResponseData(res.data); // plus besoin de parser
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
    try {
      const res = await axiosInstance.get(`/api/eudr/info/by-dds-id/${ddsIdentifier}`);
      setResponseData(res.data); // plus besoin de parser
    } catch (error) {
      setResponseData({ error: error.response?.data || error.message });
    }
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

        <h2 className="text-2xl font-bold">Due Diligence Statements</h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            name="internalReferenceNumber"
            placeholder="Internal Reference Number"
            onChange={handleChange}
            value={formData.internalReferenceNumber}
          />

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
          <select
            className="border p-2 rounded invalid:border-red-500"
            name="producers.country"
            onChange={handleChange}
            required>
            <option value="">Select producer Country</option>
            {Allcountries.map(country => (
              <option key={country.id} value={country.alpha2}>
                {country.nom_en_gb}
              </option>
            ))}
          </select>



          <input className="border p-2 rounded" name="producers.name" placeholder="Producer Name" onChange={handleChange} />

        </div>
        <h3 className="text-lg font-semibold">Operator Info</h3>
        <select
          className="border p-2 rounded"
          name="operator.identifierType"
          onChange={handleChange}
          value={formData.operator.identifierType}
        >
          <option value="">Select Identifier Type</option>
          {identifierTypes.map((type) => (
            <option key={type} value={type}>
              {type.toUpperCase()}
            </option>
          ))}
        </select>
        <input className="border p-2 rounded" name="operator.identifierValue" placeholder="Identifier Value" onChange={handleChange} />
        <input className="border p-2 rounded" name="operator.name" placeholder="Operator Name" onChange={handleChange} />
        <select
          className="border p-2 rounded"
          name="operator.country"
          onChange={handleChange}
          value={formData.operator.country}
        >
          <option value="">Select Country</option>
          {Allcountries.map(country => (
            <option key={country.id} value={country.alpha2}>
              {country.nom_en_gb}
            </option>
          ))}
        </select>
        <input className="border p-2 rounded" name="operator.address" placeholder="Operator Address" onChange={handleChange} />
        <input
          className="border p-2 rounded"
          name="operator.email"
          placeholder="Operator Email"
          type="email"
          required
          onChange={handleChange}
          value={formData.operator.email}
        />
        <input
          className="border p-2 rounded"
          name="operator.phone"
          placeholder="Phone Number"
          type="tel"
          pattern="(\+\d{1,3}\s?)?(\(\d{3}\)|\d{3})[-\s]?\d{3}[-\s]?\d{4}"
          title="Phone format: +123 123-456-7890 or (123) 456-7890"
          onChange={handleChange}
          value={formData.operator.phone}
        />
        <select
          className="border p-2 rounded"
          name="countryOfActivity"
          onChange={handleChange}
          value={formData.countryOfActivity}
        >
          <option value="">Select Country of Activity</option>
          {countries.map(code => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>



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
        <SoapResponseDisplay data={responseData} />
      </div>
    </div>
  );
};

export default EUDRManager;

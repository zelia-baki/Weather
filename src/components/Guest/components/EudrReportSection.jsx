import React, { useEffect, useState } from "react";
import { renderEudrTable, generateMapboxUrl } from '../utils/reportUtils';
import parrot from '../../img/parrot.jpg';

// ✅ EN HAUT DU FICHIER
import * as turf from '@turf/turf';


const EudrReportSection = ({ results, reportRef }) => {
  const [coverExtentDecileData, setCoverExtentDecileData] = useState({
    nonZeroValues: [],
    nonZeroCount: 0,
    percentageCoverExtent: 0,
    valueCountArray: []
  });

  const [resultStatus, setResultStatus] = useState({
    protectedStatus: {
      counts: {},
      percentages: {}
    },
    indigenousStatus: ''
  });

  const [areaInSquareMeters, setAreaInSquareMeters] = useState(null);
  const [areaInHectares, setAreaInHectares] = useState(null);
  const [tscDriverDriver, setTscDriverDriver] = useState({
    mostCommonValue: '',
    frequencyCounts: ''
  });

  const [geoData, setGeoData] = useState({});
  const coordinates = results["jrc global forest cover"]?.[0]?.coordinates?.[0];



  useEffect(() => {
    if (!results || Object.keys(results).length < 2) return;
    setGeoData(results);

    // ===== 1. TREE COVER EXTENT =====
    const coverDataArray = results["jrc global forest cover"];
    let dataFieldsCoverExtent = [];

    if (Array.isArray(coverDataArray)) {
      const coverItem = coverDataArray.find(item => item.pixel === "wri_tropical_tree_cover_extent__decile");
      dataFieldsCoverExtent = coverItem?.data_fields || [];
    }

    const nonZeroValues = [];
    let nonZeroCount = 0;
    const valueCounts = {};

    dataFieldsCoverExtent.forEach((field) => {
      const decile = field?.wri_tropical_tree_cover_extent__decile;
      if (decile && decile !== 0) {
        nonZeroValues.push(decile);
        nonZeroCount++;
        valueCounts[decile] = (valueCounts[decile] || 0) + 1;
      }
    });

    const totalCount = dataFieldsCoverExtent.length;
    const percentageCoverExtent = totalCount > 0 ? (nonZeroCount / totalCount) * 100 : 0;
    const valueCountArray = Object.entries(valueCounts).map(([key, count]) => ({
      value: Number(key),
      count
    }));

    setCoverExtentDecileData({
      nonZeroValues,
      nonZeroCount,
      percentageCoverExtent,
      valueCountArray
    });

    // ===== 2. TREE COVER LOSS DRIVERS =====
    const driverItem = results["tsc tree cover loss drivers"]
      ?.find(item => item.pixel === "tsc_tree_cover_loss_drivers__driver");

    const driverData = driverItem?.data_fields;
    let frequencyCounts = {};
    let mostCommonValue = null;

    if (Array.isArray(driverData)) {
      driverData.forEach((field) => {
        const value = field?.tsc_tree_cover_loss_drivers__driver;
        if (value) {
          frequencyCounts[value] = (frequencyCounts[value] || 0) + 1;
        }
      });
    } else if (typeof driverData === "object") {
      const value = driverData?.tsc_tree_cover_loss_drivers__driver;
      if (value) frequencyCounts[value] = 1;
    }

    for (const [value, count] of Object.entries(frequencyCounts)) {
      if (!mostCommonValue || count > frequencyCounts[mostCommonValue]) {
        mostCommonValue = value;
      }
    }

    setTscDriverDriver({ mostCommonValue, frequencyCounts });

    // ===== 3. COVER LOSS =====
    const coverLoss = results["tree cover loss"]?.[0]?.data_fields?.area__ha || 0;

    // ===== 4. PROTECTED AREA =====
    let protectedAreas = [];
    if (Array.isArray(results?.["soil carbon"])) {
      const protectedItem = results["soil carbon"]
        .find(item => item.pixel === "wdpa_protected_areas__iucn_cat");

      protectedAreas = protectedItem?.data_fields || [];
    }

    const protectedCounts = {};
    protectedAreas.forEach((field) => {
      const value = field?.wdpa_protected_areas__iucn_cat ?? "Unknown";
      protectedCounts[value] = (protectedCounts[value] || 0) + 1;
    });

    const totalProtected = protectedAreas.length;
    const percentages = {};

    if (totalProtected > 0) {
      Object.entries(protectedCounts).forEach(([key, count]) => {
        percentages[key] = ((count / totalProtected) * 100).toFixed(2) + "%";
      });
    } else {
      percentages["No Data"] = "0%";
    }

    const envResults = {
      protectedStatus: {
        counts: protectedCounts,
        percentages
      }
    };

    // ===== 5. INDIGENOUS LAND =====
    if (coverLoss === 0) {
      const landData = results["landmark indigenous and community lands"]?.[0]?.data_fields || [];

      if (!Array.isArray(landData) || landData.length === 0) {
        envResults.indigenousStatus = "Not known, land is not gazetted";
      } else if (landData.some(v => v === 1)) {
        envResults.indigenousStatus = "Presence of indigenous and community lands";
      } else {
        envResults.indigenousStatus = "No presence of indigenous and community lands";
      }
    }

    setResultStatus(envResults);

    // ===== 6. AREA =====
    const coords = results["jrc global forest cover"]?.[0]?.coordinates?.[0];
    if (coords) {
      const polygon = turf.polygon([coords]);
      const areaSqM = turf.area(polygon);
      setAreaInSquareMeters(areaSqM);
      setAreaInHectares(areaSqM / 10000);
    }

  }, [results]);

  return (
    <div ref={reportRef} className="carbon-report-a4">
      {/* HEADER */}
      <div className="report-header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Parrot section */}
        <div style={{ width: '120px', height: '120px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div className="bg-white rounded-full ">
            <img
              src={parrot}
              alt="Parrot"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
        </div>

        {/* Header titles */}
        <div className="report-header" style={{ textAlign: 'center' }}>
          <h1>NKUSU / AGRIYIELDS REPORT</h1>
          <h2>EUDR COMPLIANCE REPORT</h2>
          <p className="subtitle">
            Report generated based on the Regulation (EU) 2023/1115 on deforestation-free products.
          </p>
        </div>

        {/* Logo */}
        <img src="/logo.jpg" alt="Logo" className="report-logo" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
      </div>



      <div className="report-body">
        <p>This report provides a compliance assessment under the EU Regulation 2023/1115.</p>
        <div className="report-body">
          <p>
            This report provides a compliance assessment under the European Union Regulation 2023/1115,
            which governs the import and export of products associated with deforestation and degradation.
          </p>

          <div className="report-section">
            <h4>1. RADD Alert (EUDR Article 2)</h4>
            <p>applicable to most parts of Uganda, only parts of Lake Albert region neighbouring DRCongo</p>
          </div>

          <div className="report-section">
            <h4>2. Tree Cover Loss (EUDR, Article 2):</h4>
            <div className="text-gray-700">
              Area in which Tree loss was identified since Dec 2020:
              <ul className="list-inside list-disc text-gray-700">
                <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
                <li><strong>non Zero </strong> Plot/Farm likely non compliant with EUDR Law.</li>
              </ul>
            </div>
          </div>

          <div className="report-section">
            <h4>3. Forest Cover (EUDR, Article 2):</h4>
            <div className="text-gray-700">
              EU joint Research Centre Geostore for checking existence or not of forest cover as of 2020
              <ul className="list-inside list-disc text-gray-700">
                <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
                <li><strong>non Zero </strong> = Farm likely non compliant with EUDR Law.</li>
              </ul>
            </div>
          </div>

          <div className="report-section">
            <h4>4. Tree Cover Extent (EUDR, Article 2):</h4>
            <p className="text-gray-700">
              Analysis of tree cover, expressed in deciles (ranging from <strong>0-100</strong>), to evaluate forest coverage.
            </p>
          </div>

          <div className="report-section">
            <h4>5. Tree Cover Loss Drivers (EUDR Article 10):</h4>
            <p>
              Identifies the primary causes of deforestation or degradation.
            </p>
          </div>

          <div className="report-section">
            <h4>6. Protected Area (EUDR Article 10):</h4>
            <p>
              Indicates if the plot is located in a gazetted protected area (national park, wetland, etc.).
            </p>
          </div>

          <div className="report-section">
            <h4>7. indigenous and community lands (EUDR Article 10):</h4>
            <p>
              Determines whether the land overlaps with recognized indigenous or community land.
            </p>
          </div>
          {/* Compliance Table */}
          <div className="html2pdf__page-break"></div>


          <div className="report-section">
            <h4>Summary Compliance Table</h4>
            {renderEudrTable({
              geoData,
              areaInSquareMeters,
              areaInHectares,
              resultStatus,
              coverExtentDecileData,
              tscDriverDriver
            })}
          </div>
          {/* MAP */}
          {coordinates && (
            <div className="report-section">
              <h4>Plot Map</h4>
              <img
                src={generateMapboxUrl(coordinates)}
                alt="Map"
                className="report-map"
              />
            </div>
          )}

          {/* Full data fields */}
        </div>
      </div>

      <div className="report-footer">
        © 2025 Agriyields. Contact: nkusu@agriyields.com
      </div>
    </div>
  );
};

export default EudrReportSection;

import React, { useEffect, useState } from "react";
import { renderEudrTable, generateMapboxUrl } from '../utils/reportUtils';
import parrot from '../../img/parrotlogo.svg';
import * as turf from '@turf/turf';

const EudrReportSection = ({ results, reportRef, farmInfo }) => {
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
  const [isJrcGlobalForestCover, setIsJrcGlobalForestCover] = useState(null);
  const [geoData, setGeoData] = useState({});

  const coordinates = results["jrc global forest cover"]?.[0]?.coordinates?.[0];

  useEffect(() => {
    if (!results || typeof results !== 'object' || Object.keys(results).length === 0) return;

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
    if (coords && Array.isArray(coords) && coords.length >= 3) {
      const first = coords[0];
      const last = coords[coords.length - 1];
      const closedCoords = (first[0] !== last[0] || first[1] !== last[1])
        ? [...coords, first]
        : coords;

      try {
        const polygon = turf.polygon([closedCoords]);
        const areaSqM = turf.area(polygon);
        setAreaInSquareMeters(areaSqM);
        setAreaInHectares(areaSqM / 10000);
      } catch (e) {
        console.error("❌ Turf error on polygon:", e);
      }
    }

    // ===== 7. JRC GLOBAL FOREST COVER STATUS =====
    const jrcData = results["jrc global forest cover"]
      ?.find(item => item.pixel === "is__jrc_global_forest_cover")?.data_fields || [];

    if (Array.isArray(jrcData) && jrcData.length > 0) {
      let counts = { 0: 0, 1: 0, other: 0 };

      jrcData.forEach(field => {
        const value = field?.is__jrc_global_forest_cover;
        if (value === 0) counts[0]++;
        else if (value === 1) counts[1]++;
        else counts.other++;
      });

      if (counts[1] > counts[0] && counts[1] > counts.other) {
        setIsJrcGlobalForestCover(" Presence of Forest cover detected: Majority of forest pixels are 1");
      } else if (counts[0] > counts[1] && counts[0] > counts.other) {
        setIsJrcGlobalForestCover("no forest cover detected: Majority are 0");
      } else {
        setIsJrcGlobalForestCover("Mixed or Unknown classification");
      }
    } else {
      setIsJrcGlobalForestCover("Data not available");
    }

  }, [results]);

return (
  <div ref={reportRef} className="carbon-report-a4 w-full h-full m-0 p-0 bg-white text-gray-900 font-sans leading-relaxed space-y-8">

    {/* HEADER */}
    <div className="flex items-center justify-between border-b-4 border-green-700 pb-6 px-8 pt-8">
      {/* Colonne gauche : Parrot */}
      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm">
        <img
          src="https://www.nkusu.com/parrotlogo.png"
          alt="Parrot"
          className="object-contain w-full h-full rounded-md"
        />
      </div>

      {/* Colonne centre : Titre */}
      <div className="flex-1 text-center px-4">
        <h2 className="text-3xl font-bold text-green-800 mb-1">EUDR COMPLIANCE REPORT</h2>
        <p className="text-sm text-gray-600">
          Report generated based on the Regulation (EU) 2023/1115 on deforestation-free products.
        </p>
      </div>

      {/* Colonne droite : Logo */}
      <div className="w-24 h-24 flex justify-end">
        <img
          src="https://www.nkusu.com/logo.jpg"
          alt="Logo"
          className="object-contain w-full h-full rounded-md shadow-sm"
        />
      </div>
    </div>

    {farmInfo && (
      <p className="px-8 py-2 bg-gray-100 rounded-none border-y border-gray-300 text-sm shadow-inner">
        This report provides an overview of Farm ID <strong>{farmInfo.farm_id}</strong>, owned by <strong>{farmInfo.name}</strong>,
        located in <strong>{farmInfo.subcounty}</strong>, {farmInfo.district_name}. The farm is a member of the {farmInfo.subcounty} and plays a significant role in the local agricultural landscape.
        With geolocation coordinates <strong>{farmInfo.geolocation}</strong>,
        {farmInfo.crops && farmInfo.crops.length > 0 ? (
          <>
            the farm specializes in <strong>{farmInfo.crops[0].crop}</strong> and operates within a region characterized by Landtype: <strong>{farmInfo.crops[0].land_type}</strong>.
          </>
        ) : (
          <span> no specific crops mentioned.</span>
        )}
        This report outlines the farm's activities, challenges, and opportunities to support its continued growth and sustainability.
      </p>
    )}

    <div className="report-body space-y-6 bg-gray-50 px-8 py-0 shadow-none rounded-none">
      {/* <p>This report provides a compliance assessment under the EU Regulation 2023/1115.</p> */}

      <div className="space-y-6">
        <p>
          This report provides a compliance assessment under the European Union Regulation 2023/1115,
          which governs the import and export of products associated with deforestation and degradation.
        </p>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">1. RADD Alert (EUDR Article 2)</h4>
          <p>applicable to most parts of Uganda, only parts of Lake Albert region neighbouring DRCongo</p>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">2. Tree Cover Loss (EUDR, Article 2):</h4>
          <div className="text-gray-700">
            Area in which Tree loss was identified since Dec 2020:
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
              <li><strong>non Zero </strong> Plot/Farm likely non compliant with EUDR Law.</li>
            </ul>
          </div>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">3. Forest Cover (EUDR, Article 2):</h4>
          <div className="text-gray-700">
            EU joint Research Centre Geostore for checking existence or not of forest cover as of 2020
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
              <li><strong>non Zero </strong> = Farm likely non compliant with EUDR Law.</li>
            </ul>
          </div>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">4. Tree Cover Extent (EUDR, Article 2):</h4>
          <p className="text-gray-700">
            Analysis of tree cover, expressed in deciles (ranging from <strong>0-100</strong>), to evaluate forest coverage.
          </p>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">5. Tree Cover Loss Drivers (EUDR Article 10):</h4>
          <p>Identifies the primary causes of deforestation or degradation.</p>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">6. Protected Area (EUDR Article 10):</h4>
          <p>Indicates if the plot is located in a gazetted protected area (national park, wetland, etc.).</p>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">7. indigenous and community lands (EUDR Article 10):</h4>
          <p>Determines whether the land overlaps with recognized indigenous or community land.</p>
        </div>

        <div className="html2pdf__page-break"></div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">Summary Compliance Table</h4>
          {renderEudrTable({
            geoData,
            areaInSquareMeters,
            areaInHectares,
            resultStatus,
            coverExtentDecileData,
            tscDriverDriver,
            isJrcGlobalForestCover
          })}
        </div>

        <div className="html2pdf__page-break"></div>

        {coordinates && (
          <div className="report-section border-l-4 border-green-700 pl-5 space-y-4">
            <h2 className="text-2xl font-bold text-green-800">Risk Assessment Breakdown</h2>
            <p>
              Analysis of deforestation drivers shows significant influences from {tscDriverDriver?.mostCommonValue ? (
                <p>{tscDriverDriver?.mostCommonValue}</p>
              ) : (
                <p>Unknown Value</p>
              )}
            </p>
            <img
              src={generateMapboxUrl(coordinates)}
              alt="Map"
              className="report-map w-full rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>

    <div className="report-footer border-t-2 border-gray-300 px-8 pt-6 text-xs text-gray-500 text-center mt-10">
      © 2025 Agriyields. Contact: nkusu@agriyields.com
    </div>
  </div>
);


};

export default EudrReportSection;

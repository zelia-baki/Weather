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
    frequencyCounts: {}
  });
  const [isJrcGlobalForestCover, setIsJrcGlobalForestCover] = useState(null);
  const [geoData, setGeoData] = useState({});
  const [treeCoverLossArea, setTreeCoverLossArea] = useState(0);
  const [wriTropicalTreeCoverAvg, setWriTropicalTreeCoverAvg] = useState(0);
  const [raddAlertsArea, setRaddAlertsArea] = useState(0);
  
  // New state for compliance status
  const [complianceStatus, setComplianceStatus] = useState({
    status: '',
    statusColor: '',
    description: ''
  });

  // Extraction des coordonnées depuis le premier dataset disponible
  const coordinates = results["jrc global forest cover"]?.[0]?.coordinates?.[0] ||
                     results["tree cover loss"]?.[0]?.coordinates?.[0] ||
                     results["soil carbon"]?.[0]?.coordinates?.[0];

  // Function to determine compliance status
  const determineComplianceStatus = (treeCoverLoss, hasForestCover) => {
    const hasTreeCoverLoss = treeCoverLoss > 0;
    console.log(treeCoverLoss,hasForestCover);
    
    if (!hasTreeCoverLoss && !hasForestCover) {
      // Condition 1: 100% Compliance
      return {
        status: '100% Compliant',
        statusColor: 'text-green-600 bg-green-100',
        description: 'No tree cover loss detected and no forest cover detected. Fully compliant with EUDR regulations.'
      };
    } else if ((!hasTreeCoverLoss && hasForestCover) || (hasTreeCoverLoss && !hasForestCover)) {
      // Condition 2: Likely Compliant
      return {
        status: 'Likely Compliant',
        statusColor: 'text-yellow-600 bg-yellow-100',
        description: 'No tree cover loss detected but forest cover is present. Area shows good forest conservation practices.'
      };
    } else if (hasTreeCoverLoss) {
      // Condition 3: Not Compliant
      return {
        status: 'Not Compliant',
        statusColor: 'text-red-600 bg-red-100',
        description: 'Tree cover loss detected. This indicates potential deforestation activity that may violate EUDR regulations.'
      };
    } else {
      // Fallback
      return {
        status: 'Assessment Pending',
        statusColor: 'text-gray-600 bg-gray-100',
        description: 'Insufficient data to determine compliance status.'
      };
    }
  };

  useEffect(() => {
    if (!results || typeof results !== 'object' || Object.keys(results).length === 0) return;

    setGeoData(results);

    // ===== 1. TREE COVER EXTENT (Nouvelles données groupées) =====
    const tropicalTreeCoverExtentArray = results["wri tropical tree cover extent"];
    if (Array.isArray(tropicalTreeCoverExtentArray)) {
      // Trouver l'item avec les données groupées
      const groupedItem = tropicalTreeCoverExtentArray.find(item => 
        item.pixel?.includes("grouped by") && Array.isArray(item.data_fields)
      );

      if (groupedItem && Array.isArray(groupedItem.data_fields)) {
        const groupedData = groupedItem.data_fields;
        
        let nonZeroCount = 0;
        let totalCount = 0;
        const nonZeroValues = [];
        const valueCountArray = [];

        groupedData.forEach((field) => {
          const decile = field?.wri_tropical_tree_cover_extent__decile;
          const count = field?.count || 0;
          
          totalCount += count;
          
          if (decile && decile !== 0) {
            nonZeroCount += count;
            // Ajouter les valeurs selon leur count
            for (let i = 0; i < count; i++) {
              nonZeroValues.push(decile);
            }
          }
          
          valueCountArray.push({
            value: Number(decile),
            count: count
          });
        });

        const percentageCoverExtent = totalCount > 0 ? (nonZeroCount / totalCount) * 100 : 0;

        setCoverExtentDecileData({
          nonZeroValues,
          nonZeroCount,
          percentageCoverExtent,
          valueCountArray
        });
      }
    }

    // ===== 2. TREE COVER LOSS DRIVERS (Données déjà groupées) =====
    const driverArray = results["tsc tree cover loss drivers"];
    if (Array.isArray(driverArray) && driverArray.length > 0) {
      const driverItem = driverArray[0];
      const driverData = driverItem?.data_fields;

      let frequencyCounts = {};
      let mostCommonValue = null;
      let maxCount = 0;

      if (Array.isArray(driverData)) {
        driverData.forEach((field) => {
          const driver = field?.tsc_tree_cover_loss_drivers__driver;
          const count = field?.count || 1; // Si count n'existe pas, assume 1
          
          if (driver) {
            frequencyCounts[driver] = (frequencyCounts[driver] || 0) + count;
            
            if (frequencyCounts[driver] > maxCount) {
              maxCount = frequencyCounts[driver];
              mostCommonValue = driver;
            }
          }
        });
      } else if (typeof driverData === "object") {
        const driver = driverData?.tsc_tree_cover_loss_drivers__driver;
        if (driver) {
          frequencyCounts[driver] = 1;
          mostCommonValue = driver;
        }
      }

      setTscDriverDriver({ mostCommonValue, frequencyCounts });
    }

    // ===== 3. TREE COVER LOSS =====
    let calculatedTreeCoverLoss = 0;
    const coverLossArray = results["tree cover loss"];
    if (Array.isArray(coverLossArray) && coverLossArray.length > 0) {
      calculatedTreeCoverLoss = coverLossArray[0]?.data_fields?.area__ha || 0;
      setTreeCoverLossArea(calculatedTreeCoverLoss);
    }

    // ===== 4. PROTECTED AREAS (Nouvelles données groupées) =====
    const protectedArray = results["soil carbon"];
    if (Array.isArray(protectedArray) && protectedArray.length > 0) {
      const protectedItem = protectedArray[0];
      const protectedData = protectedItem?.data_fields;

      const protectedCounts = {};
      let totalProtected = 0;

      if (Array.isArray(protectedData)) {
        protectedData.forEach((field) => {
          const category = field?.wdpa_protected_areas__iucn_cat ?? "Unknown";
          const count = field?.count || 1;
          
          protectedCounts[category] = count;
          totalProtected += count;
        });
      }

      const percentages = {};
      if (totalProtected > 0) {
        Object.entries(protectedCounts).forEach(([key, count]) => {
          percentages[key] = ((count / totalProtected) * 100).toFixed(2) + "%";
        });
      } else {
        percentages["No Data"] = "0%";
      }

      setResultStatus(prev => ({
        ...prev,
        protectedStatus: {
          counts: protectedCounts,
          percentages
        }
      }));
    }

    // ===== 5. INDIGENOUS LANDS =====
    const indigenousArray = results["landmark indigenous and community lands"];
    if (Array.isArray(indigenousArray) && indigenousArray.length > 0) {
      const landData = indigenousArray[0]?.data_fields || [];

      let indigenousStatus;
      if (!Array.isArray(landData) || landData.length === 0) {
        indigenousStatus = "Not known, land is not gazetted";
      } else {
        // Adapter selon la nouvelle structure des données
        const hasIndigenousLand = landData.some(item => item?.name || item?.value === 1);
        indigenousStatus = hasIndigenousLand 
          ? "Presence of indigenous and community lands"
          : "No presence of indigenous and community lands";
      }

      setResultStatus(prev => ({
        ...prev,
        indigenousStatus
      }));
    }

    // ===== 6. AREA CALCULATION =====
    if (coordinates && Array.isArray(coordinates) && coordinates.length >= 3) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      const closedCoords = (first[0] !== last[0] || first[1] !== last[1])
        ? [...coordinates, first]
        : coordinates;

      try {
        const polygon = turf.polygon([closedCoords]);
        const areaSqM = turf.area(polygon);
        setAreaInSquareMeters(areaSqM);
        setAreaInHectares(areaSqM / 10000);
      } catch (e) {
        console.error("Turf error on polygon:", e);
      }
    }

    // ===== 7. JRC GLOBAL FOREST COVER =====
    let hasForestCover = false;
    const jrcArray = results["jrc global forest cover"];
    if (Array.isArray(jrcArray) && jrcArray.length > 0) {
      const jrcData = jrcArray[0]?.data_fields;
      
      // La nouvelle structure contient area__ha directement
      const forestAreaHa = jrcData?.area__ha || 0;
      console.log("Forest area ha",forestAreaHa);
      
      if (forestAreaHa > 0) {
        hasForestCover = true;
        setIsJrcGlobalForestCover(`Forest cover detected: ${forestAreaHa.toFixed(2)} hectares`);
      } else {
        hasForestCover = false;
        setIsJrcGlobalForestCover("No forest cover detected");
      }
    }

    // ===== 8. WRI TROPICAL TREE COVER AVERAGE =====
    const wriTropicalArray = results["wri tropical tree cover"];
    if (Array.isArray(wriTropicalArray) && wriTropicalArray.length > 0) {
      const avgCover = wriTropicalArray[0]?.data_fields?.avg_cover || 0;
      setWriTropicalTreeCoverAvg(avgCover);
    }

    // ===== 9. RADD ALERTS =====
    const raddArray = results["wur radd alerts"];
    if (Array.isArray(raddArray) && raddArray.length > 0) {
      const raddArea = raddArray[0]?.data_fields?.area__ha || 0;
      setRaddAlertsArea(raddArea);
    }

    // ===== 10. DETERMINE COMPLIANCE STATUS =====
    const compliance = determineComplianceStatus(calculatedTreeCoverLoss, hasForestCover);
    setComplianceStatus(compliance);

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

    {/* COMPLIANCE STATUS BANNER
    <div className={`mx-8 p-6 rounded-lg border-2 ${
      complianceStatus.status === '100% Compliant' ? 'border-green-500 bg-green-50' :
      complianceStatus.status === 'Likely Compliant' ? 'border-yellow-500 bg-yellow-50' :
      complianceStatus.status === 'Not Compliant' ? 'border-red-500 bg-red-50' :
      'border-gray-500 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-2xl font-bold ${
            complianceStatus.status === '100% Compliant' ? 'text-green-700' :
            complianceStatus.status === 'Likely Compliant' ? 'text-yellow-700' :
            complianceStatus.status === 'Not Compliant' ? 'text-red-700' :
            'text-gray-700'
          }`}>
            EUDR Compliance Status: {complianceStatus.status}
          </h3>
          <p className="text-gray-700 mt-2">{complianceStatus.description}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
          complianceStatus.status === '100% Compliant' ? 'bg-green-200 text-green-800' :
          complianceStatus.status === 'Likely Compliant' ? 'bg-yellow-200 text-yellow-800' :
          complianceStatus.status === 'Not Compliant' ? 'bg-red-200 text-red-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {complianceStatus.status}
        </div>
      </div>
    </div> */}

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

        {/* COMPLIANCE CONDITIONS EXPLANATION
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">EUDR Compliance Assessment Criteria</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-semibold text-green-800">100% Compliant</h5>
              <p className="text-sm text-green-700 mt-1">
                • No tree cover loss<br/>
                • No forest cover detected
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="font-semibold text-yellow-800">Likely Compliant</h5>
              <p className="text-sm text-yellow-700 mt-1">
                • No tree cover loss<br/>
                • Forest cover detected
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h5 className="font-semibold text-red-800">Not Compliant</h5>
              <p className="text-sm text-red-700 mt-1">
                • Tree cover loss detected<br/>
                • Forest cover detected (optional)
              </p>
            </div>
          </div>
        </div> */}

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">1. RADD Alert (EUDR Article 2)</h4>
          <p>applicable to most parts of Uganda, only parts of Lake Albert region neighbouring DRCongo</p>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">2. Tree Cover Loss (EUDR, Article 2):</h4>
          <div className="text-gray-700">
            Area in which Tree loss was identified since Dec 2020:
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li><strong>Zero:</strong> Plot/Farm is fully compliant with EUDR Law.</li>
              <li><strong>Non-Zero:</strong> Plot/Farm likely non compliant with EUDR Law.</li>
            </ul>
          </div>
        </div>

        <div className="report-section border-l-4 border-green-700 pl-5 space-y-2">
          <h4 className="text-xl font-semibold text-green-700">3. Forest Cover (EUDR, Article 2):</h4>
          <div className="text-gray-700">
            EU joint Research Centre Geostore for checking existence or not of forest cover as of 2020
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li><strong>None detected:</strong> Plot/Farm is fully compliant with EUDR Law.</li>
              <li><strong>Forest detected:</strong> Farm requires careful assessment for EUDR compliance.</li>
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
              isJrcGlobalForestCover,
              treeCoverLossArea,
              wriTropicalTreeCoverAvg,
              raddAlertsArea,
              complianceStatus // Pass compliance status to table
            })}
          </div>

          <div className="html2pdf__page-break"></div>

          {coordinates && (
            <div className="report-section border-l-4 border-green-700 pl-5 space-y-4">
              <h2 className="text-2xl font-bold text-green-800">Risk Assessment Breakdown</h2>
              <p>
                Analysis shows:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Area: {areaInHectares?.toFixed(2)} hectares</li>
                <li>Tree cover loss: {treeCoverLossArea} hectares</li>
                <li>Average tree cover: {wriTropicalTreeCoverAvg.toFixed(1)}%</li>
                <li>Primary deforestation driver: {tscDriverDriver?.mostCommonValue || "Unknown"}</li>
                <li>RADD alerts: {raddAlertsArea} hectares</li>
                <li><strong>Compliance Status: {complianceStatus.status}</strong></li>
              </ul>
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
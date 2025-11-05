import React, { useEffect, useState } from "react";
import { renderEudrTable, generateMapboxUrl } from '../utils/reportUtils';
import * as turf from '@turf/turf';
import StaticForestMap from '../../mapbox/StaticForestMap.jsx';
import axiosInstance from '../../../axiosInstance.jsx';

const EudrReportSection = ({ results, reportRef, farmInfo }) => {
  console.log(results["wri tropical tree cover extent"]?.[2]?.["data_fields"]);

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
  const [complianceStatus, setComplianceStatus] = useState({
    status: '',
    statusColor: '',
    description: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const rawTreeCoverData = results["wri tropical tree cover extent"]?.[2]?.["data_fields"];

  const TREE_COVER_DATA = React.useMemo(() => {
    if (!rawTreeCoverData || !Array.isArray(rawTreeCoverData)) {
      return [];
    }
    return rawTreeCoverData.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      wri_tropical_tree_cover_extent__decile: point.wri_tropical_tree_cover_extent__decile,
      tsc_tree_cover_loss_drivers__driver: point.tsc_tree_cover_loss_drivers__driver || 'Unknown'
    }));
  }, [rawTreeCoverData]);

  const TOKEN = 'pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q';

  const coordinates = results["jrc global forest cover"]?.[0]?.coordinates?.[0] ||
    results["tree cover loss"]?.[0]?.coordinates?.[0] ||
    results["soil carbon"]?.[0]?.coordinates?.[0];

  const determineComplianceStatus = (treeCoverLoss, hasForestCover) => {
    const hasTreeCoverLoss = treeCoverLoss > 0;
    console.log(treeCoverLoss, hasForestCover);

    if (!hasTreeCoverLoss && !hasForestCover) {
      return {
        status: '100% Compliant',
        statusColor: 'text-green-600 bg-green-100',
        description: 'No tree cover loss detected and no forest cover detected. Fully compliant with EUDR regulations.'
      };
    } else if ((!hasTreeCoverLoss && hasForestCover) || (hasTreeCoverLoss && !hasForestCover)) {
      return {
        status: 'Likely Compliant',
        statusColor: 'text-yellow-600 bg-yellow-100',
        description: 'No tree cover loss detected but forest cover is present. Area shows good forest conservation practices.'
      };
    } else if (hasTreeCoverLoss) {
      return {
        status: 'Not Compliant',
        statusColor: 'text-red-600 bg-red-100',
        description: 'Tree cover loss detected. This indicates potential deforestation activity that may violate EUDR regulations.'
      };
    } else {
      return {
        status: 'Assessment Pending',
        statusColor: 'text-gray-600 bg-gray-100',
        description: 'Insufficient data to determine compliance status.'
      };
    }
  };

  const saveReportToDatabase = async (reportData) => {
    console.log('🔍 saveReportToDatabase called');
    console.log('🔍 farmInfo:', farmInfo);
    console.log('🔍 farmInfo.id:', farmInfo?.farm_id);
    
    if (!farmInfo?.farm_id) {
      console.error('❌ Farm ID is missing, cannot save report');
      console.error('farmInfo object:', farmInfo);
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      console.log('📊 Saving report to database...');
      console.log('📊 Report data received:', reportData);

      const payload = {
        farm_id: farmInfo.farm_id,
        project_area: `${reportData.areaInHectares?.toFixed(2) || 0} ha`,
        country_deforestation_risk_level: reportData.deforestationRiskLevel || 'STANDARD',
        radd_alert: `${reportData.raddAlertsArea?.toFixed(2) || 0} ha`,
        tree_cover_loss: `${reportData.treeCoverLossArea?.toFixed(2) || 0} ha`,
        forest_cover_2020: reportData.isJrcGlobalForestCover || 'No data',
        eudr_compliance_assessment: reportData.complianceStatus?.status || 'Assessment Pending',
        protected_area_status: JSON.stringify(reportData.protectedStatus || {}),
        tree_cover_drivers: reportData.tscDriverDriver?.mostCommonValue || 'Unknown',
        cover_extent_area: `${reportData.wriTropicalTreeCoverAvg?.toFixed(2) || 0}%`,
        cover_extent_summary: reportData.coverExtentDecileData || {}
      };

      console.log('📦 Payload prepared:', payload);
      console.log('🚀 Sending POST request to /api/farmreport/create');

      const response = await axiosInstance.post('/api/farmreport/create', payload);

      console.log('✅ Report saved successfully!');
      console.log('✅ Server response:', response.data);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 5000);

    } catch (err) {
      console.error('❌ Error saving report:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error object:', err);
      alert('Failed to save report: ' + (err.response?.data?.msg || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!results || typeof results !== 'object' || Object.keys(results).length === 0) return;

    setGeoData(results);

    let calculatedCoverExtentData = {
      nonZeroValues: [],
      nonZeroCount: 0,
      percentageCoverExtent: 0,
      valueCountArray: []
    };

    const tropicalTreeCoverExtentArray = results["wri tropical tree cover extent"];
    if (Array.isArray(tropicalTreeCoverExtentArray)) {
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

        calculatedCoverExtentData = {
          nonZeroValues,
          nonZeroCount,
          percentageCoverExtent,
          valueCountArray
        };

        setCoverExtentDecileData(calculatedCoverExtentData);
      }
    }

    let calculatedDriverData = {
      mostCommonValue: '',
      frequencyCounts: {}
    };

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
          const count = field?.count || 1;

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

      calculatedDriverData = { mostCommonValue, frequencyCounts };
      setTscDriverDriver(calculatedDriverData);
    }

    let calculatedTreeCoverLoss = 0;
    const coverLossArray = results["tree cover loss"];
    if (Array.isArray(coverLossArray) && coverLossArray.length > 0) {
      calculatedTreeCoverLoss = coverLossArray[0]?.data_fields?.area__ha || 0;
      setTreeCoverLossArea(calculatedTreeCoverLoss);
    }

    let calculatedProtectedStatus = {
      counts: {},
      percentages: {}
    };

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

      calculatedProtectedStatus = {
        counts: protectedCounts,
        percentages
      };

      setResultStatus(prev => ({
        ...prev,
        protectedStatus: calculatedProtectedStatus
      }));
    }

    let calculatedIndigenousStatus = '';
    const indigenousArray = results["landmark indigenous and community lands"];
    if (Array.isArray(indigenousArray) && indigenousArray.length > 0) {
      const landData = indigenousArray[0]?.data_fields || [];

      if (!Array.isArray(landData) || landData.length === 0) {
        calculatedIndigenousStatus = "Not known, land is not gazetted";
      } else {
        const hasIndigenousLand = landData.some(item => item?.name || item?.value === 1);
        calculatedIndigenousStatus = hasIndigenousLand
          ? "Presence of indigenous and community lands"
          : "No presence of indigenous and community lands";
      }

      setResultStatus(prev => ({
        ...prev,
        indigenousStatus: calculatedIndigenousStatus
      }));
    }

    let calculatedAreaSqM = 0;
    let calculatedAreaHa = 0;
    
    if (coordinates && Array.isArray(coordinates) && coordinates.length >= 3) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      const closedCoords = (first[0] !== last[0] || first[1] !== last[1])
        ? [...coordinates, first]
        : coordinates;

      try {
        const polygon = turf.polygon([closedCoords]);
        calculatedAreaSqM = turf.area(polygon);
        calculatedAreaHa = calculatedAreaSqM / 10000;
        setAreaInSquareMeters(calculatedAreaSqM);
        setAreaInHectares(calculatedAreaHa);
      } catch (e) {
        console.error("Turf error on polygon:", e);
      }
    }

    let hasForestCover = false;
    let forestCoverText = "No forest cover detected";
    const jrcArray = results["jrc global forest cover"];
    if (Array.isArray(jrcArray) && jrcArray.length > 0) {
      const jrcData = jrcArray[0]?.data_fields;
      const forestAreaHa = jrcData?.area__ha || 0;
      console.log("Forest area ha", forestAreaHa);

      if (forestAreaHa > 0) {
        hasForestCover = true;
        forestCoverText = `Forest cover detected: ${forestAreaHa.toFixed(2)} hectares`;
        setIsJrcGlobalForestCover(forestCoverText);
      } else {
        hasForestCover = false;
        setIsJrcGlobalForestCover(forestCoverText);
      }
    }

    let avgCover = 0;
    const wriTropicalArray = results["wri tropical tree cover"];
    if (Array.isArray(wriTropicalArray) && wriTropicalArray.length > 0) {
      avgCover = wriTropicalArray[0]?.data_fields?.avg_cover || 0;
      setWriTropicalTreeCoverAvg(avgCover);
    }

    let raddArea = 0;
    const raddArray = results["wur radd alerts"];
    if (Array.isArray(raddArray) && raddArray.length > 0) {
      raddArea = raddArray[0]?.data_fields?.area__ha || 0;
      setRaddAlertsArea(raddArea);
    }

    const compliance = determineComplianceStatus(calculatedTreeCoverLoss, hasForestCover);
    setComplianceStatus(compliance);

    const reportDataToSave = {
      areaInSquareMeters: calculatedAreaSqM,
      areaInHectares: calculatedAreaHa,
      deforestationRiskLevel: 'STANDARD',
      raddAlertsArea: raddArea,
      treeCoverLossArea: calculatedTreeCoverLoss,
      isJrcGlobalForestCover: forestCoverText,
      complianceStatus: compliance,
      protectedStatus: calculatedProtectedStatus,
      coverExtentDecileData: calculatedCoverExtentData,
      tscDriverDriver: calculatedDriverData,
      wriTropicalTreeCoverAvg: avgCover,
      indigenousStatus: calculatedIndigenousStatus
    };

    console.log('🔍 Check conditions for saving:');
    console.log('  - farmInfo?.id:', farmInfo?.farm_id);
    console.log('  - calculatedAreaHa:', calculatedAreaHa);
    console.log('  - calculatedAreaHa > 0:', calculatedAreaHa > 0);
    console.log('  - Will save?:', farmInfo?.id && calculatedAreaHa > 0);

    if (farmInfo?.farm_id && calculatedAreaHa > 0) {
      console.log('✅ Conditions met! Calling saveReportToDatabase...');
      console.log('📊 Data to save:', reportDataToSave);
      saveReportToDatabase(reportDataToSave);
    } else {
      console.warn('⚠️ Conditions NOT met for saving:');
      if (!farmInfo?.farm_id) console.warn('  - Missing farmInfo.farm_id');
      if (!(calculatedAreaHa > 0)) console.warn('  - calculatedAreaHa is not > 0 (value:', calculatedAreaHa, ')');
    }

  }, [results, farmInfo]);

  return (
    <div ref={reportRef} className="carbon-report-a4 w-full h-full m-0 p-0 bg-white text-gray-900 font-sans leading-relaxed space-y-8">

      {isSaving && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Saving report...
        </div>
      )}

      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
          </svg>
          Report saved successfully!
        </div>
      )}

      <div className="flex items-center justify-between border-b-4 border-green-700 pb-6 px-8 pt-8">
        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm">
          <img
            src="https://www.nkusu.com/parrotlogo.svg"
            alt="Parrot"
            className="object-contain w-full h-full rounded-md"
          />
        </div>

        <div className="flex-1 text-center px-4">
          <h2 className="text-3xl font-bold text-green-800 mb-1">EUDR COMPLIANCE REPORT</h2>
          <p className="text-sm text-gray-600">
            Report generated based on the Regulation (EU) 2023/1115 on deforestation-free products.
          </p>
        </div>

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
              complianceStatus
            })}
          </div>

          <div className="html2pdf__page-break"></div>

          {coordinates && TREE_COVER_DATA.length > 0 && (
            <div className="report-section border-l-4 border-green-700 pl-5 space-y-4">
              <h2 className="text-2xl font-bold text-green-800">Risk Assessment Breakdown</h2>
              <p>Analysis shows:</p>
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

        <div className="html2pdf__page-break"></div>
        <div className="my-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Static Map Export</h3>
          <StaticForestMap
            treeCoverData={TREE_COVER_DATA}
            mapboxToken={TOKEN}
            title="Tree Cover Analysis"
            subtitle={`${TREE_COVER_DATA.length} data points`}
          />
        </div>
      </div>

      <div className="report-footer border-t-2 border-gray-300 px-8 pt-6 text-xs text-gray-500 text-center mt-10">
        © 2025 Agriyields. Contact: nkusu@agriyields.com
      </div>
    </div>
  );
};

export default EudrReportSection;
import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import axiosInstance from '../../axiosInstance';
import { useLocation, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import Loading from '../main/Loading.jsx';
import Heatmap from 'react-heatmap-grid';
import * as turf from '@turf/turf';


const FullReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001"; // Ensure fallback is a string
  const [areaInSquareMeters, setAreaInSquareMeters] = useState(null);
  const [areaInHectares, setAreaInHectares] = useState(null);
  const reportRef = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [resultStatus, setResultStatus] = useState([]);
  const [coverExtentDecileData, setCoverExtentDecileData] = useState({
    nonZeroValues: [],       // Initialize as an empty array
    nonZeroCount: 0,        // Initialize count to 0
    percentageCoverExtent: 0 // Initialize percentage to 0
  });





  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Nettoyage de l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(geoData) && geoData.length > 2) {
      console.log('Updated geoData:', geoData);
      console.log('cover extent:', geoData[2]?.data_fields);

      const dataFieldscoverExtent = Array.isArray(geoData[2]?.data_fields) ? geoData[2].data_fields : [];
      let nonZeroValues = [];
      let nonZeroCount = 0;
      console.log('############', dataFieldscoverExtent);

      dataFieldscoverExtent.forEach((value) => {
        console.log('########', value.wri_tropical_tree_cover_extent__decile);
        if (value.wri_tropical_tree_cover_extent__decile !== 0) {
          nonZeroValues.push(value.wri_tropical_tree_cover_extent__decile); // Only pushing non-zero values
          nonZeroCount++;
        }
      });

      const totalCountCoverExtent = dataFieldscoverExtent.length;
      const percentageCoverExtent = totalCountCoverExtent > 0
        ? (nonZeroCount / totalCountCoverExtent) * 100
        : 0;

      const cover_extent_decile = {
        nonZeroValues: nonZeroValues,
        nonZeroCount: nonZeroCount,
        percentageCoverExtent: percentageCoverExtent,
      };

      setCoverExtentDecileData(cover_extent_decile);
      console.log('cover extent decile:', coverExtentDecileData);


      

      

      const results = {};
      const coverLoss = geoData[1]?.data_fields?.area__ha || 0;
      if (coverLoss === 0) {
        const landIndigenous = geoData[6]?.data_fields;

        if (!landIndigenous || landIndigenous.length === 0) {
          results.indigenousStatus = "Not known, land is not gazetted";
        } else if (landIndigenous.includes(1)) { // Check if 1 is present in the array
          results.indigenousStatus = "Presence of indigenous and community lands";
        } else {
          results.indigenousStatus = "No presence of indigenous and community lands";
        }

        const protectedAreas = Array.isArray(geoData[7]?.data_fields) ? geoData[7].data_fields : [];
        const protectedCounts = { 0: 0, 1: 0, 2: 0, other: 0 };

        protectedAreas.forEach((field) => {
          const value = field?.wdpa_protected_areas__iucn_cat ?? 0;
          if (value in protectedCounts) {
            protectedCounts[value]++;
          } else {
            protectedCounts.other++;
          }
        });

        const total = protectedAreas.length;
        const percentages = total > 0 ? {
          notInProtectedArea: ((protectedCounts[0] / total) * 100).toFixed(2) + "%",
          inProtectedArea: ((protectedCounts[1] / total) * 100).toFixed(2) + "%",
          inOtherIUCNVulnerableArea: ((protectedCounts[2] / total) * 100).toFixed(2) + "%",
        } : {
          notInProtectedArea: "0%",
          inProtectedArea: "0%",
          inOtherIUCNVulnerableArea: "0%",
        };

        results.protectedStatus = percentages;
      }

      setResultStatus(results);
    }
  }, [geoData]);

  const calculatePolygonArea = (coordinates) => {
    // Construct GeoJSON polygon
    const polygon = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates],
      },
    };

    // Use turf to calculate area (in square meters)
    const areaInSquareMeters = turf.area(polygon);

    // Convert area to hectares (optional)
    const areaInHectares = areaInSquareMeters / 10000;

    return { areaInSquareMeters, areaInHectares };
  };

  const dataheat = [
    [1, 1, 1, 1, 1],
    [2, 1, 2, 1, 2],
  ];

  // Labels des axes
  const xLabels = ['Risk Assessment', 'Protected Areas', 'Land Rights', 'Tree Cover Extent', 'Tree Cover Loss'];
  const yLabels = ['True', 'False'];

  // Fonction pour rendre les cellules
  const renderCell = (x, y, value) => {
    let icon;
    let textColor;

    // Log the value and its type for debugging purposes
    // Directly use value since it's already a number
    if (x === 1) {
      icon = '❌';
      textColor = 'text-red-500';
    } else if (x === 2) {
      icon = '✔️';
      textColor = 'text-green-500';
    } else {
      icon = '⚠️'; // Default icon for other values
      textColor = 'text-gray-500';
    }

    return (
      <span className={`flex justify-center items-center text-xl ${textColor}`}>
        {icon}
      </span>
    );
  };
  useEffect(() => {
    const fetchFarmReport = async () => {
      console.log('Fetching farm report for farmId:', farmId);
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          console.error('Error in API response:', response.data.error);
          setError(response.data.error);
        } else {
          console.log('API Response:', response.data);
          setFarmInfo(response.data.farm_info);
          const reportData = response.data.report || [];
          console.log('Report Data:', reportData);

          setGeoData(reportData);


          if (reportData.length > 0 && reportData[0]?.coordinates?.length > 0) {
            const coordinates = reportData[0].coordinates[0];
            console.log('Coordinates:', coordinates);
            const { areaInSquareMeters, areaInHectares } = calculatePolygonArea(coordinates);
            setAreaInSquareMeters(areaInSquareMeters);
            setAreaInHectares(areaInHectares);
            console.log('Area in m²:', areaInSquareMeters, 'Area in ha:', areaInHectares);
          } else {
            console.warn('No valid polygon data in report');
          }
        }
      } catch (err) {
        setError('Failed to fetch farm report.');
        console.error('Error fetching farm report:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmReport();
  }, [farmId]);

  const generateMapboxUrl = (coordinates) => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [coordinates]
          },
          properties: {}
        }
      ]
    };
    const encodedGeojson = encodeURIComponent(JSON.stringify(geojson));
    console.log(dimensions);
    const x = Math.min(dimensions.width, 1280);
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/geojson(${encodedGeojson})/auto/${x}x500?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`;
  };
  const generatePdf = async () => {
    const element = reportRef.current;
    const pdf = new jsPDF("p", "mm", "a4");
    const pages = element.querySelectorAll(".page");
    const email = "nkusu@agriyields.com"; // Replace with your email

    for (let i = 0; i < pages.length; i++) {
      // Wait until all images in the current page are loaded
      await new Promise((resolve) => {
        const images = pages[i].getElementsByTagName("img");
        let loadedCount = 0;

        if (images.length === 0) {
          resolve(); // No images to load
        } else {
          Array.from(images).forEach((img) => {
            img.onload = () => {
              loadedCount += 1;
              if (loadedCount === images.length) {
                resolve(); // All images loaded
              }
            };
            img.src = img.src; // Trigger reload if needed
          });
        }
      });

      // Generate a canvas from the page
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true, // Enable CORS
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add the image to the PDF
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Add the email text to the bottom right corner
      const margin = 10; // Margin from the edge
      const emailX = pdfWidth - pdf.getTextWidth(email) - margin; // Calculate X position
      const emailY = pdf.internal.pageSize.getHeight() - margin; // Calculate Y position
      pdf.setFontSize(10); // Set font size
      pdf.text(email, emailX, emailY); // Add email text

      if (i < pages.length - 1) pdf.addPage(); // Add a new page if not the last
    }

    // Save the PDF
    pdf.save("EUDR_Report.pdf");
  };


  if (loading) return <Loading />;
  if (error) return <p className="text-red-600">{error}</p>;


  if (error === 'No polygon found. Please create a polygon for this forest.') {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-red-600">{error}</h1>
        <p className="text-lg font-medium text-gray-700 mb-6">
          It seems that no polygon data is available for this forest. You can create a polygon by clicking the link below:
        </p>
        <Link
          to="/create-polygon"
          className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Create Polygon
        </Link>
      </div>
    );
  }


  return (
    <div className="flex justify-center flex-col items-center text-xl">
      {/* Report Content */}
      <div ref={reportRef}>
        {/* Page 1 */}
        <div className="page bg-white p-6 shadow-md mb-4">
          <img
            src="/logo.jpg"
            alt="Description of image"
            style={{
              float: 'right',
              width: '200px',
              height: 'auto'
            }}
          />
          <h1 className="text-3xl font-bold mb-6 text-center">NKUSU/AGRIYIELDS REPORT</h1>
          {farmInfo && (
            <p className="p-4">
              This report provides an overview of Farm ID <strong>{farmInfo.farm_id}</strong>, owned by <strong>{farmInfo.name}</strong>,
              located in <strong>{farmInfo.subcounty}</strong>, [District]. The farm is a member of the {farmInfo.subcounty} and plays a significant role in the local agricultural landscape.
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


          <p className="mt-4 pb-6 p-4">
            Regulation (EU) 2023/1115 governs the availability and export of commodities and products linked to deforestation and degradation.
            The following analysis provides insights into compliance.
          </p>
          <div className="bg-white pt-6 p-4 shadow-md mb-4 pl-11">
            <h2 className="text-2xl font-bold mb-4">Report Overview:</h2>
            <p className="text-gray-700 mb-6">
              This report provides a detailed analysis of the farm's environmental and land use context, focusing on the following key aspects:
            </p>
            <div className="flex justify-center items-center space-x-4">
              <div className="p-2">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. R A D D Alert(EUDR, Article 2):</h3>
                  <div className="text-gray-700">
                    This dataset verifies if there was recent deforestation, <strong> checked every 6-12days:</strong>
                    <ul className="list-inside list-disc text-gray-700">
                      <p>applicable to most parts of Uganda, only parts of Lake Albert region neighbouring DRCongo</p>
                      <li><strong>1</strong> = Non risk.</li>
                      <li><strong>2</strong> = risk.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Tree Cover Loss (EUDR, Article 2):</h3>
                  <div className="text-gray-700">
                    Area in which Tree loss was identified since Dec 2020:
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
                      <li><strong>non Zero </strong> Plot/Farm likely non compliant with EUDR Law.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Forest Cover (EUDR, Article 2):</h3>
                  <div className="text-gray-700">
                    EU joint Research Centre Geostore for checking existence or not of forest cover as of 2020
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong> </strong> Plot/Farm is fully compliant with EUDR Law.</li>
                      <li><strong>non Zero </strong> = Farm likely non compliant with EUDR Law.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Tree Cover Extent (EUDR, Article 2):</h3>
                  <p className="text-gray-700">
                    Analysis of tree cover, expressed in deciles (ranging from <strong>0-100</strong>), to evaluate forest coverage.
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Tree Cover Loss Drivers (EUDR Article 10):</h3>
                  <div className="text-gray-700">
                    What causes Deforestation & Degradation, :
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>1</strong> = Driven deforestation.</li>
                      <li><strong>2</strong> = Shifting.</li>
                      <li><strong>3</strong> = Restry.</li>
                      <li><strong>4</strong> = Wildfire.</li>
                      <li><strong>5</strong> = Urbanization.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Protected Area (EUDR Article 10):</h3>
                  <div className="text-gray-700">
                    whether plot of land is in areas Gazzetted as Protected Areas e.g swamps, national parks etc
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>1</strong> = check whether plot of land is in areas Gazzetted as Protected Areas e.g swamps, national parks etc.</li>
                      <li><strong>1, 1a, 1b, II, III, IV, V</strong> Plot in WDPA protected area.</li>
                      <li><strong>2</strong> = Plot in other IUCN vulnerable .</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. indigenous and community lands (EUDR Article 10):</h3>
                  <div className="text-gray-700">
                    lands or plots existing within land gazetted as indigenous or community land                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>0</strong> = indigenous and community lands.</li>
                      <li><strong>1</strong> = Presence of indigenous lands.</li>
                      <li><strong>null</strong> = not, land is not gazetted.</li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* <div className="p-11">
                <Heatmap
                  data={dataheat}
                  xLabels={xLabels}
                  yLabels={yLabels}
                  squares
                  onClick={(x, y) => alert(`Clicked ${x}, ${y}`)}
                  cellStyle={(background, value, min, max, data, x, y) => ({
                    fontSize: "11px",
                  })}
                  height={80}  // Increase cell size
                  width={80}   // Increase cell size
                  cellRender={renderCell}
                  className="rounded-lg " // Adds rounded corners
                />
              </div> */}
            </div>
          </div>
          <div className="bg-white m-6 p-11 shadow-md mb-4">
            <h2 className="text-2xl font-bold mb-4">Tree Cover and Deforestation Risk</h2>
            <table className="table-auto w-full mt-4 border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-400 px-4 py-2">Metric</th>
                  <th className="border border-gray-400 px-4 py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Project Area</td>
                  <td className="border border-gray-400 px-4 py-2">
                    {areaInSquareMeters && areaInHectares && (
                      <div>

                        <p>{areaInSquareMeters.toFixed(2)} m²</p>
                        <p>{areaInHectares.toFixed(2)} ha</p>
                      </div>
                    )}



                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Country Deforestation Risk Level</td>
                  <td className="border border-gray-400 px-4 py-2">Medium</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">EUDR compliance</td>
                  <td className="border border-gray-400 px-4 py-2">

                    {geoData[0].data_fields.area__ha === '0' || geoData[0].data_fields.area__ha === 0 ? (
                      <div>
                        <p>100% compliance</p>
                      </div>
                    ) : (
                      <p>Not compliant</p>
                    )}

                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Protected Area Status</td>
                  <td className="border border-gray-400 px-4 py-2">
                    <li>Not in WDPA Protected Area: {resultStatus.protectedStatus?.notInProtectedArea}</li>
                    <li>In WDPA Protected Area: {resultStatus.protectedStatus?.inProtectedArea}</li>
                    <li>
                      In Other IUCN Vulnerable Area: {resultStatus.protectedStatus?.inOtherIUCNVulnerableArea}
                    </li>

                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Landmark Indigenous and Community Lands</td>
                  <td className="border border-gray-400 px-4 py-2"><strong></strong> {resultStatus.indigenousStatus || "N/A"}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Cover Extent</td>
                  <td className="border border-gray-400 px-4 py-2">
                    <ul>
                      <li>
                        Cover extent percentage:{" "}
                        {coverExtentDecileData.nonZeroValues.length > 0
                          ? coverExtentDecileData.nonZeroValues.join(", ")
                          : "No data available"}
                      </li>
                      <li>Non Zero Count: {coverExtentDecileData.nonZeroCount}</li>
                      <li>
                        Percentage of coverage: {coverExtentDecileData.percentageCoverExtent.toFixed(2)}%
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Cover Extent Area</td>
                  <td className="border border-gray-400 px-4 py-2">

                    {geoData[4].data_fields.area__ha === '0' || geoData[4].data_fields.area__ha === 0 ? (
                      <div>
                        <p>{geoData[4].data_fields.area__ha} ha (LOW)</p>
                      </div>
                    ) : (
                      <p>{geoData[4].data_fields.area__ha} ha (HIGH)</p>
                    )}

                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 className="text-2xl font-bold mb-4">Risk Assessment Breakdown</h2>
          <p>
            Analysis of deforestation drivers shows significant influences from urbanization and shifting agriculture.
          </p>
          <ul className="list-disc pl-6">
            <li>Urbanization: key driver</li>
            <li>Shifting: Major contributor to forest loss</li>
            <li>Commodity-driven : Moderate impact</li>
          </ul>
          <div className="items-center justify-center mt-6 mb-6">
            <div className="overflow-hidden">
              <img
                src={generateMapboxUrl(geoData[0].coordinates[0])}
                alt="Map for the forest"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Additional Pages
        {[...Array(7)].map((_, index) => (
          <div key={index} className="page bg-white p-6 shadow-md mb-4">
            <h2 className="text-2xl font-bold">Page {index + 2}</h2>
            <p className="mt-4">Content for page {index + 2}.</p>
            <div className="bg-gray-200 w-full h-64 flex items-center justify-center mt-6">
              <p className="text-gray-500">Figure Placeholder</p>
            </div>
          </div>
        ))} */}
      </div>

      {/* Generate PDF Button */}
      <button
        onClick={generatePdf}
        className="bg-blue-500 text-white px-6 py-3 rounded-md mt-6 hover:bg-blue-700 transition duration-300"
      >
        Generate PDF
      </button>
    </div>
  );
};

export default FullReport;

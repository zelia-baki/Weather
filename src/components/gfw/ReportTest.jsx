import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import axiosInstance from '../../axiosInstance';
import { useLocation, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import Loading from '../main/Loading.jsx';
import Heatmap from 'react-heatmap-grid';



const FullReport = () => {
  const [farmInfo, setFarmInfo] = useState(null);
  const [geoData, setGeoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const farmId = location.state?.farmId || "WAK0001"; // Ensure fallback is a string
  const reportRef = useRef();
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
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
      try {
        const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/report`);
        if (response.data.error) {
          setError(response.data.error);
        } else {
          setFarmInfo(response.data.farm_info);
          setGeoData(response.data.report || []);
          console.log("GeoData:", response.data.report);
        }
      } catch (err) {
        setError('Failed to fetch farm report.');
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
  
    for (let i = 0; i < pages.length; i++) {
      // Make sure to wait until all images are loaded
      await new Promise((resolve) => {
        const images = pages[i].getElementsByTagName('img');
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
  
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true, // Enable CORS
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      if (i < pages.length - 1) pdf.addPage();
    }
  
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
          <h1 className="text-3xl font-bold mb-6 text-center">NKUSU/AGRIYIELDS REPORT</h1>
          {farmInfo && (
            <p className="p-4">
              This report provides an overview of Farm ID <strong>{farmInfo.farm_id}</strong>, owned by <strong>{farmInfo.name}</strong>,
              located in <strong>{farmInfo.subcounty}</strong>, [District]. The farm is a member of the {farmInfo.subcounty} and plays a significant role in the local agricultural landscape. With geolocation coordinates <strong>{farmInfo.geolocation}</strong>,
              the farm specializes in <strong>{farmInfo.crops[0].crop}</strong> and operates within a region characterized by Landtype: <strong>{farmInfo.crops[0].land_type}</strong>.
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
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">1. Deforestation Risk Assessment:</h3>
                  <div className="text-gray-700">
                    Categorization based on the <strong>Forest Negligible Risk Analysis:</strong>
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>1</strong> = Non-negligible risk.</li>
                      <li><strong>2</strong> = Negligible risk.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">2. Presence in Protected Areas:</h3>
                  <div className="text-gray-700">
                    Indication of whether the farm overlaps with Peru's protected areas:
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>FALSE</strong> = No presence in protected areas.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">3. Land Rights:</h3>
                  <div className="text-gray-700">
                    Examination of the farm's inclusion in the <strong>Land Rights layer:</strong>
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>FALSE</strong> = No presence of recognized land rights.</li>
                    </ul>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">4. Tree Cover Extent:</h3>
                  <p className="text-gray-700">
                    Analysis of tree cover, expressed in deciles (ranging from <strong>0-100</strong>), to evaluate forest coverage.
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">5. Tree Cover Loss Drivers:</h3>
                  <div className="text-gray-700">
                    Identification of primary deforestation drivers:
                    <ul className="list-inside list-disc text-gray-700">
                      <li><strong>1</strong> = Commodity-driven deforestation.</li>
                      <li><strong>2</strong> = Shifting agriculture.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="p-11">
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
              </div>
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
                  <td className="border border-gray-400 px-4 py-2">Tropical Tree Cover Percent</td>
                  <td className="border border-gray-400 px-4 py-2">0-97%</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Tree Cover Height (2020)</td>
                  <td className="border border-gray-400 px-4 py-2">0 to 23 meters</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Protected Areas</td>
                  <td className="border border-gray-400 px-4 py-2">No protected areas identified</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 px-4 py-2">Landmark Indigenous and Community Lands</td>
                  <td className="border border-gray-400 px-4 py-2">None</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h2 className="text-2xl font-bold mb-4">Risk Assessment Breakdown</h2>
          <p>
            Analysis of deforestation drivers shows significant influences from urbanization and shifting agriculture.
          </p>
          <ul className="list-disc pl-6">
            <li>Urbanization: Identified as a key driver</li>
            <li>Shifting Agriculture: Major contributor to forest loss</li>
            <li>Commodity-driven deforestation: Moderate impact</li>
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

        {/* Additional Pages */}
        {[...Array(7)].map((_, index) => (
          <div key={index} className="page bg-white p-6 shadow-md mb-4">
            <h2 className="text-2xl font-bold">Page {index + 2}</h2>
            <p className="mt-4">Content for page {index + 2}.</p>
            <div className="bg-gray-200 w-full h-64 flex items-center justify-center mt-6">
              <p className="text-gray-500">Figure Placeholder</p>
            </div>
          </div>
        ))}
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

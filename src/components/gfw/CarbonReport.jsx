import React, { useRef, useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import axiosInstance from '../../axiosInstance';
import { useLocation, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import Loading from '../main/Loading.jsx';
import Heatmap from 'react-heatmap-grid';
import * as turf from '@turf/turf';
import { Pie } from 'react-chartjs-2';



const CarbonReport = () => {
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

    const carbonGrossEmissions = Array.isArray(geoData) && geoData.length > 0 ? geoData[0]?.data_fields?.gfw_forest_carbon_gross_emissions__Mg_CO2e || 0 : 0;
    const carbonGrossRemovals = Array.isArray(geoData) && geoData.length > 1 ? geoData[1]?.data_fields?.gfw_forest_carbon_gross_removals__Mg_CO2e || 0 : 0;
    const carbonNetFlux = Array.isArray(geoData) && geoData.length > 2 ? geoData[2]?.data_fields?.gfw_forest_carbon_net_flux__Mg_CO2e || 0 : 0;
    const carbonSequestration = Array.isArray(geoData) && geoData.length > 3 ? geoData[3]?.data_fields?.gfw_reforestable_extent_belowground_carbon_potential_sequestration__Mg_C || 0 : 0;


    const data = {
        labels: ['Carbon Gross Emissions', 'Carbon Gross Removals', 'Carbon Net Flux' , 'Carbon Sequestration'],
        datasets: [
            {
                data: [carbonGrossEmissions, carbonGrossRemovals, carbonNetFlux, carbonSequestration],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56','#FFCC00'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56','#FFCC00'],
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Carbon Emissions and Removals',
            },
        },
    };


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
            console.log('carbon driver:', geoData[0]?.data_fields.area__ha);
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
                const response = await axiosInstance.get(`/api/gfw/farm/${farmId}/CarbonReport`);
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
    const percentage =
        (geoData[1].data_fields.area__ha / areaInHectares) * 100;

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
                            Carbon report for Farm ID <strong>{farmInfo.farm_id}</strong>, owned by <strong>{farmInfo.name}</strong>
                            Located at <strong>{farmInfo.geolocation}</strong>,
                        </p>
                    )}
                
                    <div className="container mx-auto p-4">
                        <h2 className="text-xl font-semibold mb-4">Carbon Assessment summary</h2>
                        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4 border-b border-gray-300 text-left text-gray-700">Category</th>
                                    <th className="py-2 px-4 border-b border-gray-300 text-left text-gray-700">Mt_CO2e</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b border-gray-300">Carbon gross emissions</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{geoData[0]?.data_fields.gfw_forest_carbon_gross_emissions__Mg_CO2e
                                    }</td>
                                </tr>
                                <tr className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b border-gray-300">Carbon gross absorption</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{geoData[1]?.data_fields.gfw_forest_carbon_gross_removals__Mg_CO2e}</td>
                                </tr>
                                <tr className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b border-gray-300">Carbon net Emmisions</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{geoData[2]?.data_fields.gfw_forest_carbon_net_flux__Mg_CO2e}</td>
                                </tr>
                                <tr className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b border-gray-300">Carbon Sequestration potential</td>
                                    <td className="py-2 px-4 border-b border-gray-300">{geoData[3]?.data_fields.gfw_reforestable_extent_belowground_carbon_potential_sequestration__Mg_C}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-full max-w-md mx-auto">
                        <Pie data={data} options={options} />
                    </div>
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

export default CarbonReport;

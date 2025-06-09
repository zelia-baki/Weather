// utils/reportUtils.js
export const renderCarbonTable = (dataFields) => (
  <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-lg">
    <thead className="bg-gray-100">
      <tr>
        <th className="py-2 px-4 border-b text-left">Category</th>
        <th className="py-2 px-4 border-b text-left">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr><td className="px-4 py-2 border-b">Carbon gross emissions</td><td className="px-4 py-2 border-b">{dataFields.gfw_forest_carbon_gross_emissions__Mg_CO2e || 0}</td></tr>
      <tr><td className="px-4 py-2 border-b">Carbon gross absorption</td><td className="px-4 py-2 border-b">{dataFields.gfw_forest_carbon_gross_removals__Mg_CO2e || 0}</td></tr>
      <tr><td className="px-4 py-2 border-b">Carbon net emissions</td><td className="px-4 py-2 border-b">{dataFields.gfw_forest_carbon_net_flux__Mg_CO2e || 0}</td></tr>
      {/* <tr>
        <td className="px-4 py-2 border-b">Sequestration potential</td>
        <td className="px-4 py-2 border-b">
          {dataFields.gfw_reforestable_extent_belowground_carbon_potential_sequestration__Mg_C || 0} (below)<br />
          {dataFields.gfw_reforestable_extent_aboveground_carbon_potential_sequestration__Mg_C || 0} (above)
        </td>
      </tr> */}
    </tbody>
  </table>
);
export const renderEudrTable = (data) => {
  const {
    geoData = {},
    areaInSquareMeters,
    areaInHectares,
    resultStatus = {},
    coverExtentDecileData = {},
    tscDriverDriver = {}
  } = data;
  
  return (
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
            {areaInSquareMeters && areaInHectares ? (
              <>
                <p>{areaInSquareMeters.toFixed(2)} m²</p>
                <p>{areaInHectares.toFixed(2)} ha</p>
              </>
            ) : 'Not available'}
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">RADD Alert</td>
          <td className="border border-gray-400 px-4 py-2">
            {geoData['radd alerts']?.[0]?.data_fields?.area__ha === 0 ? (
              <p>0 ha (no RADD alert)</p>
            ) : (
              <p>{geoData['radd alerts']?.[0]?.data_fields?.area__ha} ha (Alert)</p>
            )}
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">Tree Cover Loss</td>
          <td className="border border-gray-400 px-4 py-2">
            {geoData['tree cover loss']?.[0]?.data_fields?.area__ha === 0 ? (
              <p>0 ha (no tree loss since 2020)</p>
            ) : (
              <p>{geoData['tree cover loss']?.[0]?.data_fields?.area__ha} ha of tree cover loss</p>
            )}
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">EUDR Compliance</td>
          <td className="border border-gray-400 px-4 py-2">
            {geoData['tree cover loss']?.[0]?.data_fields?.area__ha === 0 ? '100% Compliance' : 'Not Compliant'}
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">Protected Area Status</td>
          <td className="border border-gray-400 px-4 py-2">
            {resultStatus?.protectedStatus?.percentages ? (
              <ul>
                {Object.entries(resultStatus.protectedStatus.percentages).map(([key, percentage]) => {
                  const statusText =
                  key === '0' ? 'Not in WDPA protected area' :
                  key === '1' ? 'In WDPA protected area' :
                  key === '2' ? 'In IUCN vulnerable area' :
                  key === 'No Data' ? 'No data available' :
                  'Unknown';
                  return <li key={key}>{statusText}: {percentage}</li>;
                })}
              </ul>
            ) : (
              <p>No protected area data</p>
            )}
          </td>
        </tr>

        {/* <tr>
          <td className="border border-gray-400 px-4 py-2">Indigenous Land Status</td>
          <td className="border border-gray-400 px-4 py-2">
          {resultStatus?.indigenousStatus || 'Unknown'}
          </td>
          </tr> */}

        <tr>
          <td className="border border-gray-400 px-4 py-2">Cover Extent Summary</td>
          <td className="border border-gray-400 px-4 py-2">
            <ul>
              <li>Non-Zero Count: {coverExtentDecileData.nonZeroCount}</li>
              <li>Coverage: {coverExtentDecileData.percentageCoverExtent.toFixed(2)}%</li>
              <li>
                <strong>Details:</strong>
                {coverExtentDecileData.valueCountArray.length > 0 ? (
                  <ul>
                    {coverExtentDecileData.valueCountArray.map((item, i) => (
                      <li key={i}>
                        Decile: {item.value}, Count: {item.count}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'No data available'
                )}
              </li>
            </ul>
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">Tree Cover Drivers</td>
          <td className="border border-gray-400 px-4 py-2">
            {tscDriverDriver?.mostCommonValue || 'Unknown'}
          </td>
        </tr>

        <tr>
          <td className="border border-gray-400 px-4 py-2">Cover Extent Area</td>
          <td className="border border-gray-400 px-4 py-2">
            {geoData['wri tropical tree cover extent']?.[0]?.data_fields?.area__ha === 0 ? (
              <p>0 ha (LOW)</p>
            ) : (
              <p>{geoData['wri tropical tree cover extent']?.[0]?.data_fields?.area__ha} ha (HIGH)</p>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};


export const generateMapboxUrl = (coordinates) => {
  const geojson = {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [coordinates] },
      properties: {
        stroke: "#00FF00",          // Vert vif pour la bordure
        "stroke-width": 4,          // Bordure épaisse
        "stroke-opacity": 1,
        fill: "#00FF00",            // Même vert ou plus doux
        "fill-opacity": 0.2         // Remplissage léger
      }
    }]
  };
  
  const encoded = encodeURIComponent(JSON.stringify(geojson));
  
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/geojson(${encoded})/auto/800x200?access_token=pk.eyJ1IjoidHNpbWlqYWx5IiwiYSI6ImNsejdjNXpqdDA1ZzMybHM1YnU4aWpyaDcifQ.CSQsCZwMF2CYgE-idCz08Q`;
};


export const fetchReportFromFile = async (featureName, file, phone) => {
  const formData = new FormData();
  formData.append('file', file);
  const endpoint = `/api/gfw/Geojson/${featureName === 'reportcarbonguest' ? 'CarbonReportFromFile' : 'ReportFromFile'}`;

  const res = await axiosInstance.post(endpoint, formData, {
    headers: {
      'X-Guest-ID': localStorage.getItem('guest_id'),
      'X-Guest-Phone': phone
    }
  });

  return res.data.report;
};
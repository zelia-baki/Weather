// components/TreeManagement/TreeList.jsx
import React from 'react';
import { Edit2, Trash2, MapPin } from 'lucide-react';

// Moist Tropical Forest Model (Chave et al. 2014)
// AGB = 0.0673 * (ρ * D² * H)^0.976
const calculateAGB = (diameter, height, woodDensity = 0.5) => {
  if (!diameter || !height) return 0;
  const D = parseFloat(diameter); // DBH en cm
  const H = parseFloat(height);   // Hauteur en m
  const rho = woodDensity;        // Densité du bois en g/cm³ (0.6 par défaut)
  
  const AGB = 0.0673 * Math.pow((rho * D * D * H), 0.976);
  return AGB; // Retourne en kg
};

// Calcul complet du CO2 séquestré
const calculateCO2 = (diameter, height, woodDensity = 0.6) => {
  if (!diameter || !height) return { agb: 0, co2: 0 };
  
  // Étape 1: AGB (Above-Ground Biomass)
  const AGB = calculateAGB(diameter, height, woodDensity);
  
  // Étape 2: BGB (Below-Ground Biomass) = 0.2 × AGB
  const BGB = 0.2 * AGB;
  
  // Étape 3: Total Biomass (TB) = AGB + BGB = 1.2 × AGB
  const TB = AGB + BGB;
  
  // Étape 4: Total Dry Weight (TDW) = TB × 0.725
  const TDW = TB * 0.725;
  
  // Étape 5: Total Carbon (TC) = TDW × 0.5
  const TC = TDW * 0.5;
  
  // Étape 6: CO2 Weight = TC × 3.67 (en kg)
  const CO2_kg = TC * 3.67;
  
  // Conversion en tonnes (1 tonne = 1000 kg)
  const CO2_tonnes = CO2_kg / 1000;
  
  return {
    agb: AGB.toFixed(2),
    co2: CO2_tonnes.toFixed(3) // 3 décimales pour les tonnes
  };
};

const TreeList = ({ 
  trees, 
  onEdit, 
  onDelete, 
  onLocate,
  currentPage,
  totalPages,
  onPageChange 
}) => {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forest
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Height
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diameter
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AGB (kg)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                tCO2e
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Planted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trees.map(tree => {
              const { agb, co2 } = calculateCO2(tree.diameter, tree.height);
              
              return (
                <tr key={tree.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tree.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tree.type || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tree.forest_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tree.height}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tree.diameter}cm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-semibold text-green-700">
                      {agb}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-semibold text-blue-700">
                      {co2}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tree.date_planted || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLocate(tree)}
                        className="text-green-600 hover:text-green-900"
                        title="Locate on map"
                      >
                        <MapPin className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onEdit(tree)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(tree.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TreeList;
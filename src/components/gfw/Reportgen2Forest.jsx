import React from 'react';

const ForestReport = () => {
  return (
    <div className="container mx-auto p-6 h-screen">
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
        {/* Colonne 1, Ligne 1 - Carte pour les propriétaires */}
        <div className="bg-white shadow-md rounded-lg p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-2">Propriétaires</h2>
          <p className="mb-4">Liste des propriétaires des forêts et leurs informations.</p>
        </div>

        {/* Colonne 2, Ligne 1 - Tableau */}
        <div className="bg-green-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Données des Forêts</h2>
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="py-2 px-4 text-left">Nom de la Forêt</th>
                <th className="py-2 px-4 text-left">Superficie (ha)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-200">
                <td className="py-2 px-4">Forêt de L'Equateur</td>
                <td className="py-2 px-4">120</td>
              </tr>
              <tr className="border-b hover:bg-gray-200">
                <td className="py-2 px-4">Forêt de la Baleine</td>
                <td className="py-2 px-4">85</td>
              </tr>
              {/* Ajoutez plus de lignes comme nécessaire */}
            </tbody>
          </table>
        </div>

        {/* Colonne 1, Ligne 2 - Informations Générales */}
        <div className="bg-yellow-200 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Informations Générales</h2>
          <p>
            La forêt joue un rôle crucial dans la biodiversité et la régulation du climat. 
            Elles fournissent des habitats pour de nombreuses espèces et contribuent à la 
            qualité de l'air. La gestion durable des forêts est essentielle pour préserver 
            cet écosystème vital.
          </p>
        </div>

        {/* Colonne 2, Ligne 2 - Image */}
        <div className="rounded-lg overflow-hidden">
          <img
            src="https://example.com/your-image.jpg" // Remplacez par l'URL de votre image
            alt="Description de l'image"
            className="w-full h-full object-cover" // Pour s'assurer que l'image occupe toute la div
          />
        </div>
      </div>
    </div>
  );
};

export default ForestReport;

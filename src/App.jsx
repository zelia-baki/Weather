import React from 'react';
import Card from './components/Card';
import './App.css';

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 ">
            <div className="px-6 py-4 bg-blue-100 text-center">
        <p className="text-2xl font-semibold text-blue-800">Map Visualisation</p>
        {/* <p className="text-3xl font-bold text-blue-700 mb-4"></p> */}
      </div>
      <Card 
        initialRegion="Butambal"
        initialCrop="Riz"
      />
    </div>
  );
}

export default App;

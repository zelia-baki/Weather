import React from 'react';
import Card from './components/Card';
import Graph from './components/Graph';
import MapboxExample from './components/Mapbox';
import Landing from './components/main/Landing';
import Login from './components/main/Login';
import Home from './components/main/Home';
import Tabcrop from './components/crop/tabcrop.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6 ">
//     <div className="px-6 py-4 bg-blue-100 text-center">
// <p className="text-2xl font-semibold text-blue-800">Map Visualisation</p>
// </div>
    <BrowserRouter>
    <Routes>
        <Route exact path="/" element={<Card />} />
        <Route exact path="/graph" element={<Graph />} />
        <Route exact path="/mapbox" element={<MapboxExample />} />
        <Route exact path='/landing' element={<Landing />} />
        <Route exact path='/login' element={<Login />} />
        <Route exact path='/home' element={<Home />} />
        <Route exact path='/tabcrop' element={<Tabcrop />} />


 
        
    </Routes>
</BrowserRouter>

    // </div>
  );
}

export default App;

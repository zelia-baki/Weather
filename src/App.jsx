import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Card from './components/Card/Card';
import Graph from './components/Graph/Graph';
import MapboxExample from './components/Mapbox';
import Landing from './components/main/Landing';
import Login from './components/main/Login';
import Home from './components/main/Home';
import Tabcrop from './components/crop/tabcrop';
import Layout from './components/Layout/Layout.jsx';
import SimpleTest from './components/SimpleTest';

function App() {
  const layoutRoutes = [
    { path: "/test", component: <SimpleTest /> },
    { path: "/graph", component: <Graph /> },
    { path: "/card", component: <Card /> },
    { path: "/mapbox", component: <MapboxExample /> },
    { path: "/tabcrop", component: <Tabcrop /> },
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        
        {layoutRoutes.map(({ path, component }) => (
          <Route key={path} path={path} element={<Layout>{component}</Layout>} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

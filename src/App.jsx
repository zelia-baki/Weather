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
import Forest from './components/Forest/Forest.jsx';
import ForestPage from './components/Forest/ForestPage.jsx';
import Create from './components/Farm/Create.jsx';
function App() {
  const layoutRoutes = [
    { path: "/graph", component: <Graph /> },
    { path: "/card", component: <Card /> },
    { path: "/mapbox", component: <MapboxExample /> },
    { path: "/tabcrop", component: <Tabcrop /> },
    { path: "/forest", component: <Forest /> },
    { path: "/forestpage", component: <ForestPage /> },
    { path: "/createfarm", component: <Create /> },




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

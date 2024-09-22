import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Card from './components/Card/Card';
import Graph from './components/Graph/Graph';
import MapboxExample from './components/mapbox/Mapbox';
import MapView from './components/mapbox/MapView.jsx';
import MapViewAll from './components/mapbox/MapViewAll.jsx';
import Landing from './components/main/Landing';
import Login from './components/main/Login';
import Home from './components/main/Home';
import Tabcrop from './components/crop/tabcrop';
import Layout from './components/Layout/Layout.jsx';
import Forest from './components/Forest/Forest.jsx';
import ForestPage from './components/Forest/Fore/ForestPage.jsx';
import Create from './components/Farm/Create.jsx';
import Farmdata from './components/Farm/Farmdata.jsx';
import Createcrop from './components/crop/Createcrop.jsx';
import CropEdit from './components/crop/CropEdit.jsx';
import Cardex from './components/Card/Cardex.jsx';
import CreateDistrict from './components/District/CreateDistrict.jsx';
import DistrictView from './components/District/DistrictView.jsx';
import DistrictList from './components/District/DistrictList.jsx';
import DistrictEdit from './components/District/DistrictEdit.jsx';
import ForestPoint from './components/Forest/Point/ForestPoint.jsx';
import ForestTree from './components/Forest/Tree/ForestTree.jsx';
import QR from './components/Qr/qr.jsx';
import Produce from './components/Qr/Produce.jsx';
import Conservation from './components/Qr/Conservation.jsx';
import Export from './components/Qr/Export.jsx';
import Fertilizer from './components/Qr/Fertilizer.jsx';
import FarmReport from './components/gfw/Gfwreportfarmer.jsx';
import ForestReport from './components/gfw/Gfwreportforest.jsx';
import CreateUsers from './components/Users/CreateUsers.jsx';
import GraphCGD from './components/Graph/GraphCGD.jsx';
import ProtectedRoute from './ProtectedRoute'; // Import ProtectedRoute
import FarmerGroupManager from './components/Farmergroup/FarmerGroup.jsx';
import FarmManager from './components/Farm/FarmManager.jsx';
import FarmManager1 from './components/Farm/FarmManager1.jsx';

import FarmDataManager from './components/Farm/FarmDataManager.jsx';
import Export2 from './components/Qr/Export2.jsx';

function App() {
  const layoutRoutes = [
    { path: "/graph", component: <Graph /> },
    { path: "/card", component: <Card /> },
    { path: "/mapbox", component: <MapboxExample /> },
    { path: "/tabcrop", component: <Tabcrop /> },
    { path: "/forest", component: <Forest /> },
    { path: "/forestpage", component: <ForestPage /> },
    { path: "/createfarm", component: <Create /> },
    { path: "/farmdata", component: <Farmdata /> },
    { path: "/cropedit/:id", component: <CropEdit /> },
    { path: "/cardex", component: <Cardex /> },
    { path: "/district", component: <CreateDistrict /> },
    { path: "/cropmanage", component: <Createcrop /> },
    { path: "/districts/:id/view", component: <DistrictView /> },
    { path: "/districts", component: <DistrictList /> },
    { path: "/districts/:id/edit", component: <DistrictEdit /> },
    { path: "/mapview", component: <MapView /> },
    { path: "/mapviewall", component: <MapViewAll /> },
    { path: "/forestpoint", component: <ForestPoint /> },
    { path: "/foresttree", component: <ForestTree /> },
    { path: "/qr", component: <QR /> },
    { path: "/qrproduce", component: <Produce /> },
    { path: "/qrconservation", component: <Conservation /> },
    { path: "/qrexport", component: <Export2 /> },
    { path: "/qrfertilizer", component: <Fertilizer /> },
    { path: "/reportfarmer", component: <FarmReport /> },
    { path: "/reportforest", component: <ForestReport /> },
    { path: "/createUsers", component: <CreateUsers /> },
    { path: "/graphcgd", component: <GraphCGD /> },
    { path: "/farmergroup", component: <FarmerGroupManager /> },
    { path: "/farmmanager", component: <FarmManager /> },
    { path: "/farmmanager1", component: <FarmManager1 /> },

    { path: "/farmdatamanager", component: <FarmDataManager /> }
    // { path: "/export2", component: <Export2 /> }

  ];

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {layoutRoutes.map(({ path, component }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <Layout>{component}</Layout>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

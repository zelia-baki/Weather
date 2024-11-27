import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Card from './components/Card/Card';
import Graph from './components/Graph/Graph';
import MapboxExample from './components/mapbox/Mapbox';
import MapView from './components/mapbox/MapView.jsx';
import MapViewAll from './components/mapbox/MapViewAll.jsx';
import Landing from './components/main/Landing';
import Landipage from './components/main/Landipage.jsx';
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
import Export from './components/Qr/Export2.jsx';
import Fertilizer from './components/Qr/Fertilizer.jsx';
import FarmReport from './components/gfw/Reportgen2Farmer.jsx';
import ForestReport from './components/gfw/Reportgen2Forest.jsx';
import CreateUsers from './components/Users/CreateUsers.jsx';
import GraphCGD from './components/Graph/GraphCGD.jsx';
import ProtectedRoute from './ProtectedRoute'; // Import ProtectedRoute
import FarmerGroupManager from './components/Farmergroup/FarmerGroup.jsx';
import FarmManager from './components/Farm/FarmManager.jsx';
import FarmManager1 from './components/Farm/FarmManager1.jsx';
import FarmDataManager from './components/Farm/FarmDataManager.jsx';
import Export2 from './components/Qr/exportEXemple.jsx';
import UserManagement from './components/Users/UserManagement.jsx';
import WeatherAndSolar from './components/Weather/WeatherAndSolar.jsx'
import CropManager from './components/crop/CropManager.jsx';
import IrrigationManager from './components/crop/IrrigationManager.jsx';
import CropCoefficientManager from './components/crop/CropCoefficientManager.jsx';
import GradeManager from './components/crop/GradeManager.jsx';
import ContactUs from './components/main/ContactUs.jsx';
import SignUp from './components/main/SignUp.jsx';
import CategoryManager from './components/Category/CategoryManager.jsx';
import WeathearMap from './components/mapbox/WeatherMap.jsx';
import Test from './components/gfw/ReportTest.jsx';
import BarNav from './components/main/BarNav.jsx';





function App() {
  const layoutRoutes = [
    { path: "/graph", component: <Graph /> , adminOnly: false},
    { path: "/card", component: <Card /> , adminOnly: false},
    { path: "/mapbox", component: <MapboxExample /> , adminOnly: false},
    { path: "/tabcrop", component: <Tabcrop /> , adminOnly: false},
    { path: "/forest", component: <Forest /> , adminOnly: false},
    { path: "/forestpage", component: <ForestPage /> , adminOnly: false},
    { path: "/createfarm", component: <Create /> , adminOnly: false},
    { path: "/farmdata", component: <Farmdata /> , adminOnly: false},
    { path: "/cropedit/:id", component: <CropEdit /> , adminOnly: false},
    { path: "/cardex", component: <Cardex /> , adminOnly: false},
    { path: "/district", component: <CreateDistrict /> , adminOnly: false},
    { path: "/cropmanage", component: <Createcrop /> , adminOnly: false},
    { path: "/districts/:id/view", component: <DistrictView /> , adminOnly: false},
    { path: "/districts", component: <DistrictList /> , adminOnly: false},
    { path: "/districts/:id/edit", component: <DistrictEdit /> , adminOnly: false},
    { path: "/mapview", component: <MapView /> , adminOnly: false},
    { path: "/mapviewall", component: <MapViewAll /> , adminOnly: false},
    { path: "/forestpoint", component: <ForestPoint /> , adminOnly: false},
    { path: "/foresttree", component: <ForestTree /> , adminOnly: false},
    { path: "/qr", component: <QR /> , adminOnly: false},
    { path: "/qrproduce", component: <Produce /> , adminOnly: false},
    { path: "/qrconservation", component: <Conservation /> , adminOnly: false},
    { path: "/qrexport", component: <Export /> , adminOnly: false},
    { path: "/weathermap", component: <WeathearMap  /> , adminOnly: false},

    // { path: "/qrexport2", component: <Export /> , adminOnly: false},

    { path: "/qrfertilizer", component: <Fertilizer /> , adminOnly: false},
    { path: "/reportfarmer", component: <FarmReport /> , adminOnly: false},
    { path: "/reportforest", component: <ForestReport /> , adminOnly: false},
    { path: "/createUsers", component: <CreateUsers /> , adminOnly: false},
    { path: "/graphcgd", component: <GraphCGD /> , adminOnly: false},
    { path: "/farmergroup", component: <FarmerGroupManager /> , adminOnly: false},
    { path: "/farmmanager", component: <FarmManager /> , adminOnly: false},
    { path: "/farmmanager1", component: <FarmManager1 /> , adminOnly: false},
    { path: "/farmdatamanager", component: <FarmDataManager /> , adminOnly: false},
    { path: "/usermanager", component: <UserManagement /> , adminOnly: false},
    { path: "/weatherandsolar", component: <WeatherAndSolar /> , adminOnly: false},
    { path: "/cropmanager", component: <CropManager /> , adminOnly: false},
    { path: "/irrigationmanager", component: <IrrigationManager /> , adminOnly: false},
    { path: "/cropcoefficientmanager", component: <CropCoefficientManager/>, adminOnly: false},
    { path: "/grademanager", component: <GradeManager/>, adminOnly: false},
    { path: "/categorymanager", component: <CategoryManager/>, adminOnly: false}


    // { path: "/export2", component: <Export2 /> }

  ];

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landipage />} />
        <Route path="/landipage" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/signup" element={<SignUp/>} />
        <Route path="/test" element={<Test />} />
        <Route path="/barnav" element={<BarNav />} />




        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        {layoutRoutes.map(({ path, component, adminOnly }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={adminOnly}>
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

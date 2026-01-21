import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Card from './components/Card/Card.jsx';
import Graph from './components/Graph/Graph.jsx';
import MapboxExample from './components/mapbox/Mapbox.jsx';
import MapView from './components/mapbox/MapView.jsx';
import MapViewAll from './components/mapbox/MapViewAll.jsx';
import Landing from './components/main/Landing.jsx';
import Landipage from './components/main/Landipage.jsx';
import Login from './components/main/Login.jsx';
import Home from './components/main/Home.jsx';
import Tabcrop from './components/crop/tabcrop.jsx';
import Layout from './components/Layout/Layout.jsx';
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
import Produce from './components/Qr/Page/ProduceQrPage.jsx';
import Conservation from './components/Qr/Page/Conservation.jsx';
import Export from './components/Qr/Page/ExportDigitalStamps.jsx';
import Fertilizer from './components/Qr/Page/Fertilizer.jsx';
import FarmReport from './components/gfw/FarmReport.jsx';
import ForestReport from './components/gfw/Reportgen2Forest.jsx';
import CreateUsers from './components/Users/CreateUsers.jsx';
import GraphCGD from './components/Graph/GraphCGD.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import WeatherOnlyRoute from './WeatherOnlyRoute.jsx';
import FarmerGroupManager from './components/Farmergroup/FarmerGroup.jsx';
import FarmManager from './components/Farm/FarmManager.jsx';
import FarmDataManager from './components/Farm/FarmDataManager.jsx';
import UserManagement from './components/Users/UserManagement.jsx';
import WeatherAndSolar from './components/Weather/WeatherAndSolar.jsx';
import CropManager from './components/crop/CropManager.jsx';
import IrrigationManager from './components/crop/IrrigationManager.jsx';
import CropCoefficientManager from './components/crop/CropCoefficientManager.jsx';
import GradeManager from './components/crop/GradeManager.jsx';
import ContactUs from './components/main/ContactUs.jsx';
import SignUp from './components/main/SignUp.jsx';
import CategoryManager from './components/Category/CategoryManager.jsx';
import WaterAdvisory from './components/mapbox/WaterAdvisory.jsx';
import WeathearMapFarm from './components/mapbox/WeatherMapFarm.jsx';
import WeatherHistory from './components/Graph/WeatherHistory.jsx';
import WeatherDashboard from './components/mapbox/WeatherDasboard.jsx';
import BarNav from './components/main/BarNav.jsx';
import CarbonReport from './components/gfw/CarbonReport.jsx';
import CarbonReportForest from './components/gfw/CarbonReportForest.jsx';
import StoreProductManager from './components/store/StoreProductManager.jsx';
import Onemonth from './components/Graph/Cgd1mois.jsx';
import PlantingDate from './components/Graph/PlantationDate.jsx';
import Threemonth from './components/Graph/Cgdthree.jsx';
import GraphPest from './components/Graph/GraphPest.jsx';
import UserDash from './components/Dashboard/UserDashBoard.jsx';
import EUDRSubmitForm from './components/Eudr/EUDRSubmitForm.jsx';
import FeatureRoute from './FeatureRoute.jsx';
import PaymentRequired from './components/main/PaymentRequired.jsx';
import FeatureManager from './components/Features/FeatureManager.jsx';
import EUDRSubmitFormForGuest from './components/Guest/EUDRSubmitFormForGuest.jsx';
import SectionFutur from './components/Layout/SectionFutur.jsx';
import AlertMessaging from './components/Dashboard/AlertMessaging.jsx';
import TestMap from './components/mapbox/Test.jsx';
import UserCertificate from './components/Eudr/UserStatsCertificate.jsx';
import TreeManagement from './components/Forest/TreeManagement.jsx';
import PaymentSuccess from './components/Payment/PaymentSuccess.jsx';
import { PaymentCancelled } from './components/Payment/PaymentCancelled.jsx';
import { PaymentError } from './components/Payment/PaymentError.jsx';
import WBIIDashboard from './components/Dashboard/WBIIDashboard.jsx';

// ============================================
// NOUVEAU COMPOSANT: UserTypeRoute
// ============================================
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const UserTypeRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const userType = decodedToken.sub?.user_type || '';
    const isAdmin = decodedToken.sub?.is_admin || false;

    // Admin a toujours accès
    if (isAdmin) {
      return children;
    }

    // Vérifier si l'utilisateur a le bon rôle
    if (allowedRoles.includes(userType)) {
      return children;
    }

    // Accès refusé
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Accès Réservé
          </h2>
          <p className="text-gray-600 mb-4">
            Cette fonctionnalité est réservée aux utilisateurs de type <strong>{allowedRoles.join(', ')}</strong>.
          </p>
          <div className="bg-gray-50 p-4 rounded mb-6">
            <p className="text-sm text-gray-500">Votre type: <strong className="text-red-600 capitalize">{userType || 'Non défini'}</strong></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Retour
            </button>
            <button
              onClick={() => window.location.href = '/home'}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const layoutRoutes = [
    // ============================================
    // ROUTES WEATHER - ADMIN + WEATHER ONLY
    // ============================================
    {
      path: "/wateradvisory",
      component: <WaterAdvisory />,
      adminOnly: false,
      allowedRoles:  ['admin', 'weather', 'farmer']
    },
    {
      path: "/weathermapfarm",
      component: <WeathearMapFarm />,
      adminOnly: false,
      allowedRoles:  ['admin', 'weather', 'farmer']
    },
    {
      path: "/weatherhistory",
      component: <WeatherHistory />,
      adminOnly: false,
      allowedRoles:  ['admin', 'weather', 'farmer']
    },
    {
      path: "/weatherdas",
      component: <WeatherDashboard />,
      adminOnly: false,
      allowedRoles:  ['admin', 'weather', 'farmer']
    },
    {
      path: "/weatherandsolar",
      component: <WeatherAndSolar />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer']
    },

    // ============================================
    // ROUTES FARM - ADMIN + FARMER ONLY
    // ============================================
    {
      path: "/farmmanager",
      component: <FarmManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/farmdatamanager",
      component: <FarmDataManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/createfarm",
      component: <Create />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/farmdata",
      component: <Farmdata />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/farmergroup",
      component: <FarmerGroupManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/tabcrop",
      component: <Tabcrop />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/cropmanage",
      component: <Createcrop />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/cropmanager",
      component: <CropManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/cropedit/:id",
      component: <CropEdit />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/irrigationmanager",
      component: <IrrigationManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/cropcoefficientmanager",
      component: <CropCoefficientManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/grademanager",
      component: <GradeManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },
    {
      path: "/storeProductManager",
      component: <StoreProductManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'farmer']
    },

    // ============================================
    // ROUTES FOREST - ADMIN + FOREST ONLY
    // ============================================
    {
      path: "/forestpage",
      component: <ForestPage />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },
    {
      path: "/forestpoint",
      component: <ForestPoint />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },
    {
      path: "/foresttree",
      component: <ForestTree />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },
    {
      path: "/treemanager",
      component: <TreeManagement />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },
    {
      path: "/reportforest",
      component: <ForestReport />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },
    {
      path: "/reportcarbonforest",
      component: <CarbonReportForest />,
      adminOnly: false,
      allowedRoles: ['admin', 'forest']
    },

    // ============================================
    // ROUTES PARTAGÉES - TOUS LES USERS
    // ============================================
    {
      path: "/graph",
      component: <Graph />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/graphpest",
      component: <GraphPest />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/graphcgd",
      component: <GraphCGD />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/onemonth",
      component: <Onemonth />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/plantingdate",
      component: <PlantingDate />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/threemonth",
      component: <Threemonth />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/card",
      component: <Card />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/cardex",
      component: <Cardex />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/mapbox",
      component: <MapboxExample />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/mapview",
      component: <MapView />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/mapviewall",
      component: <MapViewAll />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // District Routes - Tous
    {
      path: "/district",
      component: <CreateDistrict />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/districts/:id/view",
      component: <DistrictView />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/districts",
      component: <DistrictList />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/districts/:id/edit",
      component: <DistrictEdit />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // QR Routes - Tous
    {
      path: "/qr",
      component: <QR />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/qrproduce",
      component: <Produce />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/qrconservation",
      component: <Conservation />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/qrfertilizer",
      component: <Fertilizer />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/qrexport",
      component: <Export />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // Report Routes - Tous
    {
      path: "/reportfarmer",
      component: <FarmReport />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/reportcarbon",
      component: <CarbonReport />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // User Management Routes - Tous
    {
      path: "/createUsers",
      component: <CreateUsers />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/usermanager",
      component: <UserManagement />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // Category Route - Tous
    {
      path: "/categorymanager",
      component: <CategoryManager />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // Dashboard Routes - Tous
    {
      path: "/userDash",
      component: <UserDash />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/alertmessage",
      component: <AlertMessaging />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/wbiidashboard",
      component: <WBIIDashboard />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    // EUDR Routes - Tous
    {
      path: "/EUDRSubmission",
      component: <EUDRSubmitForm />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },
    {
      path: "/stats-certificate",
      component: <UserCertificate />,
      adminOnly: false,
      allowedRoles: ['admin', 'weather', 'farmer', 'forest']
    },

    // Features Manager (Admin Only)
    {
      path: "/featuresManager",
      component: <FeatureManager />,
      adminOnly: true,
      allowedRoles: ['admin']
    },
  ];

  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================ */}
        {/* ROUTES PUBLIQUES */}
        {/* ============================================ */}
        <Route path="/" element={<Landipage />} />
        <Route path="/landipage" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contactus" element={<ContactUs />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/barnav" element={<BarNav />} />
        <Route path="/payment-required" element={<PaymentRequired />} />
        <Route path="/EUDRSubmissionForGuest" element={<EUDRSubmitFormForGuest />} />
        <Route path="/sectionfutur" element={<SectionFutur />} />
        <Route path="/test" element={<TestMap />} />


        {/* ============================================ */}
        {/* 🆕 NOUVELLES ROUTES DPO PAYMENT */}
        {/* ============================================ */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/payment/error" element={<PaymentError />} />


        {/* ============================================ */}
        {/* HOME - ROUTE PROTÉGÉE */}
        {/* ============================================ */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* ============================================ */}
        {/* ROUTES PROTÉGÉES AVEC RESTRICTIONS USER TYPE */}
        {/* ============================================ */}
        {layoutRoutes.map(({ path, component, adminOnly, feature, allowedRoles }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <UserTypeRoute allowedRoles={allowedRoles}>
                  {feature ? (
                    <FeatureRoute feature={feature}>
                      <Layout>{component}</Layout>
                    </FeatureRoute>
                  ) : (
                    <Layout>{component}</Layout>
                  )}
                </UserTypeRoute>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
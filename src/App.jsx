import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// ─── Theme ───────────────────────────────────────────────────────────────────
import ThemeProvider from "./components/ThemeProvider";

// ─── Route guards ─────────────────────────────────────────────────────────────
import ProtectedRoute from './ProtectedRoute.jsx';
import WeatherOnlyRoute from './WeatherOnlyRoute.jsx';
import FeatureRoute from './FeatureRoute.jsx';

// ─── Layout ───────────────────────────────────────────────────────────────────
import Layout from './components/Layout/Layout.jsx';
import SectionFutur from './components/Layout/SectionFutur.jsx';

// ─── Public pages ─────────────────────────────────────────────────────────────
import Landing from './components/main/Landing.jsx';
import Landipage from './components/main/Landipage.jsx';
import Login from './components/main/Login.jsx';
import Home from './components/main/Home.jsx';
import ContactUs from './components/main/ContactUs.jsx';
import SignUp from './components/main/SignUp.jsx';
import BarNav from './components/main/BarNav.jsx';
import PaymentRequired from './components/main/PaymentRequired.jsx';

// ─── Payment ──────────────────────────────────────────────────────────────────
import PaymentSuccess from './components/Payment/PaymentSuccess.jsx';
import { PaymentCancelled } from './components/Payment/PaymentCancelled.jsx';
import { PaymentError } from './components/Payment/PaymentError.jsx';

// ─── Guest / EUDR ─────────────────────────────────────────────────────────────
import EUDRSubmitFormForGuest from './components/Guest/EUDRSubmitFormForGuest.jsx';
import EUDRSubmitForm from './components/Eudr/EUDRSubmitForm.jsx';
import UserCertificate from './components/Eudr/UserStatsCertificate.jsx';

// ─── Dashboard ────────────────────────────────────────────────────────────────
import UserDash from './components/Dashboard/UserDashBoard.jsx';
import AlertMessaging from './components/Dashboard/AlertMessaging.jsx';
import WBIIDashboard from './components/Dashboard/WBIIDashboard.jsx';

// ─── Maps ─────────────────────────────────────────────────────────────────────
import MapboxExample from './components/mapbox/Mapbox.jsx';
import MapView from './components/mapbox/MapView.jsx';
import MapViewAll from './components/mapbox/MapViewAll.jsx';
import WaterAdvisory from './components/mapbox/WaterAdvisory.jsx';
import WeathearMapFarm from './components/mapbox/WeatherMapFarm.jsx';
import WeatherDashboard from './components/mapbox/WeatherDasboard.jsx';
import TestMap from './components/mapbox/Test.jsx';

// ─── Weather ──────────────────────────────────────────────────────────────────
import WeatherAndSolar from './components/Weather/WeatherAndSolar.jsx';

// ─── Graphs ───────────────────────────────────────────────────────────────────
import Graph from './components/Graph/Graph.jsx';
import GraphCGD from './components/Graph/GraphCGD.jsx';
import GraphPest from './components/Graph/GraphPest.jsx';
import WeatherHistory from './components/Graph/WeatherHistory.jsx';
import Onemonth from './components/Graph/Cgd1mois.jsx';
import PlantingDate from './components/Graph/PlantationDate.jsx';
import Threemonth from './components/Graph/Cgdthree.jsx';

// ─── Farm ─────────────────────────────────────────────────────────────────────
import FarmManager from './components/Farm/FarmManager.jsx';
import FarmDataManager from './components/Farm/FarmDataManager.jsx';
import Create from './components/Farm/Create.jsx';
import Farmdata from './components/Farm/Farmdata.jsx';
import FarmerGroupManager from './components/Farmergroup/FarmerGroup.jsx';

// ─── Crops ────────────────────────────────────────────────────────────────────
import Tabcrop from './components/crop/tabcrop.jsx';
import Createcrop from './components/crop/Createcrop.jsx';
import CropManager from './components/crop/CropManager.jsx';
import CropEdit from './components/crop/CropEdit.jsx';
import IrrigationManager from './components/crop/IrrigationManager.jsx';
import CropCoefficientManager from './components/crop/CropCoefficientManager.jsx';
import GradeManager from './components/crop/GradeManager.jsx';
import StoreProductManager from './components/store/StoreProductManager.jsx';

// ─── Forest ───────────────────────────────────────────────────────────────────
import ForestPage from './components/Forest/Fore/ForestPage.jsx';
import ForestPoint from './components/Forest/Point/ForestPoint.jsx';
import ForestTree from './components/Forest/Tree/ForestTree.jsx';
import TreeManagement from './components/Forest/TreeManagement/TreeManagement.jsx';
import ForestReport from './components/gfw/Reportgen2Forest.jsx';
import CarbonReportForest from './components/gfw/CarbonReportForest.jsx';

// ─── Reports / GFW ────────────────────────────────────────────────────────────
import FarmReport from './components/gfw/FarmReport.jsx';
import CarbonReport from './components/gfw/CarbonReport.jsx';

// ─── Sentinel Hub ─────────────────────────────────────────────────────────────
import SentinelDashboard from './components/Sentinel/SentinelDashboard.jsx';

// ─── Districts ────────────────────────────────────────────────────────────────
import CreateDistrict from './components/District/CreateDistrict.jsx';
import DistrictView from './components/District/DistrictView.jsx';
import DistrictList from './components/District/DistrictList.jsx';
import DistrictEdit from './components/District/DistrictEdit.jsx';

// ─── QR ───────────────────────────────────────────────────────────────────────
import QR from './components/Qr/qr.jsx';
import Produce from './components/Qr/Page/ProduceQrPage.jsx';
import Conservation from './components/Qr/Page/Conservation.jsx';
import Export from './components/Qr/Page/ExportDigitalStamps.jsx';
import Fertilizer from './components/Qr/Page/Fertilizer.jsx';

// ─── Users ────────────────────────────────────────────────────────────────────
import CreateUsers from './components/Users/CreateUsers.jsx';
import UserManagement from './components/Users/UserManagement.jsx';

// ─── Misc ─────────────────────────────────────────────────────────────────────
import Card from './components/Card/Card.jsx';
import Cardex from './components/Card/Cardex.jsx';
import CategoryManager from './components/Category/CategoryManager.jsx';
import FeatureManager from './components/Features/FeatureManager.jsx';

// =============================================================================
// GUARD : UserTypeRoute
// =============================================================================
const UserTypeRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) return <Navigate to="/login" replace />;

  try {
    const { sub } = jwtDecode(token);
    const userType = sub?.user_type || '';
    const isAdmin  = sub?.is_admin  || false;

    if (isAdmin || allowedRoles.includes(userType)) return children;

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#050c06" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", padding: 40, borderRadius: 16, maxWidth: 400, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: "#e8f0e9", marginBottom: 12 }}>
            Accès Réservé
          </h2>
          <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 14, color: "rgba(232,240,233,0.45)", marginBottom: 8 }}>
            Fonctionnalité réservée aux rôles : <strong style={{ color: "#e8f0e9" }}>{allowedRoles.join(', ')}</strong>
          </p>
          <p style={{ fontFamily: "'Epilogue', sans-serif", fontSize: 13, color: "rgba(232,240,233,0.45)", marginBottom: 24 }}>
            Votre rôle : <strong style={{ color: "#ef4444" }}>{userType || 'Non défini'}</strong>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => window.history.back()} style={{ padding: "10px 20px", borderRadius: 100, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8f0e9", cursor: "pointer", fontFamily: "'Epilogue', sans-serif" }}>
              Retour
            </button>
            <button onClick={() => window.location.href = '/home'} style={{ padding: "10px 20px", borderRadius: 100, background: "#22c55e", border: "none", color: "#050c06", fontWeight: 700, cursor: "pointer", fontFamily: "'Epilogue', sans-serif" }}>
              Accueil
            </button>
          </div>
        </div>
      </div>
    );
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
};

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Rôles disponibles — centralisés pour éviter les fautes de frappe
const ROLES = {
  ALL:    ['admin', 'weather', 'farmer', 'forest'],
  FARM:   ['admin', 'farmer'],
  FOREST: ['admin', 'forest'],
  WEATHER:['admin', 'weather', 'farmer'],
  ADMIN:  ['admin'],
};

const layoutRoutes = [
  // ── Weather ──────────────────────────────────────────────────────────────
  { path: "/wateradvisory",    component: <WaterAdvisory />,     roles: ROLES.WEATHER },
  { path: "/weathermapfarm",   component: <WeathearMapFarm />,   roles: ROLES.WEATHER },
  { path: "/weatherhistory",   component: <WeatherHistory />,    roles: ROLES.WEATHER },
  { path: "/weatherdas",       component: <WeatherDashboard />,  roles: ROLES.WEATHER },
  { path: "/weatherandsolar",  component: <WeatherAndSolar />,   roles: ROLES.WEATHER },

  // ── Farm ─────────────────────────────────────────────────────────────────
  { path: "/farmmanager",             component: <FarmManager />,           roles: ROLES.FARM },
  { path: "/farmdatamanager",         component: <FarmDataManager />,       roles: ROLES.FARM },
  { path: "/createfarm",              component: <Create />,                roles: ROLES.FARM },
  { path: "/farmdata",                component: <Farmdata />,              roles: ROLES.FARM },
  { path: "/farmergroup",             component: <FarmerGroupManager />,    roles: ROLES.FARM },
  { path: "/tabcrop",                 component: <Tabcrop />,               roles: ROLES.FARM },
  { path: "/cropmanage",              component: <Createcrop />,            roles: ROLES.FARM },
  { path: "/cropmanager",             component: <CropManager />,           roles: ROLES.FARM },
  { path: "/cropedit/:id",            component: <CropEdit />,              roles: ROLES.FARM },
  { path: "/irrigationmanager",       component: <IrrigationManager />,     roles: ROLES.FARM },
  { path: "/cropcoefficientmanager",  component: <CropCoefficientManager />,roles: ROLES.FARM },
  { path: "/grademanager",            component: <GradeManager />,          roles: ROLES.FARM },
  { path: "/storeProductManager",     component: <StoreProductManager />,   roles: ROLES.FARM },

  // ── Forest ───────────────────────────────────────────────────────────────
  { path: "/forestpage",        component: <ForestPage />,        roles: ROLES.FOREST },
  { path: "/forestpoint",       component: <ForestPoint />,       roles: ROLES.FOREST },
  { path: "/foresttree",        component: <ForestTree />,        roles: ROLES.FOREST },
  { path: "/treemanager",       component: <TreeManagement />,    roles: ROLES.FOREST },
  { path: "/reportforest",      component: <ForestReport />,      roles: ROLES.FOREST },
  { path: "/reportcarbonforest",component: <CarbonReportForest />,roles: ROLES.FOREST },

  // ── Shared — tous les rôles ───────────────────────────────────────────────
  { path: "/graph",           component: <Graph />,           roles: ROLES.ALL },
  { path: "/graphpest",       component: <GraphPest />,       roles: ROLES.ALL },
  { path: "/graphcgd",        component: <GraphCGD />,        roles: ROLES.ALL },
  { path: "/onemonth",        component: <Onemonth />,        roles: ROLES.ALL },
  { path: "/plantingdate",    component: <PlantingDate />,    roles: ROLES.ALL },
  { path: "/threemonth",      component: <Threemonth />,      roles: ROLES.ALL },
  { path: "/card",            component: <Card />,            roles: ROLES.ALL },
  { path: "/cardex",          component: <Cardex />,          roles: ROLES.ALL },
  { path: "/mapbox",          component: <MapboxExample />,   roles: ROLES.ALL },
  { path: "/mapview",         component: <MapView />,         roles: ROLES.ALL },
  { path: "/mapviewall",      component: <MapViewAll />,      roles: ROLES.ALL },

  // Districts
  { path: "/district",            component: <CreateDistrict />, roles: ROLES.ALL },
  { path: "/districts/:id/view",  component: <DistrictView />,   roles: ROLES.ALL },
  { path: "/districts",           component: <DistrictList />,   roles: ROLES.ALL },
  { path: "/districts/:id/edit",  component: <DistrictEdit />,   roles: ROLES.ALL },

  // QR
  { path: "/qr",            component: <QR />,          roles: ROLES.ALL },
  { path: "/qrproduce",     component: <Produce />,     roles: ROLES.ALL },
  { path: "/qrconservation",component: <Conservation />,roles: ROLES.ALL },
  { path: "/qrfertilizer",  component: <Fertilizer />,  roles: ROLES.ALL },
  { path: "/qrexport",      component: <Export />,      roles: ROLES.ALL },

  // Reports
  { path: "/reportfarmer", component: <FarmReport />,   roles: ROLES.ALL },
  { path: "/reportcarbon", component: <CarbonReport />, roles: ROLES.ALL },

  // Sentinel Hub — indices spectraux
  { path: "/sentinel/farm/:farmId",   component: <SentinelDashboard entityType="farm" />,   roles: ROLES.FARM },
  { path: "/sentinel/forest/:forestId", component: <SentinelDashboard entityType="forest" />, roles: ROLES.FOREST },

  // Users
  { path: "/createUsers", component: <CreateUsers />,    roles: ROLES.ALL },
  { path: "/usermanager", component: <UserManagement />, roles: ROLES.ALL },

  // Category
  { path: "/categorymanager", component: <CategoryManager />, roles: ROLES.ALL },

  // Dashboard
  { path: "/userDash",       component: <UserDash />,        roles: ROLES.ALL },
  { path: "/alertmessage",   component: <AlertMessaging />,  roles: ROLES.ALL },
  { path: "/wbiidashboard",  component: <WBIIDashboard />,   roles: ROLES.ALL },

  // EUDR
  { path: "/EUDRSubmission",  component: <EUDRSubmitForm />,  roles: ROLES.ALL },
  { path: "/stats-certificate",component: <UserCertificate />,roles: ROLES.ALL },

  // Admin only
  { path: "/featuresManager", component: <FeatureManager />, roles: ROLES.ADMIN, adminOnly: true },
];

// =============================================================================
// APP
// =============================================================================
function App() {
  return (
    <BrowserRouter>
      {/* ── ThemeProvider : injecte les variables CSS NKUSU une seule fois ── */}
      <ThemeProvider />

      <Routes>
        {/* ── Routes publiques ─────────────────────────────────────────── */}
        <Route path="/"                       element={<Landipage />} />
        <Route path="/landipage"              element={<Landing />} />
        <Route path="/login"                  element={<Login />} />
        <Route path="/contactus"              element={<ContactUs />} />
        <Route path="/signup"                 element={<SignUp />} />
        <Route path="/barnav"                 element={<BarNav />} />
        <Route path="/payment-required"       element={<PaymentRequired />} />
        <Route path="/EUDRSubmissionForGuest" element={<EUDRSubmitFormForGuest />} />
        <Route path="/sectionfutur"           element={<SectionFutur />} />
        <Route path="/test"                   element={<TestMap />} />

        {/* ── Payment callbacks ────────────────────────────────────────── */}
        <Route path="/payment/success"   element={<PaymentSuccess />} />
        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
        <Route path="/payment/error"     element={<PaymentError />} />

        {/* ── Home protégé ─────────────────────────────────────────────── */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* ── Routes protégées avec rôles ──────────────────────────────── */}
        {layoutRoutes.map(({ path, component, roles, adminOnly = false, feature }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <UserTypeRoute allowedRoles={roles}>
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
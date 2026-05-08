import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { MdManageAccounts, MdDashboard, MdHistory, MdOutlineWaterDrop,
         MdOutlineWbSunny, MdOutlineWarningAmber, MdOutlineSms } from "react-icons/md";
import { FiLogOut, FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { FaTree, FaCloudSun, FaQrcode, FaFileContract, FaCrown, FaUser } from "react-icons/fa";
import { TbPlant2, TbMap2, TbChartBar } from "react-icons/tb";
import { RiPlantLine, RiMapPinLine } from "react-icons/ri";
import { BsCalendarDate, BsShop } from "react-icons/bs";
import { GiFarmer, GiForestCamp, GiWheat } from "react-icons/gi";
import { LuTreePine, LuScanLine } from "react-icons/lu";
import parrot from "../img/parrot.jpg";

// ─── Role badge config ────────────────────────────────────────
const ROLE_META = {
  weather: { Icon: FaCloudSun,  label: "Weather", color: "bg-sky-100 text-sky-700" },
  farmer:  { Icon: GiFarmer,    label: "Farmer",  color: "bg-emerald-100 text-emerald-700" },
  forest:  { Icon: LuTreePine,  label: "Forest",  color: "bg-green-100 text-green-700" },
  admin:   { Icon: FaCrown,     label: "Admin",   color: "bg-amber-100 text-amber-700" },
};

// ─── Nav menu definitions ─────────────────────────────────────
const buildMenus = (isAdmin, role) => {
  const isFarmer  = isAdmin || role === "farmer";
  const isForest  = isAdmin || role === "forest";
  const isWeather = isAdmin || role === "weather";
  const isAll     = isAdmin || ["weather", "farmer", "forest"].includes(role);

  return [
    {
      id: "forest", label: "Forest", Icon: LuTreePine,
      show: isForest,
      items: [
        { label: "Forest Data",  href: "/forestpage",  Icon: GiForestCamp },
        { label: "Tree Manager", href: "/treemanager", Icon: FaTree },
      ],
    },
    {
      id: "farm", label: "Farm", Icon: GiFarmer,
      show: isFarmer,
      items: [
        { label: "Farmer Group", href: "/farmergroup",         Icon: GiFarmer },
        { label: "Farm Manager", href: "/farmmanager",         Icon: RiPlantLine },
        { label: "Crop",         href: "/cropmanage",          Icon: GiWheat },
        { label: "District",     href: "/district",            Icon: TbMap2 },
        { label: "View All",     href: "/mapviewall",          Icon: RiMapPinLine, state: { owner_type: "farmer" } },
        { label: "Store",        href: "/storeProductManager", Icon: BsShop },
      ],
    },
    {
      id: "digital", label: "Digital Trace", Icon: LuScanLine,
      show: isAll,
      items: [
        { label: "Produce Stamps",             href: "/qrproduce",      Icon: FaQrcode },
        { label: "Forest Conservation Stamps", href: "/qrconservation", Icon: FaTree },
        { label: "Export Stamps",              href: "/qrexport",       Icon: LuScanLine },
        { label: "Fertilizer Stamps",          href: "/qrfertilizer",   Icon: TbPlant2 },
      ],
    },
    {
      id: "weather", label: "Weather", Icon: FaCloudSun,
      show: isWeather,
      items: [
        { label: "Map Weather",     href: "/weathermapfarm", Icon: TbMap2 },
        { label: "Weather History", href: "/weatherhistory", Icon: MdHistory },
        { label: "HDD & CDD",       href: "/onemonth",       Icon: MdOutlineWbSunny },
        { label: "GDD for Pest",    href: "/graphpest",      Icon: TbChartBar },
        { label: "Planting Date",   href: "/plantingdate",   Icon: BsCalendarDate },
        { label: "Anomaly Alert",   href: "/weatherdas",     Icon: MdOutlineWarningAmber },
        { label: "Alert Messaging", href: "/alertmessage",   Icon: MdOutlineSms },
        { label: "Water Advisory",  href: "/wateradvisory",  Icon: MdOutlineWaterDrop },
        { label: "Location Advisory", href: "/locationadvisory", Icon: RiMapPinLine },
      ],
    },
    {
      id: "dashboard", label: "Dashboard", Icon: MdDashboard,
      show: isAll,
      items: [
        { label: "Dashboard",      href: "/userDash",      Icon: MdDashboard },
        { label: "WBII Dashboard", href: "/wbiidashboard", Icon: TbChartBar },
        { label: "Admin Blog",     href: "/blogadmin",     Icon: FaFileContract },
        { label: "Public Blog",    href: "/blogpublic",    Icon: FaFileContract },
      ],
    },
    {
      id: "eudr", label: "DDS", Icon: FaFileContract,
      show: isAll,
      items: [
        { label: "DDS Submission", href: "/EUDRSubmission", Icon: FaFileContract },
      ],
    },
  ].filter((m) => m.show);
};

// ─── Desktop dropdown ─────────────────────────────────────────
const DesktopDropdown = ({ menu, active, onEnter, onLeave }) => {
  const location = useLocation();
  const isActive = menu.items.some((i) => i.href === location.pathname);

  return (
    <div
      className="relative"
      onMouseEnter={() => onEnter(menu.id)}
      onMouseLeave={() => onLeave(menu.id)}
    >
      <button
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-all duration-200
          ${isActive
            ? "bg-white/20 text-white"
            : "text-white/85 hover:text-white hover:bg-white/10"}`}
      >
        <menu.Icon className="text-base shrink-0" />
        <span>{menu.label}</span>
        <FiChevronDown
          className={`text-xs transition-transform duration-200 ${active ? "rotate-180" : ""}`}
        />
      </button>

      {active && (
        <div
          className="dropdown absolute top-full left-0 mt-1 w-56 bg-white rounded-xl
                     shadow-2xl border border-gray-100 overflow-hidden z-50"
          style={{ animation: "fadeInDown 0.15s ease" }}
        >
          {menu.items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              state={item.state}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150
                ${location.pathname === item.href
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"}`}
            >
              <item.Icon className="text-base shrink-0 opacity-60" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Mobile accordion ─────────────────────────────────────────
const MobileAccordion = ({ menu, open, onToggle, onNavigate }) => {
  const location = useLocation();
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => onToggle(menu.id)}
        className="w-full flex items-center justify-between px-4 py-3 text-white/90 text-sm font-medium"
      >
        <span className="flex items-center gap-2.5">
          <menu.Icon className="text-base opacity-80" />
          {menu.label}
        </span>
        <FiChevronDown
          className={`text-xs transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="bg-white/5 pb-1">
          {menu.items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              state={item.state}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors
                ${location.pathname === item.href
                  ? "text-teal-300 font-semibold"
                  : "text-white/65 hover:text-white"}`}
            >
              <item.Icon className="text-base shrink-0 opacity-60" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────
const Layout = ({ children }) => {
  const [userRole,       setUserRole]       = useState(null);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [openMenu,       setOpenMenu]       = useState(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const hoverTimeout = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.sub?.user_type || "");
        setIsAdmin(decoded.sub?.is_admin   || false);
      } catch {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const menus = useMemo(() => buildMenus(isAdmin, userRole), [isAdmin, userRole]);

  const handleEnter = (id) => {
    clearTimeout(hoverTimeout.current);
    setOpenMenu(id);
  };
  const handleLeave = () => {
    hoverTimeout.current = setTimeout(() => setOpenMenu(null), 180);
  };

  const handleLogOut = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const meta     = isAdmin ? ROLE_META.admin : (ROLE_META[userRole] || { Icon: FaUser, label: userRole || "User", color: "bg-gray-100 text-gray-600" });
  const RoleIcon = meta.Icon;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ══ HEADER ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-teal-800 via-teal-700 to-blue-800 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/30
                            group-hover:ring-white/60 transition-all duration-300 shadow-md">
              <img src={parrot} alt="Nkusu" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight
                             group-hover:text-teal-200 transition-colors duration-200">
              Nkusu
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {menus.map((menu) => (
              <DesktopDropdown
                key={menu.id}
                menu={menu}
                active={openMenu === menu.id}
                onEnter={handleEnter}
                onLeave={handleLeave}
              />
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {(userRole || isAdmin) && (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                <RoleIcon className="text-sm" />
                {meta.label}
              </span>
            )}
            {isAdmin && (
              <>
                <Link to="/usermanager"
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm
                             px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                  <MdManageAccounts className="text-base" />
                  <span>Users</span>
                </Link>
                <Link to="/featuresManager"
                  className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm
                             px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all">
                  <MdManageAccounts className="text-base" />
                  <span>Features</span>
                </Link>
              </>
            )}
            <button
              onClick={handleLogOut}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white
                         text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200
                         border border-white/20 hover:border-white/40"
            >
              <FiLogOut />
              <span>Log Out</span>
            </button>
          </div>

          {/* Mobile right */}
          <div className="flex lg:hidden items-center gap-2">
            {(userRole || isAdmin) && (
              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                <RoleIcon className="text-sm" />
                <span className="hidden sm:inline">{meta.label}</span>
              </span>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* ══ MOBILE DRAWER ════════════════════════════════════════ */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-teal-800/97 backdrop-blur-sm
                          max-h-[80vh] overflow-y-auto">
            {(userRole || isAdmin) && (
              <div className="px-4 py-3 border-b border-white/10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                  <RoleIcon className="text-sm" />
                  {meta.label}
                </span>
              </div>
            )}

            {menus.map((menu) => (
              <MobileAccordion
                key={menu.id}
                menu={menu}
                open={mobileExpanded === menu.id}
                onToggle={(id) => setMobileExpanded((v) => (v === id ? null : id))}
                onNavigate={() => { setMobileOpen(false); setMobileExpanded(null); }}
              />
            ))}

            {isAdmin && (
              <div className="border-t border-white/10 px-4 py-3 space-y-1">
                <Link to="/usermanager" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm py-2">
                  <MdManageAccounts className="text-base" /> User Manager
                </Link>
                <Link to="/featuresManager" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-white/80 hover:text-white text-sm py-2">
                  <MdManageAccounts className="text-base" /> Feature Manager
                </Link>
              </div>
            )}

            <div className="px-4 py-3 border-t border-white/10">
              <button
                onClick={handleLogOut}
                className="w-full flex items-center justify-center gap-2 bg-white/10
                           hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5
                           rounded-lg transition-all border border-white/20"
              >
                <FiLogOut /> Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══ PAGE CONTENT ═════════════════════════════════════════ */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Layout;
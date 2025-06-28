import {
  FaCloudSun,
  FaSeedling,
  FaMapMarkedAlt,
  FaChartLine,
  FaBell,
  FaUserShield,
} from "react-icons/fa";

const servicesList = [
  {
    icon: <FaCloudSun className="text-4xl mb-4 text-yellow-500" />,
    title: "Weather Forecasts",
    description: "Plan your agricultural tasks better with accurate and up-to-date weather data.",
    color: "bg-yellow-50",
  },
  {
    icon: <FaSeedling className="text-4xl mb-4 text-green-500" />,
    title: "Climate-Based Calculations",
    description: "Automated ET₀, ETc, GDD, and more based on your location and crops.",
    color: "bg-green-50",
  },
  {
    icon: <FaMapMarkedAlt className="text-4xl mb-4 text-blue-500" />,
    title: "Interactive Map",
    description: "Explore real-time weather and crop insights directly on the map.",
    color: "bg-blue-50",
  },
  {
    icon: <FaChartLine className="text-4xl mb-4 text-purple-500" />,
    title: "Crop Monitoring",
    description: "Track planting dates, harvests, and yields with visual reports.",
    color: "bg-purple-50",
  },
  {
    icon: <FaBell className="text-4xl mb-4 text-red-500" />,
    title: "Smart Alerts",
    description: "Receive timely notifications on pests and extreme weather events.",
    color: "bg-red-50",
  },
  {
    icon: <FaUserShield className="text-4xl mb-4 text-pink-500" />,
    title: "Secure Access",
    description: "Separate roles for admin and farmers to keep everything secure.",
    color: "bg-pink-50",
  },
];

const SectionOverview = () => {
  return (
    <section
      className="bg-gradient-to-r from-teal-50 via-emerald-50 to-lime-50 py-20 px-6 font-sans"
      id="overview"
    >
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl font-extrabold mb-4 text-emerald-700">
          Explore Nkusu's Tools
        </h2>
        <p className="text-lg text-gray-600 mb-14 max-w-2xl mx-auto">
          Nkusu provides modern tools that empower farmers to make climate-smart decisions, improve productivity, and protect their crops.
        </p>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {servicesList.map((item, index) => (
            <div
              key={index}
              className={`${item.color} p-8 rounded-3xl border border-gray-200 shadow-md hover:shadow-lg hover:scale-105 transition duration-300`}
            >
              {item.icon}
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-700 text-base">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionOverview;

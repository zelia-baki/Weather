import React from "react";
import { Link } from "react-router-dom";
import { GiWheat, GiForestCamp } from "react-icons/gi";
import { FaFileExport, FaFlask } from "react-icons/fa";
import { TbQrcode } from "react-icons/tb";
import { FiArrowRight } from "react-icons/fi";

const CARDS = [
  {
    title:       "Produce Stamps",
    description: "Generate digital traceability codes for farm produce — weight, price per kg, and total value are auto-computed.",
    link:        "/qrproduce",
    button:      "Generate Produce Codes",
    bg:          "from-emerald-50 to-teal-50",
    border:      "border-emerald-200",
    iconBg:      "bg-emerald-100",
    iconColor:   "text-emerald-600",
    Icon:        GiWheat,
  },
  {
    title:       "Forest Conservation Stamps",
    description: "Generate codes for tree cutting records — forest name, tree type, GPS coordinates, height and diameter.",
    link:        "/qrconservation",
    button:      "Generate Tree Cutting Codes",
    bg:          "from-green-50 to-emerald-50",
    border:      "border-green-200",
    iconBg:      "bg-green-100",
    iconColor:   "text-green-700",
    Icon:        GiForestCamp,
  },
  {
    title:       "Digital Export Stamps",
    description: "Generate EUDR-compliant export stamps. Supports multiple farms contributing quantities in a single QR.",
    link:        "/qrexport",
    button:      "Generate Export Codes",
    bg:          "from-blue-50 to-indigo-50",
    border:      "border-blue-200",
    iconBg:      "bg-blue-100",
    iconColor:   "text-blue-700",
    Icon:        FaFileExport,
  },
  {
    title:       "Fertilizer Stamps",
    description: "Generate codes for fertilizer and pesticide applications. Total weight and price auto-computed per farm.",
    link:        "/qrfertilizer",
    button:      "Generate Fertilizer Codes",
    bg:          "from-amber-50 to-yellow-50",
    border:      "border-amber-200",
    iconBg:      "bg-amber-100",
    iconColor:   "text-amber-700",
    Icon:        FaFlask,   // ← FaFlask (valide) au lieu de MdOutlineFertilizer (inexistant)
  },
];

const GenerateQrCode = () => (
  <div className="bg-gradient-to-br from-teal-50 via-white to-gray-50 min-h-screen py-12 px-4">
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-lg">
          <TbQrcode size={28} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-3">Generate Digital Codes</h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          Choose a stamp type to generate QR codes for your agricultural traceability records.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CARDS.map((card) => (
          <div
            key={card.link}
            className={`bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-6
                        shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <card.Icon size={22} className={card.iconColor} />
                </div>
                <h2 className="text-lg font-bold text-gray-800 leading-snug pt-1">{card.title}</h2>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{card.description}</p>
            </div>

            <Link
              to={card.link}
              className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl
                          bg-white border ${card.border} text-sm font-semibold text-gray-700
                          hover:bg-teal-600 hover:text-white hover:border-teal-600
                          transition-all duration-200 group`}
            >
              {card.button}
              <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default GenerateQrCode;
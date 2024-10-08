import React from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling } from 'react-icons/fa';
import 'tailwindcss/tailwind.css';

const GenerateQrCode = () => {
  const Card = ({ title, description, link, buttonText, bgColor, hoverColor, icon, iconColor }) => (
    <div className={`p-6 sm:p-8 lg:p-10 rounded-lg border border-gray-200 shadow-lg transform transition-transform hover:scale-105 hover:shadow-xl ${bgColor} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center mb-4 sm:mb-6">
          <div className={`text-4xl sm:text-5xl mr-3 sm:mr-4 ${iconColor}`}>{icon}</div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg">{description}</p>
      </div>
      <Link to={link} className={`bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors ${hoverColor}`}>
        {buttonText}
      </Link>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-6 sm:p-10 font-sans">
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-8 sm:mb-12 text-teal-800">Generate Digital Codes</h1>
        <p className="text-gray-700 text-lg sm:text-2xl mb-8 sm:mb-14">Choose an option below to get started:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          <Card
            title="Produce Stamps"
            description="Generate Digital codes for a farm with details such as weight, price per kg, and total value."
            link="/qrproduce"
            buttonText="Generate Farm Digital Codes"
            bgColor="bg-green-100"
            hoverColor="bg-green-200 hover:bg-green-300"
            icon={<FaSeedling />}
            iconColor="text-green-600"
          />
          <Card
            title="Forest Conservation Stamps"
            description="Generate Digital codes for marking tree cuttings with details such as forest name, tree type, and GPS coordinates."
            link="/qrconservation"
            buttonText="Generate Tree Cutting Digital Codes"
            bgColor="bg-blue-100"
            hoverColor="bg-blue-200 hover:bg-blue-300"
            icon={<FaTree />}
            iconColor="text-green-700"
          />
          <Card
            title="Digital Export Stamps"
            description="Generate EUDR export stamps for a specified farm. Upload a zip file containing the Export stamps codes images."
            link="/qrexport"
            buttonText="Generate Export Digital Codes"
            bgColor="bg-red-100"
            hoverColor="bg-red-200 hover:bg-red-300"
            icon={<FaQrcode />}
            iconColor="text-purple-600"
          />
          <Card
            title="Fertilizer Stamps"
            description="Generate Digital codes for fertilizers."
            link="/qrconservation"
            buttonText="Generate Digital Codes"
            bgColor="bg-yellow-100"
            hoverColor="bg-blue-200 hover:bg-blue-300"
            icon={<FaTree />}
            iconColor="text-green-700"
          />
        </div>
      </div>
    </div>
  );
};

export default GenerateQrCode;

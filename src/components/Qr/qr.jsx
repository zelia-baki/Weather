import React from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaQrcode, FaSeedling } from 'react-icons/fa';
import 'tailwindcss/tailwind.css';

const GenerateQrCode = () => {
  const Card = ({ title, description, link, buttonText, bgColor, hoverColor, icon, iconColor }) => (
    <div className={`p-8 rounded-lg border border-gray-200 shadow-lg transform transition-transform hover:scale-105 hover:shadow-xl ${bgColor} flex flex-col justify-between`}>
      <div>
        <div className="flex items-center mb-6">
          <div className={`text-5xl mr-4 ${iconColor}`}>{icon}</div>
          <h2 className="text-3xl font-semibold text-gray-800">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6 text-lg">{description}</p>
      </div>
      <Link to={link} className={`bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg transition-colors ${hoverColor}`}>
        {buttonText}
      </Link>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-10 font-sans">
      <div className="text-center max-w-5xl mx-auto">
        <h1 className="text-6xl font-extrabold mb-12 text-teal-800">Generate Digital Codes</h1>
        <p className="text-gray-700 text-2xl mb-14">Choose an option below to get started:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <Card
            title="Produce Stamps"
            description="Generate Digital codes for a farm with details such as weight, price per kg, and total value."
            link="/qr/generate_farmer_qr"
            buttonText="Generate Farm Digital Codes"
            bgColor="bg-green-100"
            hoverColor="bg-green-200 hover:bg-green-300"
            icon={<FaSeedling />}
            iconColor="text-green-600"
          />
          <Card
            title="Forest Conservation Stamps"
            description="Generate Digital codes for marking tree cuttings with details such as forest name, tree type, and GPS coordinates."
            link="/qr/generate_tree_qr"
            buttonText="Generate Tree Cutting Digital Codes"
            bgColor="bg-blue-100"
            hoverColor="bg-blue-200 hover:bg-blue-300"
            icon={<FaTree />}
            iconColor="text-green-700"
          />
          <Card
            title="Digital Export Stamps"
            description="Generate EUDR export stamps for a specified farm. Upload a zip file containing the Export stamps codes images."
            link="/qr/generate_qr"
            buttonText="Generate Export Digital Codes"
            bgColor="bg-red-100"
            hoverColor="bg-red-200 hover:bg-red-300"
            icon={<FaQrcode />}
            iconColor="text-purple-600"
          />
        </div>
      </div>
    </div>
  );
};

export default GenerateQrCode;

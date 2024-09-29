import React, { useState } from 'react';
import CropModal from './CropModal';
import { Link } from 'react-router-dom';
import { FaSeedling, FaWater, FaLeaf, FaClipboard } from 'react-icons/fa'; // Import icons

const CreateCrop = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-200 p-6 font-sans">
            <CropModal isOpen={isModalOpen} onClose={handleCloseModal} />
            
            {/* Create Crop Button */}
            {/* <button
                onClick={handleOpenModal}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-full shadow-lg mb-8 transition-transform transform hover:scale-105 duration-300"
            >
                Create Crop
            </button> */}
            
            {/* Card Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 w-full max-w-4xl">
                {/* Crop Manager Card */}
                <Link 
                    to="/cropmanager" 
                    className="bg-blue-100 text-gray-800 shadow-lg rounded-lg p-8 border-l-4 border-blue-400 hover:bg-blue-200 transition-transform transform hover:scale-105 duration-300"
                >
                    <div className="flex items-center space-x-4">
                        <FaSeedling className="text-green-600 text-4xl" /> {/* Icon */}
                        <h3 className="text-2xl font-bold">Crop Manager</h3>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg">Manage and organize crops effectively.</p>
                </Link>
                
                {/* Irrigation Manager Card */}
                <Link 
                    to="/irrigationmanager" 
                    className="bg-yellow-100 text-gray-800 shadow-lg rounded-lg p-8 border-l-4 border-yellow-400 hover:bg-yellow-200 transition-transform transform hover:scale-105 duration-300"
                >
                    <div className="flex items-center space-x-4">
                        <FaWater className="text-blue-600 text-4xl" /> {/* Icon */}
                        <h3 className="text-2xl font-bold">Irrigation Manager</h3>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg">Oversee and control irrigation systems.</p>
                </Link>
                
                {/* Crop Coefficient Manager Card */}
                <Link 
                    to="/cropcoefficientmanager" 
                    className="bg-green-100 text-gray-800 shadow-lg rounded-lg p-8 border-l-4 border-green-400 hover:bg-green-200 transition-transform transform hover:scale-105 duration-300"
                >
                    <div className="flex items-center space-x-4">
                        <FaLeaf className="text-green-600 text-4xl" /> {/* Icon */}
                        <h3 className="text-2xl font-bold">Crop Coefficient Manager</h3>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg">Manage crop coefficient data for better insights.</p>
                </Link>
                
                {/* Grade Manager Card */}
                <Link 
                    to="/grademanager"
                    className="bg-gray-100 text-gray-800 shadow-lg rounded-lg p-8 border-l-4 border-gray-400 hover:bg-gray-200 transition-transform transform hover:scale-105 duration-300"
                >
                    <div className="flex items-center space-x-4">
                        <FaClipboard className="text-purple-600 text-4xl" /> {/* Icon */}
                        <h3 className="text-2xl font-bold">Grade Manager</h3>
                    </div>
                    <p className="mt-4 text-gray-600 text-lg">Handle grading of crops for quality control.</p>
                </Link>
            </div>
        </div>
    );
};

export default CreateCrop;

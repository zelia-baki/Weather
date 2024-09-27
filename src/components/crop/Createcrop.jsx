import React, { useState } from 'react';
import CropModal from './CropModal'; // Import the CropModal component
import CropList from './CropList'; // Import the CropList component
import { Link } from 'react-router-dom'; // Import Link for routing


const CreateCrop = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div>
            <CropModal isOpen={isModalOpen} onClose={handleCloseModal} />
            <button
                onClick={handleOpenModal}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Create Crop
            </button>
            <br></br>

            {/* <CropList /> */}
            <Link 
                to="/cropmanager" 
                className="text-blue-500 hover:underline mt-4 inline-block"
            >
                Crop Manager
            </Link>
            <br></br>
            <Link 
                to="/irrigationmanager" 
                className="text-blue-500 hover:underline mt-4 inline-block"
            >
                Irrigation Manager
            </Link>
            <br></br>

            <Link 
                to="/cropcoefficientmanager" 
                className="text-blue-500 hover:underline mt-4 inline-block"
            >
            Crop Coefficientmanager
            </Link>
            <br></br>

            <Link 
                to="/grademanager"
                className="text-blue-500 hover:underline mt-4 inline-block"
            >
            Grade Manager
            </Link>

        </div>
    );
};

export default CreateCrop;

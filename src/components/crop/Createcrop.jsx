import React, { useState } from 'react';
import CropModal from './CropModal'; // Import the CropModal component
import CropList from './CropList'; // Import the CropList component

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
            <CropList />

        </div>
    );
};

export default CreateCrop;

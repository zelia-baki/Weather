import React, { useState } from 'react';
import FarmModal from './FarmModal';
import FarmList from './FarmList'; // Import the FarmList component

const Create = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Create Farm
            </button>

            <FarmModal isOpen={isModalOpen} onClose={handleCloseModal} />

            {/* Display the FarmList component */}
            <FarmList />
        </div>
    );
};

export default Create;

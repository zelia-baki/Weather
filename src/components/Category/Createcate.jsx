import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import CateModal from './CateModal'; 
import CateList from './CateList';


const Createcate = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div>
             <CateModal isOpen={isModalOpen} onClose={handleCloseModal} />
            <button
                onClick={handleOpenModal}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
                Create Produce Category
            </button>

            <CateList />
        </div>
    );
};

export default Createcate;
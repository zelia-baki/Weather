import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
                <button onClick={onClose} className="text-right text-gray-500 hover:text-gray-700">
                    Close
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { IoClose, IoCheckmark } from 'react-icons/io5';

const FarmModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        subcounty: '',
        district_id: '',
        farmergroup_id: '',
        longitude: '',
        latitude: '',
        phonenumber1: '',
        phonenumber2: '',
    });

    const [districts, setDistricts] = useState({});
    const [farmerGroups, setFarmerGroups] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchDistricts();
            fetchFarmerGroups();
        }
    }, [isOpen]);

    const fetchDistricts = async () => {
        try {
            const response = await axiosInstance.get('/api/district/');
            const districtsMap = response.data.districts.reduce((acc, district) => {
                acc[district.id] = district.name;
                return acc;
            }, {});
            setDistricts(districtsMap);
        } catch (error) {
            console.error('Error fetching districts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFarmerGroups = async () => {
        try {
            const response = await axiosInstance.get('/api/farmergroup/');
            const farmerGroupsMap = response.data.reduce((acc, group) => {
                acc[group.id] = group.name;
                return acc;
            }, {});
            setFarmerGroups(farmerGroupsMap);
        } catch (error) {
            console.error('Error fetching farmer groups:', error);
        }
    };
    
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/api/farm/create', formData);
            onClose(); // Close the modal after successful submission
        } catch (error) {
            console.error('Error creating farm:', error);
        }
    };
    
    return (
        <div id="farmModal" className={`fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-4 md:mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-indigo-700">Créer une Ferme</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <IoClose size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Nom de la Ferme :</label>
                            <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="subcounty" className="block text-gray-700 text-sm font-semibold mb-2">Sous-comté :</label>
                            <input type="text" id="subcounty" name="subcounty" required value={formData.subcounty} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="district_id" className="block text-gray-700 text-sm font-semibold mb-2">District :</label>
                            <select id="district_id" name="district_id" value={formData.district_id} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Aucun</option>
                                {/* Replace with dynamic options */}
                                <option value="1">District 1</option>
                                <option value="2">District 2</option>
                            </select>
                        </div>
                        <div className="relative">
                            <label htmlFor="farmergroup_id" className="block text-gray-700 text-sm font-semibold mb-2">Groupe de Fermiers :</label>
                            <select id="farmergroup_id" name="farmergroup_id" required value={formData.farmergroup_id} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Aucun</option>
                                {/* Replace with dynamic options */}
                                <option value="1">Groupe de Fermiers 1</option>
                                <option value="2">Groupe de Fermiers 2</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="longitude" className="block text-gray-700 text-sm font-semibold mb-2">Longitude :</label>
                            <input type="text" id="longitude" name="longitude" required value={formData.longitude} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="latitude" className="block text-gray-700 text-sm font-semibold mb-2">Latitude :</label>
                            <input type="text" id="latitude" name="latitude" required value={formData.latitude} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="phonenumber1" className="block text-gray-700 text-sm font-semibold mb-2">Numéro de Téléphone 1 :</label>
                            <input type="text" id="phonenumber1" name="phonenumber1" value={formData.phonenumber1} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="phonenumber2" className="block text-gray-700 text-sm font-semibold mb-2">Numéro de Téléphone 2 :</label>
                            <input type="text" id="phonenumber2" name="phonenumber2" value={formData.phonenumber2} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4">
                        <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow-md flex items-center space-x-2 transition duration-150 ease-in-out">
                            <IoClose size={20} />
                            <span>Annuler</span>
                        </button>
                        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded shadow-md flex items-center space-x-2 transition duration-150 ease-in-out">
                            <IoCheckmark size={20} />
                            <span>Créer la Ferme</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FarmModal;

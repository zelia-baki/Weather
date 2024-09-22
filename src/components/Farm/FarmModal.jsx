import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import { IoClose, IoCheckmark } from 'react-icons/io5';

const FarmModal = ({ isOpen, onClose, setUpdateFlag }) => {
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
    const [loadingDistricts, setLoadingDistricts] = useState(true);
    const [loadingFarmerGroups, setLoadingFarmerGroups] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchDistricts();
            fetchFarmerGroups();
            resetForm(); // Resets the form when the modal opens
        }
    }, [isOpen]);

    const fetchDistricts = async () => {
        setLoadingDistricts(true);
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
            setLoadingDistricts(false);
        }
    };

    const fetchFarmerGroups = async () => {
        setLoadingFarmerGroups(true);
        try {
            const response = await axiosInstance.get('/api/farmergroup/');
            const farmerGroupsMap = response.data.reduce((acc, group) => {
                acc[group.id] = group.name;
                return acc;
            }, {});
            setFarmerGroups(farmerGroupsMap);
        } catch (error) {
            console.error('Error fetching farmer groups:', error);
        } finally {
            setLoadingFarmerGroups(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            subcounty: '',
            district_id: '',
            farmergroup_id: '',
            longitude: '',
            latitude: '',
            phonenumber1: '',
            phonenumber2: '',
        });
        setError(null);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
    
        // Create geolocation string
        const formWithGeo = {
            ...formData,
            geolocation: `${formData.latitude},${formData.longitude}`,
        };
    
        try {
            const response = await axiosInstance.post('/api/farm/create', formWithGeo);
            if (response.data.success) {
                console.log('Farm created successfully');
                setUpdateFlag(prev => !prev); // Update flag to refresh data
                resetForm();
                onClose(); // Close the modal
            } else {
                setError('Failed to create farm. Please try again.');
            }
        } catch (error) {
            console.error('Error creating farm:', error);
            setError('An error occurred while creating the farm.');
        } finally {
            setSubmitting(false);
        }
    };
    

    return (
        <div id="farmModal" className={`fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpen ? 'flex' : 'hidden'} items-center justify-center`}>
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-4 md:mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-indigo-700">Create a Farm</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
                        <IoClose size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Farm Name:</label>
                            <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="subcounty" className="block text-gray-700 text-sm font-semibold mb-2">Subcounty:</label>
                            <input type="text" id="subcounty" name="subcounty" required value={formData.subcounty} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="district_id" className="block text-gray-700 text-sm font-semibold mb-2">District:</label>
                            {loadingDistricts ? (
                                <p>Loading districts...</p>
                            ) : (
                                <select id="district_id" name="district_id" required value={formData.district_id} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">None</option>
                                    {Object.entries(districts).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="relative">
                            <label htmlFor="farmergroup_id" className="block text-gray-700 text-sm font-semibold mb-2">Farmer Group:</label>
                            {loadingFarmerGroups ? (
                                <p>Loading farmer groups...</p>
                            ) : (
                                <select id="farmergroup_id" name="farmergroup_id" required value={formData.farmergroup_id} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">None</option>
                                    {Object.entries(farmerGroups).map(([id, name]) => (
                                        <option key={id} value={id}>{name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="longitude" className="block text-gray-700 text-sm font-semibold mb-2">Longitude:</label>
                            <input type="text" id="longitude" name="longitude" required value={formData.longitude} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="latitude" className="block text-gray-700 text-sm font-semibold mb-2">Latitude:</label>
                            <input type="text" id="latitude" name="latitude" required value={formData.latitude} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <label htmlFor="phonenumber1" className="block text-gray-700 text-sm font-semibold mb-2">Phone Number 1:</label>
                            <input type="text" id="phonenumber1" name="phonenumber1" value={formData.phonenumber1} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="phonenumber2" className="block text-gray-700 text-sm font-semibold mb-2">Phone Number 2:</label>
                            <input type="text" id="phonenumber2" name="phonenumber2" value={formData.phonenumber2} onChange={handleChange} className="shadow-sm appearance-none border rounded w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={submitting} className="bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition">
                            {submitting ? 'Submitting...' : (
                                <div className="flex items-center">
                                    <IoCheckmark size={20} className="mr-2" />
                                    <span>Submit</span>
                                </div>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FarmModal;

import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { useParams } from 'react-router-dom';

const DistrictView = () => {
    const { id } = useParams();
    const [district, setDistrict] = useState(null);

    useEffect(() => {
        const fetchDistrict = async () => {
            try {
                const response = await axiosInstance.get(`/api/district/${id}`);
                setDistrict(response.data);
            } catch (error) {
                console.error('Error fetching district:', error);
            }
        };

        fetchDistrict();
    }, [id]);

    if (!district) return <p>Loading...</p>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">District Details</h1>
            <p><span className="font-bold">Name:</span> {district.name}</p>
            <p><span className="font-bold">Region:</span> {district.region}</p>
            {/* Add other details as needed */}
        </div>
    );
};

export default DistrictView;

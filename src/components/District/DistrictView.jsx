import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';

const DistrictView = ({ id }) => {
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
        <div>
            <h1 className="text-2xl font-extrabold mb-4 text-center text-teal-700">District Details</h1>
            <p><span className="font-bold">Name:</span> {district.name}</p>
            <p><span className="font-bold">Region:</span> {district.region}</p>
            {/* Add other details as needed */}
        </div>
    );
};

export default DistrictView;

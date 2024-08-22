import React, { useState, useEffect } from 'react';
import axiosInstance from '../../axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import DistrictEdit from './DistrictEdit';

const MySwal = withReactContent(Swal);

const DistrictList = () => {
  const [districts, setDistricts] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      const response = await axiosInstance.get('/api/district/');
      setDistricts(response.data.districts);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/api/district/${id}/`);
      setDistricts(districts.filter(district => district.id !== id));
    } catch (error) {
      console.error('Error deleting district:', error);
    }
  };

  const handleView = async (id) => {
    try {
      MySwal.fire({
        title: 'Loading...',
        text: 'Fetching district details',
        allowOutsideClick: false,
        didOpen: () => {
          MySwal.showLoading();
        }
      });

      const { data } = await axiosInstance.get(`/api/district/${id}`);
      MySwal.fire({
        title: 'District Details',
        html: `<div>
            <p><span class="font-bold">Name:</span> ${data.name}</p>
            <p><span class="font-bold">Region:</span> ${data.region}</p>
          </div>`,
        showCancelButton: true,
        cancelButtonText: 'Close',
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error fetching district details:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to fetch district details. Please try again later.',
      });
    }
  };

  const handleEdit = async (id) => {
    try {
      const { data } = await axiosInstance.get(`/api/district/${id}`);
  
      MySwal.fire({
        title: 'Edit District',
        html: (
          <DistrictEdit
            id={id}
            onSave={async (updatedDistrict) => {
              try {
                await axiosInstance.put(`/api/district/${id}/`, updatedDistrict);
                fetchDistricts();
              } catch (error) {
                console.error('Error updating district:', error);
              }
            }}
            onClose={() => MySwal.close()}  // Ajout du bouton close
          />
        ),
        showConfirmButton: false,
        width: '600px',
        didOpen: () => {
          // Ajuster les styles de SweetAlert2 si nécessaire
        }
      });
    } catch (error) {
      console.error('Error fetching district for editing:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to fetch district for editing. Please try again later.',
      });
    }
  };

  const handleCreate = () => {
    MySwal.fire({
      title: 'Create District',
      html: (
        <DistrictEdit
          onSave={async (newDistrict) => {
            try {
              await axiosInstance.post('/api/district/', newDistrict);
              fetchDistricts();
            } catch (error) {
              console.error('Error creating district:', error);
            }
          }}
          onClose={() => MySwal.close()}  // Ajout du bouton close
        />
      ),
      showConfirmButton: false,
      width: '600px',
      didOpen: () => {
        // Ajuster les styles de SweetAlert2 si nécessaire
      }
    });
  };

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-teal-700">Districts</h1>
      <ul className="mt-4 bg-white rounded-lg shadow-lg">
        {districts.map((district) => (
          <li
            key={district.id}
            className="border-b border-gray-200 py-2 px-4 flex justify-between items-center"
          >
            <span>{district.name} - {district.region}</span>
            <div className="relative">
              <button
                onClick={() => toggleDropdown(district.id)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1 px-2 rounded"
              >
                Actions
              </button>
              {dropdownOpen === district.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <ul>
                    <li>
                      <button
                        onClick={() => handleView(district.id)}
                        className="block px-4 py-2 text-blue-500 hover:bg-gray-100 w-full text-left"
                      >
                        View
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleEdit(district.id)}
                        className="block px-4 py-2 text-blue-500 hover:bg-gray-100 w-full text-left"
                      >
                        Edit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleDelete(district.id)}
                        className="block px-4 py-2 text-red-500 hover:bg-gray-100 w-full text-left"
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    
    </div>
  );
};

export default DistrictList;

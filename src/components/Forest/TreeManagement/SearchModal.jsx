// components/TreeManagement/SearchModal.jsx
import React, { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';

const SearchModal = ({ onClose, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('coordinates');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, searchType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Search Location
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchType('coordinates')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  searchType === 'coordinates'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Coordinates
              </button>
              <button
                onClick={() => setSearchType('address')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                  searchType === 'address'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Address
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {searchType === 'coordinates' ? 'Enter Coordinates (lat,lng)' : 'Enter Address'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={searchType === 'coordinates' ? '-18.8792, 47.5079' : 'Antananarivo, Madagascar'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {searchType === 'coordinates'
                ? 'Format: latitude, longitude (e.g., -18.8792, 47.5079)'
                : 'Enter city, address, or place name'}
            </p>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            <Search className="w-5 h-5 inline mr-2" />
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

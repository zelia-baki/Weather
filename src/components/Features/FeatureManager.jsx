import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';

const FeatureManager = () => {
  const [featurePrices, setFeaturePrices] = useState([]);
  const [accessRecords, setAccessRecords] = useState([]);
  const [featureFormData, setFeatureFormData] = useState({
    feature_name: '',
    price: '',
    duration_days: '',
    usage_limit: ''
  });
  const [accessFormData, setAccessFormData] = useState({
    user_id: '',
    guest_phone_number: '',
    feature_name: '',
    txn_id: '',
    payment_status: 'pending',
    access_expires_at: '',
    usage_left: ''
  });
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [editingAccessId, setEditingAccessId] = useState(null);

  useEffect(() => {
    fetchFeaturePrices();
    fetchAccessRecords();
  }, []);

  const fetchFeaturePrices = async () => {
    try {
      const res = await axiosInstance.get('/api/feature/price/');
      setFeaturePrices(res.data);
    } catch (err) {
      console.error('Error fetching feature prices:', err);
    }
  };

  const fetchAccessRecords = async () => {
    try {
      const res = await axiosInstance.get('/api/feature/access/');
      setAccessRecords(res.data);
    } catch (err) {
      console.error('Error fetching access records:', err);
    }
  };

  const handleFeatureChange = (e) => {
    const { name, value } = e.target;
    setFeatureFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccessChange = (e) => {
    const { name, value } = e.target;
    setAccessFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFeatureId) {
        await axiosInstance.put(`/api/feature/price/${editingFeatureId}/edit`, featureFormData);
      } else {
        await axiosInstance.post('/api/feature/price/create', featureFormData);
      }
      setFeatureFormData({ feature_name: '', price: '' });
      setEditingFeatureId(null);
      fetchFeaturePrices();
    } catch (err) {
      console.error('Error saving feature price:', err);
    }
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccessId) {
        await axiosInstance.put(`/api/feature/access/${editingAccessId}/edit`, accessFormData);
      } else {
        await axiosInstance.post('/api/feature/access/create', accessFormData);
      }
      setAccessFormData({
        user_id: '',
        guest_phone_number: '',
        feature_name: '',
        txn_id: '',
        payment_status: 'pending',
        access_expires_at: '',
        usage_left: ''
      });
      setEditingAccessId(null);
      fetchAccessRecords();
    } catch (err) {
      console.error('Error saving access:', err);
    }
  };

  const handleEditFeature = (item) => {
    setFeatureFormData({
      feature_name: item.feature_name,
      price: item.price,
      duration_days: item.duration_days ?? '',
      usage_limit: item.usage_limit ?? ''
    });
    setEditingFeatureId(item.id);
  };


  const handleEditAccess = (item) => {
    setAccessFormData({ ...item });
    setEditingAccessId(item.id);
  };

  const handleDeleteFeature = async (id) => {
    try {
      await axiosInstance.delete(`/api/feature/price/${id}/delete`);
      fetchFeaturePrices();
    } catch (err) {
      console.error('Error deleting feature price:', err);
    }
  };

  const handleDeleteAccess = async (id) => {
    try {
      await axiosInstance.delete(`/api/feature/access/${id}/delete`);
      fetchAccessRecords();
    } catch (err) {
      console.error('Error deleting access:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Feature Manager</h2>

      {/* FeaturePrice Form */}
      <form onSubmit={handleFeatureSubmit} className="mb-4">
        <input type="text" name="feature_name" value={featureFormData.feature_name} onChange={handleFeatureChange} placeholder="Feature Name" className="border p-2 rounded mr-2" required />
        <input type="number" name="price" value={featureFormData.price} onChange={handleFeatureChange} placeholder="Price" className="border p-2 rounded mr-2" required />
        <input
          type="number"
          name="duration_days"
          value={featureFormData.duration_days}
          onChange={handleFeatureChange}
          placeholder="Duration in days"
          className="border p-2 rounded mr-2"
        />

        <input
          type="number"
          name="usage_limit"
          value={featureFormData.usage_limit}
          onChange={handleFeatureChange}
          placeholder="Usage Limit"
          className="border p-2 rounded mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingFeatureId ? 'Update Feature' : 'Add Feature'}
        </button>
      </form>

      {/* PaidFeatureAccess Form
      <form onSubmit={handleAccessSubmit} className="mb-4">
        <input type="text" name="user_id" value={accessFormData.user_id} onChange={handleAccessChange} placeholder="User ID" className="border p-2 rounded mr-2" />
        <input type="text" name="guest_phone_number" value={accessFormData.guest_phone_number} onChange={handleAccessChange} placeholder="Guest Phone Number" className="border p-2 rounded mr-2" />
        <input type="text" name="feature_name" value={accessFormData.feature_name} onChange={handleAccessChange} placeholder="Feature Name" className="border p-2 rounded mr-2" required />
        <input type="text" name="txn_id" value={accessFormData.txn_id} onChange={handleAccessChange} placeholder="Transaction ID" className="border p-2 rounded mr-2" required />
        <select name="payment_status" value={accessFormData.payment_status} onChange={handleAccessChange} className="border p-2 rounded mr-2">
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
        <input type="datetime-local" name="access_expires_at" value={accessFormData.access_expires_at} onChange={handleAccessChange} className="border p-2 rounded mr-2" />
        <input type="number" name="usage_left" value={accessFormData.usage_left} onChange={handleAccessChange} placeholder="Usage Left" className="border p-2 rounded mr-2" />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          {editingAccessId ? 'Update Access' : 'Add Access'}
        </button>
      </form> */}

      <h3 className="text-xl mt-6">Feature Prices</h3>
      <ul>
        {featurePrices.map((item) => (
          <li key={item.id} className="flex justify-between items-center border-b py-2">
            <span>{item.feature_name} - ${item.price}</span>
            <div>
              <button onClick={() => handleEditFeature(item)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button>
              <button onClick={() => handleDeleteFeature(item.id)} className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="text-xl mt-6">Access Records</h3>
      <ul>
        {accessRecords.map((item) => (
          <li key={item.id} className="flex flex-col border-b py-2">
            <span><strong>Feature:</strong> {item.feature_name} | <strong>Status:</strong> {item.payment_status} | <strong>Txn:</strong> {item.txn_id}</span>
            <div className="mt-1">
              <button onClick={() => handleEditAccess(item)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button>
              <button onClick={() => handleDeleteAccess(item.id)} className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeatureManager;

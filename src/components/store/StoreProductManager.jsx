import React, { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';

const StoreProductManager = () => {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [storeFormData, setStoreFormData] = useState({ 
    name: '', 
    location: '', 
    country: '', 
    district: '' 
  });
  const [productFormData, setProductFormData] = useState({ 
    name: '', 
    price: '', 
    store_id: '' 
  });
  const [editingStoreId, setEditingStoreId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);

  useEffect(() => {
    fetchStores();
    fetchProducts();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axiosInstance.get('/api/store/');
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/api/product/');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStoreFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStoreId) {
        await axiosInstance.put(`/api/store/${editingStoreId}/edit`, storeFormData);
      } else {
        await axiosInstance.post('/api/store/create', storeFormData);
      }
      setStoreFormData({ name: '', location: '', country: '', district: '' });
      setEditingStoreId(null);
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await axiosInstance.put(`/api/product/${editingProductId}/edit`, productFormData);
      } else {
        await axiosInstance.post('/api/product/create', productFormData);
      }
      setProductFormData({ name: '', price: '', store_id: '' });
      setEditingProductId(null);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEditStore = (store) => {
    setStoreFormData({ 
      name: store.name, 
      location: store.location, 
      country: store.country, 
      district: store.district 
    });
    setEditingStoreId(store.id);
  };

  const handleEditProduct = (product) => {
    setProductFormData({ 
      name: product.name, 
      price: product.price, 
      store_id: product.store_id 
    });
    setEditingProductId(product.id);
  };

  const handleDeleteStore = async (id) => {
    try {
      await axiosInstance.delete(`/api/store/${id}/delete`);
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axiosInstance.delete(`/api/product/${id}/delete`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl mb-4">Store & Product Manager</h2>
      
      {/* Store Form */}
      <form onSubmit={handleStoreSubmit} className="mb-4">
        <input 
          type="text" 
          name="name" 
          value={storeFormData.name} 
          onChange={handleStoreChange} 
          placeholder="Store Name" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <input 
          type="text" 
          name="location" 
          value={storeFormData.location} 
          onChange={handleStoreChange} 
          placeholder="Location" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <input 
          type="text" 
          name="country" 
          value={storeFormData.country} 
          onChange={handleStoreChange} 
          placeholder="Country" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <input 
          type="text" 
          name="district" 
          value={storeFormData.district} 
          onChange={handleStoreChange} 
          placeholder="District" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editingStoreId ? 'Update Store' : 'Add Store'}
        </button>
      </form>
      
      {/* Product Form */}
      <form onSubmit={handleProductSubmit} className="mb-4">
        <input 
          type="text" 
          name="name" 
          value={productFormData.name} 
          onChange={handleProductChange} 
          placeholder="Product Name" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <input 
          type="number" 
          name="price" 
          value={productFormData.price} 
          onChange={handleProductChange} 
          placeholder="Price" 
          className="border p-2 rounded mr-2" 
          required 
        />
        <select 
          name="store_id" 
          value={productFormData.store_id} 
          onChange={handleProductChange} 
          className="border p-2 rounded mr-2" 
          required
        >
          <option value="">Select Store</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          {editingProductId ? 'Update Product' : 'Add Product'}
        </button>
      </form>
      
      {/* Store List */}
      <h3 className="text-xl mt-6">Stores</h3>
      <ul>
        {stores.map((store) => (
          <li key={store.id} className="flex justify-between items-center border-b py-2">
            <span>{store.name} - {store.location} ({store.country}, {store.district})</span>
            <div>
              <button onClick={() => handleEditStore(store)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button>
              <button onClick={() => handleDeleteStore(store.id)} className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      
      {/* Product List */}
      <h3 className="text-xl mt-6">Products</h3>
      <ul>
        {products.map((product) => (
          <li key={product.id} className="flex justify-between items-center border-b py-2">
            <span>{product.name} - ${product.price} (Store: {product.store_id})</span>
            <div>
              <button onClick={() => handleEditProduct(product)} className="text-yellow-500 hover:text-yellow-700 mr-2">Edit</button>
              <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StoreProductManager;

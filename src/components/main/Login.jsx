import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Importez l'instance Axios
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaFeather } from 'react-icons/fa'; // Import de FaFeather
import { useNavigate } from 'react-router-dom'; // Import pour la redirection

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Hook pour la redirection

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/login', { email, password });
      localStorage.setItem('token', response.data.token); // Stocker le token JWT
      setSuccessMessage('Login successful!');
      setErrorMessage('');
      navigate('/home'); // Redirection vers la page du tableau de bord après connexion
    } catch (error) {
      setErrorMessage('Login failed. Please check your credentials.');
      setSuccessMessage('');
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-400 via-cyan-300 to-blue-500 min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Logo Plume centré et répété en arrière-plan */}
      <div className="absolute top-5 left-0 right-0 flex justify-center">
        <FaFeather size={120} className="text-white opacity-30 animate-pulse" />
      </div>
      <div className="absolute top-5 left-5 text-white opacity-20 animate-pulse">
        <FaFeather size={200} />
      </div>
      <div className="absolute top-10 right-5 text-white opacity-10 animate-pulse">
        <FaFeather size={150} />
      </div>
      <div className="absolute top-20 left-20 text-white opacity-40 animate-pulse">
        <FaFeather size={180} />
      </div>
      <div className="absolute top-40 left-40 text-white opacity-50 animate-pulse">
        <FaFeather size={140} />
      </div>
      <div className="absolute bottom-20 right-10 text-white opacity-30 animate-pulse">
        <FaFeather size={150} />
      </div>
      <div className="absolute bottom-5 right-5 text-white opacity-20 animate-pulse">
        <FaFeather size={120} />
      </div>

      <motion.div
        className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-2xl flex overflow-hidden relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Form Section */}
        <div className="w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Login</h1>
            <p className="text-gray-600">Enter your credentials to access your account</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address:</label>
              <motion.div
                className="mt-2 flex items-center border-2 border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition duration-150 ease-in-out"
                whileFocus={{ scale: 1.02 }}
              >
                <FaEnvelope className="mx-3 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </motion.div>
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password:</label>
              <motion.div
                className="mt-2 flex items-center border-2 border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition duration-150 ease-in-out"
                whileFocus={{ scale: 1.02 }}
              >
                <FaLock className="mx-3 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full px-4 py-3 focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </motion.div>
            </div>

            {/* Display Error or Success Message */}
            {errorMessage && <p className="text-red-600 mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

            {/* Buttons Section */}
            <div className="flex justify-between items-center mb-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Login
              </button>
              <a href="mailto:lwetutb@gmail.com"
                className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition duration-150 ease-in-out">
                Contact Us to register
              </a>
            </div>

            {/* Additional Links */}
            <div className="text-center">
              <a href="#" className="text-teal-600 hover:text-teal-800 hover:underline text-sm">Already have an account? Log in</a>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;

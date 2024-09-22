import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance'; // Importez l'instance Axios
import { motion } from 'framer-motion';
import { FaGoogle, FaFacebookF, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import pour la redirection
import backgroundImage from '../../assets/plume.jpg'; // Import the background image

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
    <div className="bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 flex items-center justify-center min-h-screen p-4">
      <motion.div
        className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-4xl flex overflow-hidden"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Image Section */}
        <div className="hidden md:block w-1/2 bg-gray-200 flex items-center justify-center">
          <img
            src={backgroundImage}
            alt="Decorative"
            className="object-contain w-full h-full" // Proportional image scaling
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Login</h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email Address:</label>
              <motion.div
                className="mt-2 flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition duration-150 ease-in-out"
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
                className="mt-2 flex items-center border border-gray-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition duration-150 ease-in-out"
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

            {/* New Button and Link Section */}
            <div className="flex justify-between items-center mb-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1"
              >
                Login
              </button>
              <a href="#" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition duration-150 ease-in-out">
                Contact Us to register
              </a>
            </div>


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

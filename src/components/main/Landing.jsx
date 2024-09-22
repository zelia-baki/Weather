import React from 'react';
import { FaEnvelope, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { BsArrowRightCircleFill } from 'react-icons/bs';
import backgroundImage from '../../assets/bg.jpg'; // Import the background image

const Landing = () => {
  return (
    <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-gray-100 min-h-screen flex flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  );
};

const Header = () => (
  <header className="relative h-screen">
    <img
      src={backgroundImage}  // Use the imported image here
      alt="Agriculture Background"
      className="w-full h-full object-cover mix-blend-overlay"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-transparent to-blue-800 opacity-80"></div>
    <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-8 md:px-16">
      <motion.h1
        className="text-7xl font-extrabold mb-6"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Welcome to the Agriyields traceability portal
      </motion.h1>
      <motion.p
        className="text-2xl max-w-lg mb-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        Efficiently manage your farm data, monitor yields, and generate QR codes for your produce with ease.
      </motion.p>
      <div className="flex space-x-6">
        <ActionButton
          href="/login"
          bgColor="bg-indigo-500" // Changement vers un indigo plus vibrant
          hoverColor="bg-indigo-600"
          className="text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          icon={<FaSignInAlt className="w-6 h-6 mr-2 text-white" />}
          label="Login"
        />
        <ActionButton
          href="mailto:lwetutb@gmail.com"
          bgColor="bg-orange-400" // Couleur plus vive pour attirer l'attention
          hoverColor="bg-orange-500"
          className="text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          icon={<FaUserPlus className="w-6 h-6 mr-2 text-white" />}
          label="Contact Us"
        />
        <ActionButton
          href="mailto:lwetutb@gmail.com"
          bgColor="bg-teal-500" // Teal pour un effet apaisant mais attrayant
          hoverColor="bg-teal-600"
          className="text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          icon={<FaUserPlus className="w-6 h-6 mr-2 text-white" />}
          label="Sign Up"
        />
      </div>

    </div>
  </header>
);

const Main = () => (
  <main className="flex-1 bg-gradient-to-tl from-white via-blue-50 to-pink-50 p-8 md:p-16">
    <Section title="Get Started">
      <p className="text-center text-lg text-gray-700">
        Join us in transforming the way you manage your farm. Explore the features and benefits today!
      </p>
    </Section>
    <Section title="Why Choose Us?">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 md:space-x-8">
        <FeatureBox
          title="Forest Management"
          description="Monitor crop growth and yields efficiently with real-time data."
          icon={<BsArrowRightCircleFill className="w-10 h-10 text-green-500 mb-4" />}
        />
        <FeatureBox
          title="Digital Trace ID"
          description="Easily generate QR codes for your produce and track inventory."
          icon={<BsArrowRightCircleFill className="w-10 h-10 text-pink-500 mb-4" />}
        />
        <FeatureBox
          title="Farm Management"
          description="Stay on top of your farm’s productivity with detailed yield reports."
          icon={<BsArrowRightCircleFill className="w-10 h-10 text-blue-500 mb-4" />}
        />
      </div>
    </Section>
  </main>
);

const Section = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-4xl font-semibold text-center text-blue-800 mb-6">{title}</h2>
    <div className="bg-white shadow-xl rounded-lg p-8">
      {children}
    </div>
  </section>
);

const ActionButton = ({ href, bgColor, hoverColor, icon, label }) => (
  <motion.a
    href={href}
    className={`flex items-center ${bgColor} text-white px-6 py-3 rounded-full shadow-lg transition transform hover:${hoverColor} hover:scale-110`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon}
    {label}
  </motion.a>
);

const FeatureBox = ({ title, description, icon }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white shadow-lg rounded-lg">
    {icon}
    <h3 className="text-2xl font-bold text-gray-800 mb-4">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-8 mt-8 text-center">
    <p>&copy; 2024 Agriyields traceability portal. All rights reserved.</p>
    <motion.a
      href="mailto:lwetutb@gmail.com"
      className="text-gray-300 hover:text-gray-200 flex items-center justify-center mt-2"
      whileHover={{ scale: 1.1 }}
    >
      <FaEnvelope className="w-5 h-5 mr-1" />
      support@nkusu.com
    </motion.a>
  </footer>
);

export default Landing;

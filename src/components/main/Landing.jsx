import React from 'react';
import { FaEnvelope, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { BsArrowRightCircleFill } from 'react-icons/bs';
import backgroundImage from '../../assets/bg.jpg'; // Import the background image

// AnimatedText Component for dynamic text effect
const AnimatedText = ({ text, className }) => {
  return (
    <span>
      {text.split('').map((letter, index) => (
        <motion.span
          key={index}
          className={className}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
};

const Landing = () => {
  return (
    <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 text-gray-100 min-h-screen flex flex-col">
      <Header />
      <Main />
      <Footer />
    </div>
  );
};

// Enhanced Header with animated background overlay
const Header = () => (
  <header className="relative h-screen">
    <img
      src={backgroundImage}
      alt="Agriculture Background"
      className="w-full h-full object-cover mix-blend-overlay"
    />
    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-transparent to-blue-800 opacity-80"></div>
    <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-8 md:px-16">
      <motion.h1 className="text-7xl font-extrabold mb-6 text-white drop-shadow-lg">
        <AnimatedText text="Welcome to the Agriyields Traceability Portal" />
      </motion.h1>
      <motion.p className="text-3xl max-w-2xl mb-8 text-gray-200 drop-shadow-md">
        <AnimatedText text="Data-driven monitoring and insights for your area of interest using satellite imagery and crop yield forecasts." />
      </motion.p>
      <div className="flex space-x-6">
        <ActionButton
          href="/login"
          bgColor="bg-gradient-to-r from-indigo-500 to-blue-500"
          hoverColor="bg-gradient-to-r from-indigo-600 to-blue-600"
          icon={<FaSignInAlt className="w-6 h-6 mr-2 text-white" />}
          label="Login"
        />
        <ActionButton
          href="/contactus"
          bgColor="bg-gradient-to-r from-orange-400 to-red-400"
          hoverColor="bg-gradient-to-r from-orange-500 to-red-500"
          icon={<FaEnvelope className="w-6 h-6 mr-2 text-white" />}
          label="Contact Us"
        />
        <ActionButton
          href="/signup"
          bgColor="bg-gradient-to-r from-teal-500 to-green-500"
          hoverColor="bg-gradient-to-r from-teal-600 to-green-600"
          icon={<FaUserPlus className="w-6 h-6 mr-2 text-white" />}
          label="Sign Up"
        />
      </div>
    </div>
  </header>
);

// Main section with attractive card designs
const Main = () => (
  <main className="flex-1 bg-gradient-to-tl from-white via-blue-50 to-pink-50 p-8 md:p-16">
    <Section title="Get Started">
      <p className="text-center text-xl text-gray-700">
        Join us in transforming the way you manage your farm. Explore the features and benefits today!
      </p>
    </Section>
    <Section title="Why Choose Us?">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard 
          title="Forest Management" 
          description="Monitor crop growth and yields efficiently with real-time data." 
          icon={<BsArrowRightCircleFill className="w-12 h-12 text-green-500 mb-4" />}
        />
        <FeatureCard 
          title="Digital Trace ID" 
          description="Easily generate QR codes for your produce and track inventory." 
          icon={<BsArrowRightCircleFill className="w-12 h-12 text-pink-500 mb-4" />}
        />
        <FeatureCard 
          title="Farm Management" 
          description="Stay on top of your farm’s productivity with detailed yield reports." 
          icon={<BsArrowRightCircleFill className="w-12 h-12 text-blue-500 mb-4" />}
        />
      </div>
    </Section>
      
  </main>
);

// FeatureCard component with consistent styling
const FeatureCard = ({ title, description, icon }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 transition-transform duration-300 hover:shadow-xl hover:scale-105 flex flex-col items-center text-center">
    {icon}
    <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Section = ({ title, children }) => (
  <section className="mb-16">
    <h2 className="text-5xl font-semibold text-center text-blue-800 mb-10 drop-shadow-lg">{title}</h2>
    <div className="bg-white shadow-2xl rounded-lg p-10 transition duration-300 transform hover:scale-105">
      {children}
    </div>
  </section>
);

// Styled ActionButton with hover animation and gradient colors
const ActionButton = ({ href, bgColor, hoverColor, icon, label }) => (
  <motion.a
    href={href}
    className={`flex items-center ${bgColor} text-white px-6 py-3 rounded-full shadow-lg transition transform hover:${hoverColor} hover:scale-105`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon}
    {label}
  </motion.a>
);

// Enhanced Footer with cohesive style
const Footer = () => (
  <footer className="bg-gray-900 text-white py-8 mt-8 text-center">
    <p>&copy; 2024 Agriyields Traceability Portal. All rights reserved.</p>
  </footer>
);

export default Landing;

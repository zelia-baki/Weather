import React from 'react';
import { FaLeaf, FaRegIdBadge, FaTractor, FaEnvelope, FaPhone } from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      
      {/* Header */}
      <header className="bg-green-600 text-white p-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaLeaf className="text-white" /> Nkusu
        </h1>
        <nav className="space-x-6">
          <a href="#features" className="hover:text-green-300">Features</a>
          <a href="#about" className="hover:text-green-300">About</a>
          <a href="#contact" className="hover:text-green-300">Contact</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center text-center p-16 bg-green-100 rounded-xl shadow-lg mx-4 md:mx-20 lg:mx-40 my-10">
  <h2 className="text-5xl font-extrabold text-green-800 mb-6">
    Welcome to the Agriyields Traceability Portal
  </h2>
  <p className="text-xl text-gray-700 mb-10 max-w-3xl">
    Data-driven monitoring and insights for your area of interest using satellite imagery and crop yield forecasts.
  </p>
  <button className="bg-green-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-all duration-300 shadow-md transform hover:scale-105">
    Login
  </button>
</section>


      {/* Features Section */}
      <section id="features" className="py-16 bg-white text-center">
        <h3 className="text-3xl font-bold mb-10">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          <div className="p-6 bg-gray-100 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center">
            <FaLeaf className="text-green-600 text-5xl mb-4" />
            <h4 className="text-2xl font-semibold mb-2">Forest Management</h4>
            <p>Monitor crop growth and yields efficiently with real-time data.</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center">
            <FaRegIdBadge className="text-green-600 text-5xl mb-4" />
            <h4 className="text-2xl font-semibold mb-2">Digital Trace ID</h4>
            <p>Easily generate QR codes for your produce and track inventory.</p>
          </div>
          <div className="p-6 bg-gray-100 rounded-lg shadow hover:shadow-lg transition flex flex-col items-center">
            <FaTractor className="text-green-600 text-5xl mb-4" />
            <h4 className="text-2xl font-semibold mb-2">Farm Management</h4>
            <p>Stay on top of your farm’s productivity with detailed yield reports.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-green-100 text-center">
        <h3 className="text-3xl font-bold mb-6">About Us</h3>
        <p className="max-w-xl mx-auto text-gray-700">
          We are a team of passionate individuals committed to empowering farmers with technology.
          Our mission is to make agriculture smarter, more sustainable, and more efficient.
        </p>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white text-center">
        <h3 className="text-3xl font-bold mb-6">Contact Us</h3>
        <p className="max-w-md mx-auto text-gray-700 mb-6">
          Have questions or want to learn more? Reach out to us!
        </p>
        <div className="flex justify-center gap-8">
          <button className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
            <FaEnvelope /> Email Us
          </button>
          <button className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
            <FaPhone /> Call Us
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-600 text-white text-center p-4">
        <p>&copy; 2024 Agriyields Traceability Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

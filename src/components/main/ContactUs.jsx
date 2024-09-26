import React, { useState } from 'react';
import { FaPhone, FaEnvelope } from 'react-icons/fa';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <section className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-6xl font-extrabold mb-8 text-teal-800">Contact Us</h2>
          <p className="text-gray-700 text-xl mb-12">We'd love to hear from you! Reach out via phone or email.</p>
        </div>

        <div className="mt-12 flex justify-center">
          <div className="w-full max-w-lg">
            <form className="bg-white shadow-2xl rounded-3xl px-10 pt-8 pb-10 mb-4 transition duration-300 transform hover:scale-105" onSubmit={handleSubmit}>
              {/* Phone Field */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-3 flex items-center" htmlFor="phone">
                  <FaPhone className="text-green-500 mr-3" /> Phone Number
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-green-300 transition duration-300"
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-semibold mb-3 flex items-center" htmlFor="email">
                  <FaEnvelope className="text-blue-500 mr-3" /> Email
                </label>
                <input
                  className="shadow appearance-none border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Message Field */}
              <div className="mb-8">
                <label className="block text-gray-700 text-sm font-semibold mb-3" htmlFor="message">
                  Message
                </label>
                <textarea
                  className="shadow appearance-none border border-gray-300 rounded-xl w-full py-4 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-300"
                  id="message"
                  name="message"
                  rows="5"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-center">
                <button
                  className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-10 rounded-full shadow-lg transition duration-300 transform hover:scale-110"
                  type="submit"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;

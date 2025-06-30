import React, { useEffect } from "react";
import { motion } from 'framer-motion';
import { Link as ScrollLink } from 'react-scroll';
import parrot from '../img/parrot.jpg';
import "../../animations.css"; // Assuming your animations.css is in the same folder
import {
  FaGlobe,
  FaCloudSunRain,
  FaLeaf,
  FaTree,
  FaTractor,
  FaQrcode,
  FaFeather,
  FaBarcode,
  FaMobileAlt,
  FaCloud,
  FaRobot,
  FaEnvelope,
  FaPhone,
  FaSatelliteDish,
  FaChartLine,
  FaBrain,
} from "react-icons/fa";

const LandingPage = () => {
  // Effet Parallax
  useEffect(() => {
    const parallax = () => {
      const scrollPosition = window.scrollY;
      const background = document.querySelector(".parallax-background");
      if (background) {
        background.style.transform = `translateY(${scrollPosition * 0.5}px)`;
      }
    };

    window.addEventListener("scroll", parallax);
    return () => {
      window.removeEventListener("scroll", parallax);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-300 via-teal-100 to-blue-200 min-h-screen font-poppins text-gray-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        {/* Logo animé */}
        <h1 className="text-4xl font-extrabold flex items-center gap-3 group">
          {/* <span className="bg-white text-teal-700 p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
            <FaFeather />
          </span> */}
          <span className="bg-white p-2 rounded-full shadow-md group-hover:rotate-12 group-hover:scale-110 transform transition-all duration-300">
            <img
              src={parrot}
              alt="Description de l'image"
              className="w-16 h-16 rounded-full object-cover"
            />
          </span>

          <span className="group-hover:text-teal-300 transition-all duration-300">
            Nkusu
          </span>
        </h1>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex space-x-8 text-lg font-medium animate-fade-in">
  <ScrollLink
    to="features"
    smooth={true}
    duration={500}
    offset={-80}
    className="cursor-pointer relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
  >
    Features
  </ScrollLink>

  <a
    key='about'
    href='/sectionfutur'
    className="relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
  >
    About
  </a>

   <ScrollLink
    to="contact"
    smooth={true}
    duration={500}
    offset={-80}
    className="cursor-pointer relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
  >
    Contact
  </ScrollLink>

          <a
            key='EUDR'
            href='/EUDRSubmissionForGuest'
            className="relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
          >
            Resources
          </a>
          <a
            key='#'
            href='#'
            className="relative text-white after:absolute after:w-0 after:h-[2px] after:bg-teal-300 after:bottom-0 after:left-1/2 after:transform after:-translate-x-1/2 hover:after:w-full hover:after:left-0 transition-all duration-300"
          >
            Blog
          </a>


        </nav>

        {/* CTA Button */}
        <a
          href="/login"
          className="hidden md:inline-block bg-teal-500 hover:bg-teal-300 text-white font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Get Started
        </a>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-tl from-teal-200 to-white text-center animate-gradient">
        <h2 className="text-5xl font-bold text-teal-700 mb-10 animate-fade-in-up-zoom">
          Welcome to the Agriyields Traceability Portal
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in-color">
          Data driven monitoring and insights for your area of interest using next generation satellite imagery.
        </p>


        <div className="flex flex-col md:flex-row justify-center gap-6 items-center">
          <a
            href="/login"
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full shadow-lg text-lg text-center"
          >
            Get Started
          </a>
          <a
            href="/learn-more"
            className="bg-white hover:bg-gray-100 text-teal-500 border border-teal-500 px-8 py-3 rounded-full shadow-lg text-lg text-center"
          >
            Learn More
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
          {[
            {
              title: "Forest Management",
              icon: FaTree,
              description: "Real time data insights for biodiversity and forestry conservation, antideforestation, afforestation & reforesatation.",
              bgColor: "bg-gradient-to-br from-blue-100 to-teal-50",
              iconColor: "text-blue-500",
            },
            {
              title: "Digital Trace ID",
              icon: FaQrcode,
              description: "Track your produce and inventory, trace supply chains from farm to fork by generating secure digital certificates & stamps.",
              bgColor: "bg-gradient-to-br from-green-100 to-lime-50",
              iconColor: "text-green-500",
            },
            {
              title: "Farm Management",
              icon: FaTractor,
              description: "Manage and monitor your farms operations with actionable geospatial data insights, monitor crop.",
              bgColor: "bg-gradient-to-br from-purple-100 to-pink-50",
              iconColor: "text-purple-500",
            },
          ].map(({ title, icon: Icon, description, bgColor, iconColor }, index) => (
            <div
              key={index}
              className={`${bgColor} rounded-xl shadow-lg p-8 text-center hover:shadow-2xl hover:scale-105 transition-all duration-300`}
            >
              <div
                className={`w-16 h-16 flex items-center justify-center rounded-full shadow-md mb-6 ${iconColor} bg-white`}
              >
                <Icon className="text-3xl" />
              </div>
              <h4 className="text-2xl font-bold text-gray-800 mb-4">{title}</h4>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-teal-50 via-white to-blue-100"
      >
        <h3 className="text-4xl font-extrabold text-center text-teal-700 mb-16 animate-fade-in-up">
          Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto px-6">
          {[
            {
              Icon: FaCloudSunRain,
              title: "Climate",
              description:
                "Gain insights into how changing patterns in weather and climate affect your business by conducting area based risk assessments.",
              color: "bg-purple-400",
              textColor: "text-purple-600",
            },
            {
              Icon: FaLeaf,
              title: "Environment",
              description:
                "Leverage the power of advanced Geospatial data analytics and machine learning to conduct environmental risk assessments and feasibility, EUDR risk assessment & compliance verification with precision and accurancy.",
              color: "bg-pink-400",
              textColor: "text-pink-600",
            },
            {
              Icon: FaTree,
              title: "Carbon Offset Projects",
              description:
                "Contribute to environmental & climate sustainability and the net Zero agenda by managing and tracking carbon and other GHG emissions.",
              color: "bg-teal-400",
              textColor: "text-teal-600",
            },
            {
              Icon: FaChartLine,
              title: "Multiple Report",
              description:
                "Access detailed reports and analytics for informed decision-making on your farm.",
              color: "bg-purple-400",
              textColor: "text-purple-600",
            }
          ].map(({ Icon, title, description, color, textColor }, index) => (
            <div
              key={index}
              className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl hover:scale-105 transition-transform duration-300"
            >
              <div
                className={`${color} text-white w-16 h-16 flex items-center justify-center rounded-full shadow-lg mb-6`}
              >
                <Icon className="text-2xl" />
              </div>
              <h4
                className={`text-2xl font-bold mb-4 animate-fade-in ${textColor}`}
              >
                {title}
              </h4>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 bg-gradient-to-tl from-teal-200 to-white"
      >
        <h3 className="text-4xl font-bold text-center text-teal-700 mb-10">
          Contact Us
        </h3>
        <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
          Join the big data revolution, explore and transform the way you do business by reaching out to us.
        </p>
        <div className="flex justify-center gap-8">
          {[
            { label: "Email Us", Icon: FaEnvelope, href: "/contactus" },
            { label: "Sign Up", Icon: FaPhone, href: "/signup" },
          ].map(({ label, Icon, href }, index) => (
            <a
              key={index}
              href={href}
              className="bg-teal-500 text-white px-10 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg hover:bg-teal-700 transition-transform transform hover:scale-105"
            >
              <Icon /> {label}
            </a>
          ))}
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-4">
        <p>
          &copy; {new Date().getFullYear()}  Agriyields traceability portal. All rights reserved.
        </p>
        <motion.a
          href="mailto:lwetutb@gmail.com"
          className="text-gray-300 hover:text-gray-200 flex items-center justify-center mt-2"
          whileHover={{ scale: 1.1 }}
        >
          <FaEnvelope className="w-5 h-5 mr-1" />
          nkusu@agriyields.com
        </motion.a>
      </footer>
    </div>
  );
};

export default LandingPage;

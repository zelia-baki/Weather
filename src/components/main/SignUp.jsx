import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaBuilding, FaComments } from 'react-icons/fa';
import Swal from 'sweetalert2';
import emailjs from 'emailjs-com'; // Import EmailJS

const SignUp = () => {
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        message: '',
        organization: '',
        company: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Sending email via EmailJS
        emailjs.send(
            'service_3xq2aks',         // Service ID
            'template_irqm3l1',        // Template ID
            {
                phone: formData.phone,
                email: formData.email,
                message: formData.message,
                organization: formData.organization,
                company: formData.company
            },
            'Pt5g2EHR_AEyDF5NC'              // User ID from EmailJS
        ).then((response) => {
            Swal.fire({
                icon: 'success',
                title: 'Sign Up Successful!',
                text: 'Your information has been submitted and a notification email was sent.',
                confirmButtonText: 'OK',
            });

            // Reset the form
            setFormData({
                phone: '',
                email: '',
                message: '',
                organization: '',
                company: ''
            });
        }).catch((error) => {
            console.error('Error sending email:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Could not send the email, please try again later.',
                confirmButtonText: 'OK',
            });
        });
    };

    return (
        <section className="bg-gradient-to-r from-teal-50 via-green-50 to-yellow-50 min-h-screen flex justify-center items-center p-6 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-6xl font-extrabold mb-4 text-teal-800">Sign Up</h2>
                    <p className="text-gray-700 text-xl mb-6">Join us by filling in your details below!</p>
                </div>

                <div className="mt-12 flex justify-center">
                    <div className="w-full max-w-4xl">
                        <form className="bg-white shadow-2xl rounded-3xl px-10 pt-8 pb-10 mb-4" onSubmit={handleSubmit}>

                            {/* Deux colonnes sur écran moyen et plus, une seule sur mobile. */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                                {/* Colonne gauche — ligne 1 */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 text-base font-semibold mb-2 flex items-center" htmlFor="phone">
                                        <FaPhone className="text-green-500 mr-3" /> Phone Number
                                    </label>
                                    <input
                                        className="shadow-md border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-green-300"
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        placeholder="Your phone number"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Colonne droite — ligne 1 */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 text-base font-semibold mb-2 flex items-center" htmlFor="email">
                                        <FaEnvelope className="text-teal-500 mr-3" /> Email
                                    </label>
                                    <input
                                        className="shadow-md border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-teal-300"
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="Your email address"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Colonne gauche — ligne 2 */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 text-base font-semibold mb-2 flex items-center" htmlFor="organization">
                                        <FaBuilding className="text-blue-500 mr-3" /> Organization
                                    </label>
                                    <input
                                        className="shadow-md border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-300"
                                        id="organization"
                                        name="organization"
                                        type="text"
                                        placeholder="Your organization"
                                        value={formData.organization}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Colonne droite — ligne 2 */}
                                <div className="flex flex-col">
                                    <label className="text-gray-700 text-base font-semibold mb-2 flex items-center" htmlFor="company">
                                        <FaBuilding className="text-purple-500 mr-3" /> Company
                                    </label>
                                    <input
                                        className="shadow-md border border-gray-300 rounded-full w-full py-3 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-purple-300"
                                        id="company"
                                        name="company"
                                        type="text"
                                        placeholder="Your company name"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                {/* Le message garde toute la largeur : couper une zone de
                                    texte en deux la rendrait inconfortable à écrire. */}
                                <div className="flex flex-col md:col-span-2">
                                    <label className="text-gray-700 text-base font-semibold mb-3 flex items-center" htmlFor="message">
                                        <FaComments className="text-orange-500 mr-3" /> Message
                                    </label>
                                    <textarea
                                        className="shadow-md border border-gray-300 rounded-xl w-full py-4 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-orange-300"
                                        id="message"
                                        name="message"
                                        rows="5"
                                        placeholder="Write your message here..."
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex items-center justify-center mt-8">
                                <button
                                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-3 px-10 rounded-full shadow-lg"
                                    type="submit"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SignUp;
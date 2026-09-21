import React, { useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaFeather, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getErrorMessage = (error) => {
  if (!error.response) {
    return 'Cannot reach the server. Check your internet connection and try again.';
  }
  if (error.response.status === 401) {
    return 'Incorrect email or password.';
  }
  return `Something went wrong on our side (error ${error.response.status}). Please try again in a moment.`;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('session') === 'expired';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.post('/api/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setLoading(false);
    }
  };

  const inputClass =
    'w-full h-12 pl-11 pr-4 rounded-lg border border-gray-300 bg-white text-base text-gray-900 ' +
    'placeholder-gray-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30';

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600">
      <FaFeather aria-hidden="true" size={300} className="pointer-events-none absolute -top-12 -left-12 text-white opacity-10" />
      <FaFeather aria-hidden="true" size={340} className="pointer-events-none absolute -bottom-20 -right-12 rotate-12 text-white opacity-10" />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <img src="/parrotlogo.svg" alt="Parrot" className="mx-auto mb-4 h-14 w-auto object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">Enter your email and password to access your account.</p>
        </div>

        {sessionExpired && !errorMessage && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
          >
            <FaExclamationCircle aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>Your session has expired. Please sign in again.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="relative">
              <FaEnvelope aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="name@company.com"
                required
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <FaLock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Your password"
                required
                className={`${inputClass} pr-12`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              <FaExclamationCircle aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          No account yet?{' '}
          <a href="mailto:lwetutb@gmail.com" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
            Contact us to register
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

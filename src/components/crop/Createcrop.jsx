import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Droplets, Leaf, ClipboardList } from 'lucide-react';

const CARDS = [
  {
    to:      '/cropmanager',
    icon:    <Sprout size={32} className="text-emerald-600"/>,
    title:   'Crop Manager',
    desc:    'Manage and organize crops, weights, and categories.',
    border:  'border-emerald-400',
    bg:      'bg-emerald-50 hover:bg-emerald-100',
  },
  {
    to:      '/irrigationmanager',
    icon:    <Droplets size={32} className="text-blue-600"/>,
    title:   'Irrigation Manager',
    desc:    'Log and track irrigation events per farm and crop.',
    border:  'border-blue-400',
    bg:      'bg-blue-50 hover:bg-blue-100',
  },
  {
    to:      '/cropcoefficientmanager',
    icon:    <Leaf size={32} className="text-green-600"/>,
    title:   'Crop Coefficient (Kc)',
    desc:    'Set Kc values by crop and growth stage for water needs.',
    border:  'border-green-400',
    bg:      'bg-green-50 hover:bg-green-100',
  },
  {
    to:      '/grademanager',
    icon:    <ClipboardList size={32} className="text-purple-600"/>,
    title:   'Grade Manager',
    desc:    'Define quality grades for crops and quality control.',
    border:  'border-purple-400',
    bg:      'bg-purple-50 hover:bg-purple-100',
  },
];

const CreateCrop = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 light-panel">
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <Sprout size={32} className="text-emerald-600"/> Crop Management Hub
        </h1>
        <p className="text-gray-500 mt-2">Select a module to manage your crop data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARDS.map(({ to, icon, title, desc, border, bg }) => (
          <Link key={to} to={to}
            className={`${bg} border-l-4 ${border} rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-200 group`}>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-200">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default CreateCrop;
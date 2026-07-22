import React from 'react';

const VerifiedStamp = ({ label = "Verified" }) => (
  <svg viewBox="0 0 100 100" className="w-14 h-14" style={{ transform: 'rotate(-8deg)' }}>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#22c55e" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="0.75" strokeDasharray="2,3" />
    <path
      id="stampCircle"
      d="M 50,50 m -33,0 a 33,33 0 1,1 66,0 a 33,33 0 1,1 -66,0"
      fill="none"
    />
    <text fontSize="8.5" fill="#22c55e" fontFamily="'Epilogue', sans-serif" letterSpacing="2" fontWeight="600">
      <textPath href="#stampCircle" startOffset="2%">
        {label.toUpperCase()} · DEFORESTATION-FREE ·
      </textPath>
    </text>
    <path d="M40 50 L47 58 L62 40" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default VerifiedStamp;
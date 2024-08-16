import React from 'react';
import Navbar from '../main/Navbar'; // Ensure this path is correct

const Layout = ({ children }) => {
  console.log('Rendering Layout with children:', children); // Debugging line

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
};



export default Layout;

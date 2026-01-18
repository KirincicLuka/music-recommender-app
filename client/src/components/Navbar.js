import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const linkClass = ({ isActive }) =>
  `px-4 py-2 rounded-lg font-semibold transition-all duration-300
   ${isActive 
     ? 'bg-white text-indigo-600'        
     : 'text-white hover:text-indigo-600 hover:bg-white' 
   }`;


  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg flex justify-between items-center">
      <h1 className="text-3xl font-bold hover:scale-105 transition-transform">
        <NavLink to="/">🎵 MusicMatch</NavLink>
      </h1>
      <div className="flex gap-6">
        <NavLink 
          to="/" 
          className={linkClass}
        >
          Search
        </NavLink>
        <NavLink
          to="/popular"
          className={linkClass}
        >
          Popular
        </NavLink>
        <NavLink 
          to="/saved" 
          className={linkClass}
        >
          Saved Songs
        </NavLink>
            <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg hover:bg-white hover:text-indigo-600 transition-all duration-300 font-semibold"
          >
            Logout
          </button>
      </div>
    </nav>
  );
}

export default Navbar;
import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-lg flex justify-between items-center">
      <h1 className="text-3xl font-bold hover:scale-105 transition-transform">
        <Link to="/">🎵 MusicMatch</Link>
      </h1>
      <div className="flex gap-6">
        <Link 
          to="/" 
          className="px-4 py-2 rounded-lg hover:bg-white hover:text-indigo-600 transition-all duration-300 font-semibold"
        >
          Search
        </Link>
        <Link 
          to="/saved" 
          className="px-4 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-100 transition-all duration-300 font-semibold shadow-md"
        >
          Saved Songs
        </Link>
            <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-100 transition-all duration-300 font-semibold shadow-md"
          >
            Logout
          </button>
      </div>
    </nav>
  );
}

export default Navbar;
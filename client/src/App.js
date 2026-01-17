import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SavedSongs from './pages/SavedSongs';
import GenreSelection from './components/GenreSelection';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import API from './api';

function App() {
  const [user, setUser] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const token = new URLSearchParams(window.location.search).get('token');
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser(payload);
          localStorage.setItem('authToken', token);
          window.history.replaceState({}, document.title, '/');
          
          // Provjeri onboarding status
          const res = await API.get(`/api/users/${payload.id}/onboarding-status`);
          setNeedsOnboarding(!res.data.hasPreferences);
        } catch (err) {
          console.error('Failed to initialize user:', err);
        }
      } else {
        // Provjeri lokalni token
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            setUser(payload);
            
            // Provjeri onboarding status
            const res = await API.get(`/api/users/${payload.id}/onboarding-status`);
            setNeedsOnboarding(!res.data.hasPreferences);
          } catch (err) {
            console.error('Invalid token:', err);
            localStorage.removeItem('authToken');
          }
        }
      }
      
      setLoading(false);
    };

    initializeUser();
  }, []);

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-purple-600 to-indigo-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
          <p className="text-white mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Normalan flow aplikacije
return (
  <Router>

    <Routes>
      {/* Login route */}
      <Route path="/login" element={<Login />} />

      {/* Ako nije prijavljen, sve vodi na login */}
      {!user ? (
        <Route path="*" element={<Login />} />
      ) : needsOnboarding ? (
        <Route path="*" element={<GenreSelection user={user} onComplete={handleOnboardingComplete} />} />
      ) : (
        <>
          <Route path="/" element={<Profile user={user} />} />
          <Route path="/saved" element={<SavedSongs user={user} />} />
          <Route path="*" element={<Profile user={user} />} />
        </>
      )}
    </Routes>
  </Router>
);

}

export default App;

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SavedSongs from './pages/SavedSongs';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  if (!user) return <Login />;

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Profile user={user} />} />
        <Route path="/saved" element={<SavedSongs user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
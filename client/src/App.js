import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import InviteForm from './components/InviteForm';
import RedeemForm from './components/RedeemForm';

// Configure axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, create a default user or load from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Create a demo user for testing
      const demoUser = {
        id: 'demo-user-123',
        username: 'DemoUser',
        email: 'demo@example.com',
        referralCode: 'DEMO1234'
      };
      setCurrentUser(demoUser);
      localStorage.setItem('currentUser', JSON.stringify(demoUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card text-center">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/" element={<Dashboard currentUser={currentUser} />} />
          <Route path="/invite" element={<InviteForm currentUser={currentUser} />} />
          <Route path="/redeem" element={<RedeemForm currentUser={currentUser} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
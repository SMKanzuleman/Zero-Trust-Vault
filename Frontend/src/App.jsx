import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import VerifyEmail from './pages/VerifyEmail';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          error: {
            style: {
              background: '#ef4444', // Tailwind red-500
              color: '#000000',      // Black text
              fontWeight: '500',
            },
            iconTheme: {
              primary: '#000000',
              secondary: '#ef4444',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/password" element={<ChangePassword />} />
        <Route 
          path="/verify-email" 
          element={
            <ProtectedRoute>
              <VerifyEmail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/vault" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

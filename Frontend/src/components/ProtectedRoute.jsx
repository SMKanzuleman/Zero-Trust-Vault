import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    try {
      // Decode JWT token payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        if (userRole === 'admin') {
          return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/vault" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

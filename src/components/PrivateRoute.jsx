// src/components/PrivateRoute.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Login from './Login';

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  return currentUser ? children : <Login />;
};

export default PrivateRoute;

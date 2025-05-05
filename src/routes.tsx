import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/auth/AuthLayout';
import GroupCallPage from './pages/GroupCallPage';
import { useAuth } from './contexts/AuthContext';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!isAuthenticated ? <AuthLayout /> : <Navigate to="/" replace />} />
      <Route path="/group-call/:roomId" element={<ProtectedRoute><GroupCallPage /></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes; 
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-screen bg-customBg">
        <div className="w-8 h-8 border-4 border-divider border-t-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-textSecondary font-semibold">Loading DentConnect...</p>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/welcome" replace />;
}

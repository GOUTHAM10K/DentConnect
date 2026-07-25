import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../layouts/AppLayout';

// Pages
import Welcome from '../pages/Welcome';
import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import Notifications from '../pages/Notifications';
import SearchPage from '../pages/SearchPage';
import Cases from '../pages/Cases';
import CaseWizard from '../pages/CaseWizard';
import CaseDetails from '../pages/CaseDetails';
import Network from '../pages/Network';
import Chat from '../pages/Chat';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import Support from '../pages/Support';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Auth isLogin={true} />} />
      <Route path="/signup" element={<Auth isLogin={false} />} />
      <Route path="/forgot-password" element={<Auth view="forgot" />} />
      <Route path="/otp" element={<Auth view="otp" />} />
      <Route path="/verify-email" element={<Auth view="verify" />} />
      <Route path="/reset-password" element={<Auth view="reset" />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/new" element={<CaseWizard />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/cases/:id/edit" element={<CaseWizard isEdit={true} />} />
          <Route path="/network" element={<Network />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:uid" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:uid" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<Support />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

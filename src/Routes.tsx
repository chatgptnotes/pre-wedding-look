import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';

// Pages
import LandingPage from './pages/LandingPage';
import MatchPage from './pages/MatchPage';
import RoomPage from './pages/RoomPage';
import RevealPage from './pages/RevealPage';
import ProfilePage from './pages/ProfilePage';
import ReportPage from './pages/ReportPage';
import AuthCallback from './pages/AuthCallback';
import ClassicMode from './pages/ClassicMode';
import FeaturesPage from './pages/FeaturesPage';
import AdminPage from './components/AdminPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  // Allow bypass for development
  const BYPASS_AUTH = false;
  
  if (!BYPASS_AUTH && !user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  
  // Check if user is admin
  const isAdmin = user?.email?.includes('@admin.com') || user?.email === 'admin@prewedai.com';
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected Routes */}
      <Route path="/features" element={
        <ProtectedRoute>
          <FeaturesPage />
        </ProtectedRoute>
      } />
      
      <Route path="/classic" element={
        <ProtectedRoute>
          <ClassicMode />
        </ProtectedRoute>
      } />
      
      <Route path="/match" element={
        <ProtectedRoute>
          <MatchPage />
        </ProtectedRoute>
      } />
      
      <Route path="/room/:sessionId" element={
        <ProtectedRoute>
          <RoomPage />
        </ProtectedRoute>
      } />
      
      <Route path="/reveal/:sessionId" element={
        <ProtectedRoute>
          <RevealPage />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      
      <Route path="/report" element={
        <ProtectedRoute>
          <ReportPage />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPage onBack={() => window.location.href = '/'} />
        </AdminRoute>
      } />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
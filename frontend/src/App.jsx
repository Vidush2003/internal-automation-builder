import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import Workflows from './pages/Workflows';
import WorkflowEditor from './pages/WorkflowEditor';
import Logs from './pages/Logs';
import Landing from './pages/Landing';
import AppViewer from './pages/AppViewer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OverlayProvider } from './components/Overlays';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl animate-spin">sync</span>
          <span className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant">Connecting Console...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" state={{ auth: 'login' }} replace />;
  return children;
};

function AppContent() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/workflows" element={
          <ProtectedRoute>
            <Workflows />
          </ProtectedRoute>
        } />
        <Route path="/editor/:id" element={
          <ProtectedRoute>
            <WorkflowEditor />
          </ProtectedRoute>
        } />
        <Route path="/logs" element={
          <ProtectedRoute>
            <Logs />
          </ProtectedRoute>
        } />
        <Route path="/apps/:id" element={
          <ProtectedRoute>
            <AppViewer />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <OverlayProvider>
        <div className="app-container">
          <AppContent />
        </div>
        </OverlayProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

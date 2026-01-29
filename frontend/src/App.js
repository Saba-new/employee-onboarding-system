import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateOnboarding from './pages/CreateOnboarding';
import OnboardingDetails from './pages/OnboardingDetails';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/employee" 
            element={
              <PrivateRoute role="employee">
                <EmployeeDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/employee/create" 
            element={
              <PrivateRoute role="employee">
                <CreateOnboarding />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/employee/onboarding/:id" 
            element={
              <PrivateRoute role="employee">
                <OnboardingDetails />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/admin/onboarding/:id" 
            element={
              <PrivateRoute role="admin">
                <OnboardingDetails />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function HomePage() {
  const { user } = useAuth();
  
  if (user.role === 'admin') {
    return <Navigate to="/admin" />;
  }
  
  return <Navigate to="/employee" />;
}

export default App;

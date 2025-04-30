import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Admin from './Pages/Admin/Admin';
import AdminLogin from './Pages/Admin/AdminLogin';
import AdminProtectedRoute from './Components/Auth/AdminProtectedRoute';

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        {/* Redirect "/" to /admin-login */}
        <Route path="/" element={<Navigate to="/admin-login" replace />} />

        {/* Admin login page */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin dashboard with nested routes */}
        <Route 
          path="/admin/*" 
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
};

export default App;

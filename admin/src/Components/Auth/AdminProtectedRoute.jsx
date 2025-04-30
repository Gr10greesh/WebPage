import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  const isAdminLoggedIn = localStorage.getItem('admin-auth') === 'true';
  return isAdminLoggedIn ? children : <Navigate to="/admin-login" replace />;
};

export default AdminProtectedRoute;
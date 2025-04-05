import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { userId, setAuthRedirectMessage } = useContext(ShopContext);
  const token = localStorage.getItem('auth-token');

  if (!token) {
    setAuthRedirectMessage('Please login to access your dashboard');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userId) {
    // If token exists but userId isn't set in context
    return <div>Loading user data...</div>;
  }

  return children;
};

export default ProtectedRoute;
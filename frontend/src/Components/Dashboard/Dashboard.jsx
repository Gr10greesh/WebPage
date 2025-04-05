import React, { useContext, useEffect } from 'react';
import { useNavigate, Outlet, NavLink } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Dashboard.css';

const Dashboard = () => {
  const { userId, fetchUserProfile } = useContext(ShopContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    } else {
      fetchUserProfile().catch(error => {
        console.error('Failed to fetch user profile:', error);
      });
    }
  }, [userId, navigate, fetchUserProfile]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <h3>My Account</h3>
        <nav className="dashboard-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            end
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/dashboard/orders" 
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            Order History
          </NavLink>
          <NavLink 
            to="/dashboard/profile" 
            className={({ isActive }) => 
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            Profile
          </NavLink>
        </nav>
      </div>

      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
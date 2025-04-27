import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import './Dashboard.css';

const DashboardHome = () => {
  const { userId, userProfile, fetchUserProfile } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        try {
          await fetchUserProfile();

          const token = localStorage.getItem('auth-token');
          const res = await fetch('http://localhost:4000/api/user/orders', {
            headers: {
              'auth-token': token
            }
          });
          const data = await res.json();
          if (data.success) {
            setOrders(data.orders);
          }
        } catch (error) {
          console.error('Failed to fetch data', error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    loadData();
  }, [userId, fetchUserProfile]);

  return (
    <div className="dashboard-home">
      <h2>Hello, {userProfile?.name || 'User'} 👋</h2>

      <div className="stats-row">
        <div className="stat-card">
          <h3>Total Orders</h3>
          {loadingOrders ? (
            <p>Loading...</p>
          ) : (
            <p>{orders.length}</p>
          )}
        </div>
      </div>

      <div className="info-section">
        <div className="section-header">
          <h3>Account Information</h3>
        </div>

        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{userProfile?.email || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone Number:</span>
            <span className="info-value">{userProfile?.phonenumber || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

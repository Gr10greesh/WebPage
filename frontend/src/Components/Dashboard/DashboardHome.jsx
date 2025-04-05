import React from 'react';
import './Dashboard.css';

const DashboardHome = () => {
  return (
    <div className="dashboard-home">
      <h2>Hello, Greesh Dahal</h2>

      <div className="stats-row">
        <div className="stat-card">
          <img src="/images/order-icon.png" alt="Orders" />
          <h3>Total Order</h3>
          <p>2</p>
        </div>
      </div>

      <div className="info-section">
        <div className="section-header">
          <h3>Account Information</h3>
          <button className="edit-btn">Edit</button>
        </div>

        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">Greesh Dahal</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">greeshdahal432@gmail.com</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone Number:</span>
            <span className="info-value">9860461600</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import './Dashboard.css';

const Profile = () => {
  const { 
    userProfile, 
    updateUserProfile,
    fetchUserProfile,
    isProfileLoading,
    changePassword,
    setAuthRedirectMessage
  } = useContext(ShopContext);


  
  const [formData, setFormData] = useState({ phonenumber: '', email: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    id:""
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const updateFormData = useCallback((profile) => {
    if (profile) {
      setFormData({
        phonenumber: profile.phonenumber || '',
        email: profile.email || ''
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadProfile = async () => {
      try {
        if (isMounted) setAuthRedirectMessage('');
        await fetchUserProfile(true);
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setAuthRedirectMessage('Failed to load profile');
        }
      }
    };
    
    loadProfile();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchUserProfile, setAuthRedirectMessage]);

  useEffect(() => {
    updateFormData(userProfile);
  }, [userProfile, updateFormData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Profile Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setAuthRedirectMessage('');
      setSuccessMessage('');
      
      await updateUserProfile({
        phonenumber: formData.phonenumber
      });
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setAuthRedirectMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password must match');
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword, passwordData.confirmPassword);
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError('Failed to change password. Please try again.');
    }
  };

  if (isProfileLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-profile">
      <h2>Profile Settings</h2>
      
      {successMessage && <div className="success-message">{successMessage}</div>}
      {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
      {passwordError && <div className="error-message">{passwordError}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="profile-email">Email Address*</label>
            <div className="email-field">
              <input
                id="profile-email"
                type="email"
                value={formData.email}
                readOnly
                aria-readonly="true"
              />
              <span className="verified-badge">Verified</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profile-phone">Phone Number*</label>
            <input
              id="profile-phone"
              type="tel"
              name="phonenumber"
              value={formData.phonenumber}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              title="Please enter a 10-digit phone number"
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            className="update-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>

      {/* Change Password Section */}
      <div className="profile-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              type="password"
              id="current-password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="update-btn">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;

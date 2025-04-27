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
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const updateFormData = useCallback((profile) => {
    if (profile) {
      setFormData({
        phonenumber: profile.phonenumber || '',
        email: profile.email || ''
      });
      // More explicit check
      setIsGoogleUser(profile.password === null || profile.password === undefined);
      console.log('Updated profile, password field:', profile.password);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setAuthRedirectMessage('');
      setSuccessMessage('');

      await updateUserProfile({
        phonenumber: formData.phonenumber
      });

      await fetchUserProfile(true);

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setAuthRedirectMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
  
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password must match');
      return;
    }
  
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
  
    try {
      await changePassword(
        isGoogleUser ? undefined : passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword,
        isGoogleUser
      );
    
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    
      await fetchUserProfile(true);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
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

      <div className="profile-section">
      <h3>{isGoogleUser ? 'Set Password' : 'Change Password'}</h3>
        {isGoogleUser && (
          <div className="info-message">
            You signed up with Google. Please set a password below to enable email login.
          </div>
        )}
        <form onSubmit={handlePasswordChange}>
          {!isGoogleUser && (
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                type="password"
                id="current-password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required={!isGoogleUser}
                disabled={isGoogleUser}
              />
            </div>
          )}
          <div className="form-group">
          <label htmlFor="new-password">
              {isGoogleUser ? 'New Password' : 'New Password'}
            </label>
            <input
              type="password"
              id="new-password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              minLength="8"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              type="password"
              id="confirm-password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              minLength="8"
            />
          </div>
          <button type="submit" className="update-btn">
            {isGoogleUser ? 'Set Password' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
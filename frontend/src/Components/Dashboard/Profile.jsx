import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../../Context/ShopContext';
import './Dashboard.css';

const Profile = () => {
  const { 
    userProfile, 
    updateUserProfile,
    fetchUserProfile,
    profileError,
    setAuthRedirectMessage
  } = useContext(ShopContext);
  
  const [formData, setFormData] = useState({
    phonenumber: '',
    email: ''
  });
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Now properly used below

  // Initialize form with context data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setAuthRedirectMessage('');
        setLoading(true);
        
        if (!userProfile) {
          await fetchUserProfile();
        }
        
        if (userProfile) {
          setFormData({
            phonenumber: userProfile.phonenumber || '',
            email: userProfile.email || ''
          });
        }
      } catch (error) {
        setAuthRedirectMessage('Failed to load profile data');
        console.error('Profile load error:', error);
        navigate('/error'); // Using navigate here
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userProfile, fetchUserProfile, setAuthRedirectMessage, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setAuthRedirectMessage('Only image files are allowed');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setAuthRedirectMessage('File size must be less than 2MB');
        return;
      }
      
      setAuthRedirectMessage('');
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setAuthRedirectMessage('');
      setSuccessMessage('');
      
      await updateUserProfile({
        phonenumber: formData.phonenumber
      });
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      await fetchUserProfile();
    } catch (err) {
      setAuthRedirectMessage(err.message || 'Failed to update profile');
      console.error('Profile update error:', err);
      navigate('/error'); // Using navigate here
    }
  };

  

  if (loading) {
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
      
      {profileError && (
        <div className="error-message">
          {profileError}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="avatar-section">
          <div className="avatar-preview">
            <img 
              src={previewAvatar || (userProfile?.avatar || "/default-avatar.png")} 
              alt="Profile" 
              onError={(e) => {
                e.target.src = "/default-avatar.png";
              }}
            />
          </div>
          <div className="avatar-upload">
            <input
              type="file"
              id="avatar-upload"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="avatar-upload">Choose File</label>
            <p>{previewAvatar ? "Image selected" : "No file chosen"}</p>
            <small>JPG, PNG or GIF (Max 2MB, 300×300 recommended)</small>
          </div>
        </div>

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
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="update-btn"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
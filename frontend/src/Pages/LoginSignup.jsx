import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../Context/ShopContext';
import './CSS/LoginSignup.css';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginSignup = () => {
  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({
    phonenumber: "",
    password: "",
    confirmPassword: "",
    email: "",
    newPassword: "",
    resetToken: ""
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [tokenFromUrl, setTokenFromUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setUserId, fetchUserProfile, setAuthRedirectMessage } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    if (token) {
      setTokenFromUrl(token);
      setFormData(prev => ({ ...prev, resetToken: token }));
      setShowForgotPassword(true);
      setResetEmailSent(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    if (name === 'phonenumber' && value.length > 10) return;
    setFormData({ ...formData, [name]: value });
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.email || !formData.password) {
      alert("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        setUserId(response.data.userId);
        await fetchUserProfile(); // NEW: Fetch user profile data
        navigate(from, { replace: true }); // NEW: Better navigation
      } else {
        alert(response.data.errors || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.email || !formData.phonenumber || !formData.password || !formData.confirmPassword) {
      alert("Please fill all required fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/signup', formData);

      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        setUserId(response.data.userId);
        await fetchUserProfile(); // NEW: Fetch user profile data
        navigate(from, { replace: true }); // NEW: Better navigation
      } else {
        alert(response.data.errors);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      alert("Please enter your email address");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/forgot-password', {
        email: formData.email
      });

      if (response.data.success) {
        setResetEmailSent(true);
        alert("Password reset link sent to your email. Check your inbox.");
      } else {
        alert(response.data.message || "Error sending reset link");
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!formData.resetToken || !formData.newPassword || !formData.confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/reset-password', {
        token: formData.resetToken,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        alert("Password reset successfully!");
        // Reset all relevant states
        resetForgotPasswordFlow();
        setState("Login");
      } else {
        alert(response.data.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const resetForgotPasswordFlow = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setTokenFromUrl(null);
    setFormData({
      ...formData,
      email: "",
      newPassword: "",
      confirmPassword: "",
      resetToken: ""
    });
  };

  const { authRedirectMessage} = useContext(ShopContext);

  useEffect(() => {
    if (authRedirectMessage) {
      alert(authRedirectMessage);
      setAuthRedirectMessage('');
    }
  }, [authRedirectMessage, setAuthRedirectMessage]);

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        {showForgotPassword ? (
          <>
            <h1>{resetEmailSent ? "Reset Password" : "Forgot Password"}</h1>
            {resetEmailSent ? (
              <div className="loginsignup-fields">
                <input
                  name="resetToken"
                  value={formData.resetToken}
                  onChange={changeHandler}
                  type="text"
                  placeholder="Enter reset token from email"
                  readOnly={!!tokenFromUrl}
                  style={tokenFromUrl ? { backgroundColor: '#f0f0f0' } : {}}
                />
                <input
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={changeHandler}
                  type="password"
                  placeholder="New Password"
                />
                <input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={changeHandler}
                  type="password"
                  placeholder="Confirm New Password"
                />
                <button 
                  onClick={handlePasswordReset} 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Reset Password'}
                </button>
                <p className="loginsignup-login">
                  Remember your password?{' '}
                  <span onClick={resetForgotPasswordFlow}>
                    Login here
                  </span>
                </p>
              </div>
            ) : (
              <div className="loginsignup-fields">
                <input
                  name="email"
                  value={formData.email}
                  onChange={changeHandler}
                  type="email"
                  placeholder="Enter your registered email"
                  required
                />
                <button 
                  onClick={handleForgotPassword} 
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <p className="loginsignup-login">
                  <span onClick={resetForgotPasswordFlow}>
                    Back to Login
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <h1>{state}</h1>
            <div className="loginsignup-fields">
              {state === "Sign Up" ? (
                <>
                  <input
                    name='phonenumber'
                    value={formData.phonenumber}
                    onChange={changeHandler}
                    type="tel"
                    placeholder='Phone number'
                    maxLength="10"
                  />
                  <input
                    name='email'
                    value={formData.email}
                    onChange={changeHandler}
                    type="email"
                    placeholder='Email Address'
                    required
                  />
                  <input
                    name='password'
                    value={formData.password}
                    onChange={changeHandler}
                    type="password"
                    placeholder='Password'
                    required
                  />
                  <input
                    name='confirmPassword'
                    value={formData.confirmPassword}
                    onChange={changeHandler}
                    type="password"
                    placeholder='Confirm Password'
                    required
                  />
                </>
              ) : (
                <>
                  <input
                    name='email'
                    value={formData.email}
                    onChange={changeHandler}
                    type="email"
                    placeholder='Email Address'
                    required
                  />
                  <input
                    name='password'
                    value={formData.password}
                    onChange={changeHandler}
                    type="password"
                    placeholder='Password'
                    required
                  />
                  <p
                    className="forgot-password"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot Password?
                  </p>
                </>
              )}
            </div>
            <button
              onClick={(e) => state === "Login" ? login(e) : signup(e)}
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
            {state === "Sign Up" ? (
              <p className="loginsignup-login">
                Already have an account?{' '}
                <span
                  onClick={() => setState("Login")}
                  style={{ cursor: 'pointer', color: '#0066cc' }}
                >
                  Login here
                </span>
              </p>
            ) : (
              <p className="loginsignup-login">
                Don't have an account?{' '}
                <span
                  onClick={() => setState("Sign Up")}
                  style={{ cursor: 'pointer', color: '#0066cc' }}
                >
                  Sign up
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
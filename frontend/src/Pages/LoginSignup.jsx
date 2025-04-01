import React, { useState, useEffect } from 'react';
import './CSS/LoginSignup.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

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

  const location = useLocation(); // Get URL params

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token'); 
    if (tokenFromUrl) {
      setFormData(prev => ({ ...prev, resetToken: tokenFromUrl }));
    }
  }, [location]);

  // Handle input changes
  const changeHandler = (e) => {
    const { name, value } = e.target;
    if (name === 'phonenumber' && value.length > 10) return;
    setFormData({ ...formData, [name]: value });
  };

  // Handle login
  const login = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        window.location.replace("/");
      } else {
        alert(response.data.errors || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  // Handle signup
  const signup = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.phonenumber || !formData.password || !formData.confirmPassword) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/signup', formData);

      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        window.location.replace("/");
      } else {
        alert(response.data.errors);
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  // Handle forgot password request
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

  // Handle password reset
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
        setShowForgotPassword(false);
        setState("Login");
        // Reset form
        setFormData({
          ...formData,
          email: "",
          newPassword: "",
          confirmPassword: "",
          resetToken: ""
        });
      } else {
        alert(response.data.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("An error occurred. Please try again.");
    }
  };

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
                  style={{ cursor: 'pointer' }}
                  className="auth-button"
                >
                  Reset Password
                </button>
                <p className="loginsignup-login">
                  Remember your password?{' '}
                  <span
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                    }}
                    style={{ cursor: 'pointer', color: '#0066cc' }}
                  >
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
                  style={{ cursor: 'pointer' }}
                  className="auth-button"
                >
                  Send Reset Link
                </button>
                <p className="loginsignup-login">
                  <span
                    onClick={() => setShowForgotPassword(false)}
                    style={{ cursor: 'pointer', color: '#0066cc' }}
                  >
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
            >
              Continue
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
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { ShopContext } from '../Context/ShopContext';
import './CSS/LoginSignup.css';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';

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
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserId, fetchUserProfile, setAuthRedirectMessage } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  axios.defaults.withCredentials = true;

  const completeSignup = useCallback(async (signupData) => {
    console.log('Completing signup with data:', signupData);
    try {
      const payload = {
        phonenumber: signupData.phonenumber,
        email: signupData.email,
        password: signupData.password
      };
      const response = await axios.post('http://localhost:4000/signup', payload);
      console.log('Signup response:', response.data);

      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        setUserId(response.data.userId);
        await fetchUserProfile();
        navigate(from, { replace: true });
      } else {
        toast.error(response.data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Error completing signup:", error.response?.data || error.message);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, navigate, from, setUserId]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');
    const userId = queryParams.get('userId');
    const emailVerified = queryParams.get('emailVerified');
    const email = queryParams.get('email');
  
    if (token && userId) {
      localStorage.setItem('auth-token', token);
      setUserId(userId);
      fetchUserProfile();
      navigate(from, { replace: true });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (token) {
      setTokenFromUrl(token);
      setFormData(prev => ({ ...prev, resetToken: token }));
      setShowForgotPassword(true);
      setResetEmailSent(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (emailVerified || email) {
      const pendingSignup = JSON.parse(sessionStorage.getItem('pendingSignup'));
      
      if (pendingSignup) {
        completeSignup(pendingSignup);
        sessionStorage.removeItem('pendingSignup');
      }
      
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchUserProfile, navigate, from, setUserId, completeSignup]);

  const changeHandler = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phonenumber') {
      const numbersOnly = value.replace(/\D/g, '');
      if (numbersOnly.length > 10) return;
      
      setFormData({ ...formData, [name]: numbersOnly });
      
      if (numbersOnly.length < 10) {
        setPhoneError('Phone number must be 10 digits');
      } else {
        setPhoneError('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.email || !formData.password) {
      toast.error("Please fill all required fields");
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
        await fetchUserProfile();
        navigate(from, { replace: true });
      } else {
        toast.error(response.data.errors || "Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    if (!formData.email || !formData.phonenumber || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill all required fields");
      setLoading(false);
      return;
    }

    if (formData.phonenumber.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }
  
    try {
      const verifyResponse = await axios.post(
        'http://localhost:4000/check-email-verified',
        { email: formData.email }
      );
  
      if (verifyResponse.data.needsVerification) {
        sessionStorage.setItem('pendingSignup', JSON.stringify(formData));
        window.location.href = `http://localhost:4000/auth/google/verify-email?email=${encodeURIComponent(formData.email)}`;
        return;
      }
  
      await completeSignup(formData);
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error(error.response?.data?.message || "An error occurred. Please try again later.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/forgot-password', {
        email: formData.email
      });

      if (response.data.success) {
        setResetEmailSent(true);
        toast.success("Password reset link sent to your email. Check your inbox.");
      } else {
        toast.error(response.data.message || "Error sending reset link");
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!formData.resetToken || !formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      const response = await axios.post('http://localhost:4000/reset-password', {
        token: formData.resetToken,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        toast.success("Password reset successfully!");
        resetForgotPasswordFlow();
        setState("Login");
      } else {
        toast.error(response.data.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("An error occurred. Please try again.");
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

  const handleGoogleSuccess = () => {
    window.location.href = state === "Login" 
      ? 'http://localhost:4000/auth/google' 
      : 'http://localhost:4000/auth/google/verify-email';
  };

  const handleGoogleFailure = (error) => {
    console.error("Google Sign-In Error:", error);
    toast.error("Failed to sign in with Google. Please try again.");
  };

  const { authRedirectMessage } = useContext(ShopContext);

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
                    placeholder='Phone number (10 digits)'
                    maxLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    required
                  />
                  {phoneError && <div className="error-message">{phoneError}</div>}
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

              {/* Google Sign-In Section - Appears in both forms */}
              <div className="google-auth-section">
                <div className="auth-divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">or</span>
                  <span className="divider-line"></span>
                </div>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  text={state === "Login" ? "signin_with" : "signup_with"}
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
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
                <span onClick={() => setState("Login")}>
                  Login here
                </span>
              </p>
            ) : (
              <p className="loginsignup-login">
                Don't have an account?{' '}
                <span onClick={() => setState("Sign Up")}>
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
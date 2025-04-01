import React, { useState, useEffect } from 'react';
import './CSS/LoginSignup.css';
import axios from 'axios';

const LoginSignup = () => {
  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({
    phonenumber: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const [cart, setCart] = useState([]); // Cart state for the current logged-in user

  // Fetch cart on component load if the user is logged in
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      fetchCart(token);
    }
  }, []);

  // Fetch cart from the backend
  const fetchCart = async (token) => {
    try {
      const response = await axios.get('http://localhost:4000/cart', {
        headers: { 'auth-token': token },
      });
      if (response.data.success) {
        setCart(response.data.items); // Update cart state
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

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
        localStorage.setItem('auth-token', response.data.token); // Save token
        fetchCart(response.data.token); // Fetch cart data on login
        window.location.replace("/"); // Redirect after successful login
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
        localStorage.setItem('auth-token', response.data.token); // Save token
        fetchCart(response.data.token); // Fetch cart data on signup
        window.location.replace("/"); // Redirect after successful signup
      } else {
        alert(response.data.errors); // Show error message from backend
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  // Handle logout
  const logout = async () => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      try {
        await axios.delete('http://localhost:4000/cart', {
          headers: { 'auth-token': token },
        });
        localStorage.removeItem('auth-token'); // Remove token
        setCart([]); // Clear cart state
        window.location.replace("/"); // Redirect after logout
      } catch (error) {
        console.error('Error clearing cart on logout:', error);
      }
    }
  };

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <div className="loginsignup-fields">
          {state === "Sign Up" && (
            <>
              <input
                name='phonenumber'
                value={formData.phonenumber}
                onChange={changeHandler}
                type="tel"
                placeholder='Phone number'
              />
              <input
                name='email'
                value={formData.email}
                onChange={changeHandler}
                type="email"
                placeholder='Email Address'
              />
              <input
                name='password'
                value={formData.password}
                onChange={changeHandler}
                type="password"
                placeholder='Password'
              />
              <input
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={changeHandler}
                type="password"
                placeholder='Confirm Password'
              />
            </>
          )}
          {state === "Login" && (
            <>
              <input
                name='email'
                value={formData.email}
                onChange={changeHandler}
                type="email"
                placeholder='Email Address'
              />
              <input
                name='password'
                value={formData.password}
                onChange={changeHandler}
                type="password"
                placeholder='Password'
              />
            </>
          )}
        </div>
        <button
          onClick={(e) => { state === "Login" ? login(e) : signup(e) }}
          style={{ cursor: 'pointer' }}
        >
          Continue
        </button>

        {state === "Sign Up" ? (
          <p className="loginsignup-login">
            Already have an account?
            <span
              onClick={() => { setState("Login") }}
              style={{ cursor: 'pointer' }}
            >
              Login here
            </span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Create an account?
            <span
              onClick={() => { setState("Sign Up") }}
              style={{ cursor: 'pointer' }}
            >
              Click here
            </span>
          </p>
        )}

        <div className="loginsignup-agree">
          <input type="checkbox" name='' id='' />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
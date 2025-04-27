import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ShopContextProvider from './Context/ShopContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
// import { ToastContainer } from 'react-toastify'; // Import ToastContainer

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
  <ShopContextProvider>
    <App />
    {/* <ToastContainer position="top-right"
      draggable
    
    /> Add ToastContainer here */}
  </ShopContextProvider>
  </GoogleOAuthProvider>
);

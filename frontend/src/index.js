import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ShopContextProvider from './Context/ShopContext';
import { ToastContainer } from 'react-toastify'; // Import ToastContainer

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ShopContextProvider>
    <App />
    <ToastContainer position="top-right"
      draggable
    
    /> {/* Add ToastContainer here */}
  </ShopContextProvider>
);

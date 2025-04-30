import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position="top-right" autoClose={3000} pauseOnHover />
    </BrowserRouter>
  </StrictMode>
);
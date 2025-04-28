import React, { useState } from 'react';
import './Footer.css';
import instagram_icon from '../Assets/instagram_icon.png';
import whatsapp_icon from '../Assets/whatsapp_icon.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Subscribed successfully!');
        setEmail('');
      } else {
        setMessage(data.message || 'Subscription failed');
      }
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="footer">
      <div className="footer-subscribe">
        <h3>Subscribe to Our Newsletter</h3>
        <form onSubmit={handleSubscribe}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button type="submit">Subscribe</button>
        </form>
        {message && (
          <p className={message.includes('success') ? 'success' : 'error'}>
            {message}
          </p>
        )}
      </div>

      <div className="footer-social-icon">
        <div className="footer-icons-container">
          <a
            href="https://www.instagram.com/greesh_dahal" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img src={instagram_icon} alt="Instagram" />
          </a>
        </div>
        <div className="footer-icons-container">
          <a
            href="https://wa.me/9860461600" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img src={whatsapp_icon} alt="WhatsApp" />
          </a>
        </div>
      </div>

      <div className="footer-copyright">
        <hr />
        <p>Copyright © 2024 - All Rights Reserved</p>
      </div>
    </div>
  );
};

export default Footer;

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './OrderSuccess.css'; 

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleContinueShopping = () => {
    navigate('/'); // Navigate to homepage
  };

  useEffect(() => {
    const saveOrder = async () => {
      try {
        console.log("Order Success page loaded!");
    
        const params = new URLSearchParams(location.search);
        const amount = parseInt(params.get('amount'), 10) / 100;
        const status = params.get('status');
        const cartItems = JSON.parse(localStorage.getItem('cartItems'));
        const token = localStorage.getItem('auth-token');
    
        console.log("Payment Status:", status);
        console.log("Cart Items:", cartItems);
        console.log("Auth Token:", token);
    
        if (status === "Completed" && cartItems?.length > 0) {
          console.log("Attempting to save order...");
    
          const res = await axios.post('http://localhost:4000/api/orders', {
            items: cartItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              name: item.name
            })),
            total: amount,
            paymentMethod: "Khalti"
          }, {
            headers: {
              'auth-token': token
            }
          });
    
          console.log("Order Saved Successfully", res.data);
    
          localStorage.removeItem('cartItems');
        } else {
          console.log("Order not saved - conditions not met");
        }
      } catch (err) {
        console.error("Failed to save order", err.response?.data || err.message);
      }
    };
    

    saveOrder();
  }, [location]);

  return (
    <div className="order-success-container">
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for your purchase. Your order has been successfully placed.</p>
      <p>
        You will receive a <span className="highlight-red">confirmation email ✉️</span> shortly with the 
        <span className="highlight-red">product code 🏷️</span> of your order.
      </p>


      <div className="order-success-actions">
        <button onClick={handleContinueShopping} className="continue-shopping-button">
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;

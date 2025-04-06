import React, { useState } from 'react';
import { useShop } from '../../Context/ShopContext';
import { useNavigate } from 'react-router-dom';
import '../Checkout/Checkout.css';

const Checkout = () => {
  const { getCartProducts, getTotalCartAmount, clearCart } = useShop();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cartProducts = getCartProducts();
  const totalAmount = getTotalCartAmount();

  const loadKhaltiScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.17.0.0.0/khalti-checkout.iffe.js';
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handleKhaltiPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await loadKhaltiScript();
      
      const config = {
        publicKey: 'live_public_key_a4de84193a7a41b0be8e73a2beb3a8ec',
        productIdentity: `order_${Date.now()}`,
        productName: `${cartProducts.length} items from GR10`,
        productUrl: window.location.href,
        eventHandler: {
          onSuccess(payload) {
            verifyPayment(payload);
          },
          onError(error) {
            console.error('Payment error:', error);
            setError('Payment failed. Please try again.');
          },
          onClose() {
            console.log('Widget closed');
          }
        }
      };

      const checkout = new window.KhaltiCheckout(config);
      checkout.show({ amount: totalAmount * 100 }); // Convert to paisa
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (payload) => {
    try {
      const response = await fetch('http://localhost:4000/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': localStorage.getItem('auth-token')
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        // Create order
        await createOrder(data.payment);
        clearCart();
        navigate('/order-success');
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError(err.message);
    }
  };

  

  const createOrder = async (paymentDetails) => {
    const orderItems = cartProducts.map(item => ({
      productId: item._id,
      quantity: item.quantity,
      price: item.new_price,
      name: item.name
    }));

    const orderData = {
      items: orderItems,
      total: totalAmount,
      paymentMethod: 'Khalti',
      paymentDetails
    };

    await fetch('http://localhost:4000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth-token': localStorage.getItem('auth-token')
      },
      body: JSON.stringify(orderData)
    });
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="order-summary">
        <h3>Order Summary</h3>
        {cartProducts.map(item => (
          <div key={item._id} className="order-item">
            <span>{item.name} (x{item.quantity})</span>
            <span>Rs {item.new_price * item.quantity}</span>
          </div>
        ))}
        <div className="order-total">
          <span>Total:</span>
          <span>Rs {totalAmount}</span>
        </div>
      </div>

      <div className="payment-options">
        <h3>Payment Method</h3>
        <button 
          onClick={handleKhaltiPayment}
          disabled={loading || cartProducts.length === 0}
          className="khalti-button"
        >
          {loading ? 'Processing...' : 'Pay with Khalti'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Checkout;
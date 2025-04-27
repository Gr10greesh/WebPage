import React, { useState } from 'react';
import { useShop } from '../../Context/ShopContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Checkout/Checkout.css';

const Checkout = () => {
  const { getCartProducts, getTotalCartAmount, clearCart } = useShop();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const cartProducts = getCartProducts();
  const totalAmount = getTotalCartAmount();

  const handleKhaltiPayment = async () => {
    try {
      setLoading(true);
      setError(null);
  
      //  Save cart items to localStorage before payment
      localStorage.setItem('cartItems', JSON.stringify(cartProducts.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        price: item.new_price,
        name: item.name
      }))));
  
      const userInfo = JSON.parse(localStorage.getItem('user-info'));
  
      const payload = {
        return_url: window.location.origin + '/order-success',
        website_url: window.location.origin,
        amount: totalAmount * 100, // Convert to paisa
        purchase_order_id: `order_${Date.now()}`,
        purchase_order_name: `${cartProducts.length} items`,
        customer_info: {
          name: userInfo?.name || 'Customer',
          email: userInfo?.email || '',
          phone: userInfo?.phone || ''
        },
        amount_breakdown: [
          {
            label: "Subtotal",
            amount: totalAmount * 100
          }
        ],
        product_details: cartProducts.map(item => ({
          identity: item._id,
          name: item.name,
          total_price: item.new_price * item.quantity * 100,
          quantity: item.quantity,
          unit_price: item.new_price * 100
        })),
        merchant_username: "DAHAL GREESH",
      };
      console.log(payload);
  
      const response = await axios.post('https://dev.khalti.com/api/v2/epayment/initiate/', payload, {
        headers: {
          'Authorization': 'Key 07ae821e2c2140cfba436d9b7ac4b6f7',
          'Content-Type': 'application/json'
        }
      });
  
      if (response.data && response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        throw new Error('Failed to initiate payment');
      }
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
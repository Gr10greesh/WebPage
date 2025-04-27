import React, { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useShop } from '../../Context/ShopContext';

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart, getCartProducts, getTotalCartAmount } = useShop();

  const createOrder = useCallback(async (paymentDetails) => {
    const cartProducts = getCartProducts();
    const totalAmount = getTotalCartAmount();

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
  }, [getCartProducts, getTotalCartAmount]);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const pidx = query.get('pidx');
  
        if (!pidx) {
          throw new Error('Payment ID (pidx) not found');
        }
  
        const response = await fetch(`http://localhost:4000/api/payment/verify?pidx=${pidx}`, {
          headers: {
            'auth-token': localStorage.getItem('auth-token')
          }
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || 'Payment verification failed');
        }
  
        await createOrder(data.payment);
        clearCart();
        navigate('/order-success');
        
      } catch (err) {
        console.error('Payment processing error:', err);
        navigate('/checkout', { state: { error: err.message } });
      }
    };
  
    verifyPayment();
  }, [location, navigate, clearCart, createOrder]);

  return (
    <div>
      <h2>Processing Payment...</h2>
    </div>
  );
};

export default PaymentCallback;
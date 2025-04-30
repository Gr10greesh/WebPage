import { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import { Link } from "react-router-dom";
import './OrderHistory.css';

const OrderHistory = () => {
  const { userId } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        const res = await fetch('http://localhost:4000/api/user/orders', {
          headers: {
            'auth-token': token
          }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          throw new Error(data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadOrders();
  }, [userId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    let colorClass = '';
    switch (status.toLowerCase()) {
      case 'processing':
        colorClass = 'badge-processing';
        break;
      case 'delivered':
        colorClass = 'badge-delivered';
        break;
      case 'cancelled':
        colorClass = 'badge-cancelled';
        break;
      default:
        colorClass = '';
    }
    return <span className={`status-badge ${colorClass}`}>{status}</span>;
  };

  return (
    <div className="order-history-container">
      <div className="order-content">
        <h2>Your Orders</h2>

        {loading ? (
          <div className="loading-spinner">Loading orders...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet</p>
            <Link to="/" className="shop-button">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-meta">
                    <span className="order-id">Order #{order._id.slice(-6)}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status">
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="order-total">Rs {order.total?.toFixed(2) || 0}</div>
                </div>

                <div className="order-details">
                  <div className="order-items">
                    <h4>Items</h4>
                    {order.items.map(item => (
                      <div key={item._id} className="order-item">
                        <img src={item.productId?.image} alt={item.productId?.name} />
                        <div className="item-info">
                          <h5>{item.productId?.name}</h5>
                          <p>Quantity: {item.quantity}</p>
                          <p>Price: Rs {item.price?.toFixed(2) || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-summary">
                    <h4>Order Summary</h4>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>Rs {order.total?.toFixed(2) || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

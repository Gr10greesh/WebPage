import { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../Context/ShopContext';
import { Link} from "react-router-dom";
import './OrderHistory.css';

const OrderHistory = () => {
  const { fetchData, userId } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchData(`/api/users/${userId}/orders`);
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (userId) loadOrders();
  }, [userId, fetchData]);

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="order-history-container">
      <div className="order-sidebar">
      </div>

      <div className="order-content">
        <h2>Your Orders</h2>
        
        {loading ? (
          <div className="loading-spinner">Loading orders...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>You haven't placed any orders yet</p>
            <Link to="/shop" className="shop-button">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className={`order-card ${expandedOrder === order._id ? 'expanded' : ''}`}>
                <div className="order-header" onClick={() => toggleOrder(order._id)}>
                  <div className="order-meta">
                    <span className="order-id">Order #{order.orderNumber}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status">
                    <span className={`status-badge ${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="order-total">${order.totalAmount.toFixed(2)}</div>
                </div>

                {expandedOrder === order._id && (
                  <div className="order-details">
                    <div className="order-items">
                      <h4>Items</h4>
                      {order.items.map(item => (
                        <div key={item._id} className="order-item">
                          <img src={item.product.image} alt={item.product.name} />
                          <div className="item-info">
                            <h5>{item.product.name}</h5>
                            <p>Quantity: {item.quantity}</p>
                            <p>Price: ${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="order-summary">
                      <h4>Order Summary</h4>
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping:</span>
                        <span>${order.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax:</span>
                        <span>${order.tax.toFixed(2)}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>${order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <button className="track-button">Track Package</button>
                      <button className="return-button">Request Return</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
import React, { useEffect, useState } from 'react';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [codeInputs, setCodeInputs] = useState({});

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/admin/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:4000/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const archiveOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to archive this order?')) return;
    try {
      const res = await fetch(`http://localhost:4000/api/admin/orders/${orderId}/archive`, {
        method: 'PUT',
      });
      const data = await res.json();
      if (data.success) {
        alert('Order archived successfully!');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error archiving order:', error);
    }
  };

  const sendProductCode = async (orderId) => {
    const code = codeInputs[orderId];
    if (!code) {
      alert("Please enter a product code before sending!");
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/admin/orders/${orderId}/sendcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product code sent successfully!');
        fetchOrders();
      } else {
        alert('Failed to send code!');
      }
    } catch (error) {
      console.error('Error sending product code:', error);
    }
  };

  const getStatusBadge = (status) => {
    let color = '';
    switch (status) {
      case 'processing':
        color = 'badge-processing';
        break;
      case 'delivered':
        color = 'badge-delivered';
        break;
      case 'cancelled':
        color = 'badge-cancelled';
        break;
      default:
        color = '';
    }
    return <span className={`status-badge ${color}`}>{status}</span>;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="orders">
      <h1>All Orders</h1>
      <div className="orders-table">
        <div className="orders-header">
          <div>User</div>
          <div>Products</div>
          <div>Quantity</div>
          <div>Total Price</div>
          <div>Payment</div>
          <div>Status</div>
          <div>Change Status</div>
          <div>Product Code</div>
          <div>Time</div>
        </div>
        <hr />
        {orders.map((order) => (
          <div className="orders-row" key={order._id}>
            <div>{order.userId?.email || order.userId?.phonenumber || "Unknown"}</div>
            <div className="order-item-list">
              {order.items.map((item) => (
                <div key={item._id}>{item.name}</div>
              ))}
            </div>
            <div className="order-item-list">
              {order.items.map((item) => (
                <div key={item._id}>{item.quantity}</div>
              ))}
            </div>
            <div>Rs {order.total}</div>
            <div>{order.paymentMethod}</div>
            <div>{getStatusBadge(order.status)}</div>
            <div className="order-actions">
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
              >
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={() => archiveOrder(order._id)} className="archive-btn">
                🗃️ Archive
              </button>
            </div>
            <div className="code-actions">
              <input
                type="text"
                placeholder="Enter Code"
                value={codeInputs[order._id] || ''}
                onChange={(e) => setCodeInputs({ ...codeInputs, [order._id]: e.target.value })}
                className="code-input"
              />
              <button onClick={() => sendProductCode(order._id)} className="send-btn">
                Send Code
              </button>
            </div>
            <div>{new Date(order.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;

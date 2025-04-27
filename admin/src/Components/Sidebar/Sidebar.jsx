import React from 'react';
import './Sidebar.css';
import { NavLink } from 'react-router-dom'; // Switched to NavLink for active state
import add_product_icon from '../../assets/Product_Cart.svg';
import list_product_icon from '../../assets/Product_list_icon.svg';
import orders_icon from '../../assets/orders_icon.svg';

const Sidebar = () => {
  const sidebarItems = [
    {
      path: '/addproduct',
      icon: add_product_icon,
      text: 'Add Product',
      alt: 'Add Product Icon',
    },
    {
      path: '/listproduct',
      icon: list_product_icon,
      text: 'Product List',
      alt: 'Product List Icon',
    },
    {
      path: '/orders',
      icon: orders_icon,
      text: 'Orders',
      alt: 'Orders Icon',
    },
  ];

  return (
    <div className="sidebar">
      {sidebarItems.map((item, index) => (
        <NavLink
          to={item.path}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          key={index}
        >
          <div className="sidebar-item">
            <img src={item.icon} alt={item.alt} className="sidebar-icon" />
            <p>{item.text}</p>
          </div>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
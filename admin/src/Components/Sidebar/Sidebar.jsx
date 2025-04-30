import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import add_product_icon from '../../assets/Product_Cart.svg';
import list_product_icon from '../../assets/Product_list_icon.svg';
import orders_icon from '../../assets/orders_icon.svg';

const Sidebar = () => {
  const sidebarItems = [
    { path: '/admin/addproduct', icon: add_product_icon, text: 'Add Product' },
    { path: '/admin/listproduct', icon: list_product_icon, text: 'Product List' },
    { path: '/admin/orders', icon: orders_icon, text: 'Orders' },
  ];

  return (
    <div className="sidebar">
      {sidebarItems.map((item, index) => (
        <NavLink 
          to={item.path} 
          key={index} 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-item">
            <img src={item.icon} alt="sidebar-icon" />
            <p>{item.text}</p>
          </div>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;

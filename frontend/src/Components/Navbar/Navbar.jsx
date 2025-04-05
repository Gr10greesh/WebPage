import React, { useState, useRef, useEffect, useContext } from "react";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import Cart from "../Cart/Cart";
import { Link, useLocation } from "react-router-dom";
import nav_dropdown from "../Assets/nav_dropdown.png";
import { ShopContext } from "../../Context/ShopContext";
import { FiUser, FiShoppingBag, FiLogOut, FiLayout } from 'react-icons/fi';

const Navbar = () => {
  const [menu, setMenu] = useState("shop");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userData, setUserData] = useState(null); // 
  const menuRef = useRef();
  const dropdownRef = useRef();
  const location = useLocation();

  const { clearCart, setSearchResults, userId } = useContext(ShopContext);

  const dropdown_toggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    clearCart();
    window.location.href = "/";
  };

  //  Fetch user data correctly
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/user", {
          headers: {
            "auth-token": localStorage.getItem("auth-token"),
          },
        });

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType?.includes("application/json")) {
          const text = await res.text();
          console.error("Unexpected response:", text);
          return;
        }

        const data = await res.json();
        setUserData(data); 
        console.log("User Data:", data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]); 

  const fetchallproducts = async () => {
    try {
      const response = await fetch('http://localhost:4000/allproducts');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (location.pathname === "/") {
      if (query.trim() === "") {
        fetchallproducts();
      } else {
        searchProducts(query);
      }
    }
  };

  const searchProducts = async (query) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/search?q=${query}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    }
  };

  const showSearch = location.pathname === "/";

  return (
    <div className="navbar">
      <div className="navbar-brand">
        <div className="nav-logo">
          <img src={logo} alt="Logo" />
        </div>
        <div className="webname">
          <p>Gr10</p>
        </div>
        <img
          className={`nav-dropdown ${isMenuOpen ? "rotate" : ""}`} 
          ref={dropdownRef}
          onClick={dropdown_toggle}
          src={nav_dropdown}
          alt="Dropdown Icon"
        />
      </div>

      {showSearch && (
        <div className="nav-search">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}

      <ul
        ref={menuRef}
        className={`nav-menu ${isMenuOpen ? "nav-menu-visible" : ""}`} 
      >
        <li onClick={() => setMenu("shop")}>
          <Link to="/" style={{ textDecoration: "none" }}>
            Shop
          </Link>
          {menu === "shop" && <hr />}
        </li>
        <li onClick={() => setMenu("giftcard")}>
          <Link to="/giftcard" style={{ textDecoration: "none" }}>
            GiftCard
          </Link>
          {menu === "giftcard" && <hr />}
        </li>
        <li onClick={() => setMenu("mobilegames")}>
          <Link to="/mobilegames" style={{ textDecoration: "none" }}>
            MobileGames
          </Link>
          {menu === "mobilegames" && <hr />}
        </li>
        <li onClick={() => setMenu("freefire")}>
          <Link to="/freefire" style={{ textDecoration: "none" }}>
            Freefire
          </Link>
          {menu === "freefire" && <hr />}
        </li>
      </ul>

      <div className="nav-login-cart">
        {localStorage.getItem("auth-token") ? (
          <div className="user-menu-container">
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={userData?.avatar || "/default-avatar.png"}
                alt="Profile"
                className="user-avatar"
              />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <p className="user-name">{userData?.firstName || 'User'}</p>
                  <p className="user-email">{userData?.email}</p>
                </div>
                <div className="dropdown-links">
                  <Link to="/dashboard" onClick={() => setShowUserMenu(false)}>
                    <FiLayout className="icon" /> Dashboard
                  </Link>
                  <Link to="/dashboard/profile" onClick={() => setShowUserMenu(false)}>
                    <FiUser className="icon" /> Profile
                  </Link>
                  <Link to="/dashboard/orders" onClick={() => setShowUserMenu(false)}>
                    <FiShoppingBag className="icon" /> Orders
                  </Link>
                  <button onClick={handleLogout}>
                    <FiLogOut className="icon" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button>Login</button>
          </Link>
        )}
        <Cart />
      </div>
    </div>
  );
};

export default Navbar;

"use client";

import { useState, useEffect, useCallback } from "react";
import { useShop } from "../../Context/ShopContext";
import "../Cart/Cart.css";
import { Link } from "react-router-dom";

const Cart = () => {
  const {
    getCartProducts,
    getTotalCartItems,
    getTotalCartAmount,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCartFromServer,
  } = useShop();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Optimized fetch function
  const fetchCartData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await fetchCartFromServer();
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      setError("Failed to load cart items");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCartFromServer]);

  // Single useEffect for data fetching
  useEffect(() => {
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen, fetchCartData]);

  useEffect(() => {
    fetchCartData();     
  }, [fetchCartData]);

  // Toggle cart visibility
  const toggleCart = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close cart on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Get cart data
  const cartProducts = getCartProducts();
  const totalItems = getTotalCartItems();
  const totalAmount = getTotalCartAmount();

  // Debug logs (remove in production)
  useEffect(() => {
    console.log("Cart Products:", cartProducts);
    console.log("Total Items:", totalItems);
    console.log("Total Amount:", totalAmount);
  }, [cartProducts, totalItems, totalAmount]);

  return (
    <div className="cart-container">
      {/* Cart Icon Button */}
      <button 
        className="cart-icon" 
        onClick={toggleCart}
        aria-label={`Cart (${totalItems} items)`}
        aria-expanded={isOpen}
      >
        🛒 <span className="cart-count">{totalItems}</span>
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          <div className={`cart-sidebar ${isOpen ? "open" : ""}`}>
            <div className="cart-header">
              <h2>Your Cart ({totalItems})</h2>
              <button 
                className="close-btn" 
                onClick={toggleCart}
                aria-label="Close cart"
              >
                ×
              </button>
            </div>

            <div className="cart-items">
              {error ? (
                <div className="error-message">{error}</div>
              ) : isLoading ? (
                <div className="loading-spinner">Loading cart...</div>
              ) : cartProducts.length === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                cartProducts.map((item) => (
                  <div key={item._id} className="cart-item">
                    <img 
                      src={item.image || "/placeholder.svg"} 
                      alt={item.name} 
                      className="item-image" 
                      width={80}
                      height={80}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p className="item-price">Rs {item.new_price}</p>
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} 
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeFromCart(item._id)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {cartProducts.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>Rs {totalAmount}</span>
                </div>
                <div className="cart-actions">
                  <Link to="/checkout" className="checkout-btn">
                    Proceed to Checkout
                  </Link>
                  <button 
                    className="clear-btn" 
                    onClick={() => {
                      clearCart();
                      setIsOpen(false);
                    }}
                    aria-label="Clear cart"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
          <div 
            className={`cart-overlay ${isOpen ? "visible" : ""}`} 
            onClick={toggleCart}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
};

export default Cart;
"use client";

import { useState, useEffect } from "react";
import { useShop } from "../../Context/ShopContext";
import "../Cart/Cart.css";

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

  // Fetch cart data when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchCartFromServer();
    }
  }, [isOpen, fetchCartFromServer]);

  // Handle cart opening/closing
  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  // Fetch cart data when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchCartFromServer().finally(() => setIsLoading(false));
    }
  }, [isOpen, fetchCartFromServer]);

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

  const cartProducts = getCartProducts();
  const totalItems = getTotalCartItems();
  const totalAmount = getTotalCartAmount();

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
              {isLoading ? (
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
                  <button className="checkout-btn">Proceed to Checkout</button>
                  <button 
                    className="clear-btn" 
                    onClick={clearCart}
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
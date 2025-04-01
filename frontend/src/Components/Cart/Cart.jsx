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

  // Fetch cart data when component mounts and when cart opens
  useEffect(() => {
    fetchCartFromServer();
  }, [fetchCartFromServer]);

  useEffect(() => {
    if (isOpen) {
      fetchCartFromServer();
    }
  }, [isOpen, fetchCartFromServer]);

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const cartProducts = getCartProducts();
  const totalItems = getTotalCartItems();
  const totalAmount = getTotalCartAmount();

  return (
    <div className="cart-container">
      {/* Cart Icon Button */}
      <button className="cart-icon" onClick={toggleCart}>
        🛒 <span className="cart-count">{totalItems}</span>
      </button>

      {/* Cart Dropdown */}
      {isOpen && (
        <>
          <div className="cart-sidebar">
            <div className="cart-header">
              <h2>Your Cart ({totalItems})</h2>
              <button className="close-btn" onClick={toggleCart}>×</button>
            </div>

            <div className="cart-items">
              {cartProducts.length === 0 ? (
                <p className="empty-cart">Your cart is empty</p>
              ) : (
                cartProducts.map((item) => (
                  <div key={item._id} className="cart-item">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="item-image" />
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p className="item-price">Rs {item.new_price}</p>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item._id)}>×</button>
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
                  <button className="checkout-btn">Checkout</button>
                  <button className="clear-btn" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="cart-overlay" onClick={toggleCart}></div>
        </>
      )}
    </div>
  );
};

export default Cart;
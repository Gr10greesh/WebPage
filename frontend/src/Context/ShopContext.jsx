import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all products from the API
  useEffect(() => {
    axios
      .get("http://localhost:4000/allproducts")
      .then((response) => {
        setAllProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  // Memoized fetch cart function
  const fetchCartFromServer = useCallback(async () => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      try {
        const response = await axios.get("http://localhost:4000/cart", { 
          headers: { "auth-token": token } 
        });
        
        if (response.data?.success) {
          const cart = {};
          response.data.items?.forEach((item) => {
            if (item?.productId?._id) {  
              cart[item.productId._id] = item.quantity || 1;
            }
          });
          
          // Only update state if cart actually changed
          if (JSON.stringify(cart) !== JSON.stringify(cartItems)) {
            setCartItems(cart);
          }
        }
        return response.data?.items || [];
      } catch (error) {
        console.error("Error fetching cart:", error);
        return [];
      }
    }
    return [];
  }, [cartItems]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const updateCartOnServer = useCallback((updatedCart) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios
        .post("http://localhost:4000/update-cart", 
          { cartItems: updatedCart }, 
          { headers: { "auth-token": token } }
        )
        .catch((error) => console.error("Error updating cart:", error));
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    const idStr = String(productId);
    setCartItems((prevCart) => {
      const updatedCart = { ...prevCart };
      delete updatedCart[idStr];
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  }, [updateCartOnServer]);

  const updateQuantity = useCallback((productId, quantity) => {
    const idStr = String(productId);
    if (quantity <= 0) {
      removeFromCart(idStr);
      return;
    }

    setCartItems((prevCart) => {
      const updatedCart = { ...prevCart, [idStr]: quantity };
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  }, [removeFromCart, updateCartOnServer]);

  const addToCart = useCallback((productId) => {
    const idStr = String(productId);
    setCartItems((prevCart) => {
      const updatedCart = { 
        ...prevCart, 
        [idStr]: (prevCart[idStr] || 0) + 1 
      };
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  }, [updateCartOnServer]);

  const clearCart = useCallback(() => {
    setCartItems({});
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios
        .post("http://localhost:4000/clear-cart", {}, { 
          headers: { "auth-token": token } 
        })
        .catch((error) => console.error("Error clearing cart:", error));
    }
  }, []);

  const getTotalCartAmount = useCallback(() => {
    return Object.keys(cartItems).reduce((total, productId) => {
      const product = allProducts.find((p) => p._id === productId);
      return product ? total + product.new_price * cartItems[productId] : total;
    }, 0);
  }, [cartItems, allProducts]);

  const getTotalCartItems = useCallback(() => {
    return Object.values(cartItems).reduce((total, count) => total + count, 0);
  }, [cartItems]);

  const getCartProducts = useCallback(() => {
    return Object.keys(cartItems)
      .map((productId) => {
        const product = allProducts.find((p) => p._id === productId);
        return product ? { ...product, quantity: cartItems[productId] } : null;
      })
      .filter(Boolean);
  }, [cartItems, allProducts]);

  // Memoized context value
  const contextValue = useMemo(() => ({
    allProducts,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalCartAmount,
    getTotalCartItems,
    getCartProducts,
    loading,
    fetchCartFromServer,
    searchResults,
    setSearchResults
  }), [
    allProducts,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalCartAmount,
    getTotalCartItems,
    getCartProducts,
    loading,
    fetchCartFromServer,
    searchResults
  ]);

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopContextProvider");
  }
  return context;
};

export default ShopContextProvider;
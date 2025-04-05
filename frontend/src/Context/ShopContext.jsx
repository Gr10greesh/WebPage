import { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authRedirectMessage, setAuthRedirectMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);


  // Enhanced fetch function with error handling
  const fetchData = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios({
        method: options.method || "get",
        url: `http://localhost:4000${url}`,
        data: options.data,
        headers: {
          "auth-token": localStorage.getItem("auth-token"),
          ...options.headers
        }
      });
      return response.data;
    } catch (err) {
      console.error(`API Error (${url}):`, err);
      setError(err.response?.data?.message || "An error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchData("/allproducts");
        setAllProducts(data);
      } catch {
        // Error already handled by fetchData
      }
    };
    loadProducts();
  }, [fetchData]);


  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await fetchData("/api/user");
      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      throw err;
    }
  }, [fetchData]);
  
  const updateUserProfile = useCallback(async (profileData) => {
    try {
      const data = await fetchData("/api/user/profile", {
        method: "PUT",
        data: profileData
      });
      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  }, [fetchData]);
  
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return fetchData("/api/user/change-password", {
      method: "POST",
      data: { currentPassword, newPassword }
    });
  }, [fetchData])

  const verifyUserToken = useCallback(async () => {
    return fetchData('/api/user/verify-token'); // Just checks if token is valid
  }, [fetchData]);

  // Cart management functions
  const fetchCartFromServer = useCallback(async () => {
    try {
      const { items = [] } = await fetchData("/cart");
      
      const newCartItems = items.reduce((acc, item) => {
        if (item?.productId?._id) {
          acc[item.productId._id] = item.quantity || 1;
        }
        return acc;
      }, {});

      setCartItems(prev => {
        return JSON.stringify(prev) !== JSON.stringify(newCartItems) 
          ? newCartItems 
          : prev;
      });

      return items;
    } catch {
      return [];
    }
  }, [fetchData]);

  // Sync cart to server when changes occur
  const updateCartOnServer = useCallback(async (updatedCart) => {
    if (!localStorage.getItem("auth-token")) return;
    
    try {
      await fetchData("/update-cart", {
        method: "post",
        data: { cartItems: updatedCart }
      });
    } catch {
      // Error already handled by fetchData
    }
  }, [fetchData]);

  // Cart operations
  const removeFromCart = useCallback((productId) => {
    const idStr = String(productId);
    setCartItems(prev => {
      const { [idStr]: _, ...rest } = prev;
      updateCartOnServer(rest);
      return rest;
    });
  }, [updateCartOnServer]);

  const updateQuantity = useCallback((productId, quantity) => {
    const idStr = String(productId);
    const qty = Number(quantity) || 0;

    setCartItems(prev => {
      const updatedCart = qty <= 0 
        ? (() => {
            const { [idStr]: _, ...rest } = prev;
            return rest;
          })()
        : { ...prev, [idStr]: qty };

      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  }, [updateCartOnServer]);

  const addToCart = useCallback((productId) => {
    const idStr = String(productId);
    setCartItems(prev => {
      const updatedCart = { 
        ...prev, 
        [idStr]: (prev[idStr] || 0) + 1 
      };
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  }, [updateCartOnServer]);

  const clearCart = useCallback(() => {
    setCartItems({});
    if (localStorage.getItem("auth-token")) {
      fetchData("/clear-cart", { method: "post" }).catch(() => {});
    }
  }, [fetchData]);

  // Derived cart values
  const getTotalCartAmount = useCallback(() => {
    return Object.entries(cartItems).reduce((total, [productId, quantity]) => {
      const product = allProducts.find(p => p._id === productId);
      return total + (product?.new_price || 0) * quantity;
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

  // Search functionality
  const searchProducts = useCallback(async (query) => {
    try {
      const results = await fetchData(`/api/products/search?q=${encodeURIComponent(query)}`);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }, [fetchData]);

  // Context value
  const contextValue = useMemo(() => ({
    allProducts,
    userId,
    setUserId,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalCartAmount,
    getTotalCartItems,
    getCartProducts,
    loading,
    error,
    fetchCartFromServer,
    searchResults,
    setSearchResults,
    searchProducts,
    authRedirectMessage,
    setAuthRedirectMessage,
    fetchUserProfile,
    userProfile,
    updateUserProfile,
    verifyUserToken,
    changePassword
  }), [
    allProducts,
    userId,
    setUserId,
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalCartAmount,
    getTotalCartItems,
    getCartProducts,
    loading,
    error,
    fetchCartFromServer,
    searchResults,
    searchProducts,
    authRedirectMessage,
    fetchUserProfile,
    userProfile,
    updateUserProfile,
    verifyUserToken,
    changePassword
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
import { createContext, useState, useEffect, useContext } from "react";
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
        console.log("Fetched Products:", response.data);
        setAllProducts(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      });
  }, []);

  // Fetch cart data from the server
  const fetchCartFromServer = () => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      return axios
        .get("http://localhost:4000/cart", { headers: { "auth-token": token } })
        .then((response) => {
          if (response.data?.success) {
            const cart = {};
            response.data.items?.forEach((item) => {
              if (item?.productId?._id) {  
                cart[item.productId._id] = item.quantity || 1;
              }
            });
            setCartItems(cart);
          }
        })
        .catch((error) => {
          console.error("Error fetching cart:", error);
          throw error;
        });
    }
    return Promise.resolve();
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const updateCartOnServer = (updatedCart) => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios
        .post("http://localhost:4000/update-cart", { cartItems: updatedCart }, { 
          headers: { "auth-token": token } 
        })
        .catch((error) => console.error("Error updating cart:", error));
    }
  };

  const addToCart = async (productId) => {
    const idStr = String(productId);
    setCartItems((prevCart) => {
      const updatedCart = { 
        ...prevCart, 
        [idStr]: (prevCart[idStr] || 0) + 1 
      };
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
    await fetchCartFromServer(); // Refresh cart after update
  };

  const updateQuantity = (productId, quantity) => {
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
  };

  const removeFromCart = (productId) => {
    const idStr = String(productId);
    setCartItems((prevCart) => {
      const updatedCart = { ...prevCart };
      delete updatedCart[idStr];
      updateCartOnServer(updatedCart);
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCartItems({});
    const token = localStorage.getItem("auth-token");
    if (token) {
      axios
        .post("http://localhost:4000/clear-cart", {}, { 
          headers: { "auth-token": token } 
        })
        .catch((error) => console.error("Error clearing cart:", error));
    }
  };

  const getTotalCartAmount = () => {
    return Object.keys(cartItems).reduce((total, productId) => {
      const product = allProducts.find((p) => p._id === productId);
      return product ? total + product.new_price * cartItems[productId] : total;
    }, 0);
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((total, count) => total + count, 0);
  };

  const getCartProducts = () => {
    return Object.keys(cartItems)
      .map((productId) => {
        const product = allProducts.find((p) => p._id === productId);
        return product ? { ...product, quantity: cartItems[productId] } : null;
      })
      .filter(Boolean);
  };

  return (
    <ShopContext.Provider
      value={{
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
      }}
    >
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
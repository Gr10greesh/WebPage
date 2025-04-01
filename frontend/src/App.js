import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShopCategory from "./Pages/ShopCategory";
import Product from "./Pages/Product";
import LoginSignup from "./Pages/LoginSignup";
import Cart from "./Components/Cart/Cart";
import Footer from "./Components/Footer/Footer";
import giftcard_banner from "./Components/Assets/banner_giftcard.png";
import mobilegames_banner from "./Components/Assets/banner_mobilegames.png";
import freefire_banner from "./Components/Assets/banner_freefire.png";
import ProductList from "./Pages/ProductList";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<ShopCategory category="all" />} />
          <Route path="/giftcard" element={<ShopCategory banner={giftcard_banner} category="giftcard" />} />
          <Route path="/mobilegames" element={<ShopCategory banner={mobilegames_banner} category="mobilegames" />} />
          <Route path="/freefire" element={<ShopCategory banner={freefire_banner} category="freefire" />} />
          {/* This route handles both formats for backward compatibility */}
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/products/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/products" element={<ProductList />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
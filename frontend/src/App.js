import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShopCategory from "./Pages/ShopCategory";
import Product from "./Pages/Product";
import LoginSignup from "./Pages/LoginSignup";
import Cart from "./Components/Cart/Cart";
import Footer from "./Components/Footer/Footer";
import ProductList from "./Pages/ProductList";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import DashboardHome from './Components/Dashboard/DashboardHome';
import OrderHistory from './Components/Dashboard/OrderHistory';
import Dashboard from './Components/Dashboard/Dashboard'
import Profile from './Components/Dashboard/Profile';
import Checkout from "./Components/Checkout/Checkout";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<ShopCategory category="all" />} />
          <Route path="/giftcard" element={<ShopCategory category="giftcard" />} />
          <Route path="/mobilegames" element={<ShopCategory category="mobilegames" />} />
          <Route path="/freefire" element={<ShopCategory category="freefire" />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/products/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<OrderHistory />} />
          </Route>
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
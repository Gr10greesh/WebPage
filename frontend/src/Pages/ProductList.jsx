import { useState, useEffect } from "react";
import axios from "axios";
import SearchFilters from "../Components/SearchFilter/SearchFilters";
import ProductCard from "../Components/ProductCard/ProductCard";
import "../Pages/CSS/ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:4000/allproducts");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = async (filters) => {
    try {
      const res = await axios.get("http://localhost:4000/api/products/search", { 
        params: filters 
      });
      setProducts(res.data);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  return (
    <div className="products-list-container">
      <SearchFilters onSearch={handleSearch} />
      <div className="products-grid">
        {products.map((products) => (
          <ProductCard key={products.id} products={products} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
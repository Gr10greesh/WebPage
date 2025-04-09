import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';


const Product = () => {
  const { productId } = useParams();
  const [products, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductById = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/products/${productId}`);

        // Mapping the API response to match the frontend structure and adding mock data
        const mappedProduct = {
          id: response.data.products.id,
          name: response.data.products.name,
          image: response.data.products.image,
          category: response.data.products.category,
          new_price: response.data.products.new_price,
          old_price: response.data.products.old_price,
          available: response.data.products.available,
        };

        setProduct(mappedProduct);
      } catch (error) {
        setError('Error fetching products');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductById();
  }, [productId]);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;
  if (!products) return <p>Product not found!</p>;

  const handleAddToCart = () => {
    // Logic to handle add to cart functionality
    console.log(`${products.name} added to cart!`);
  };

  return (
    <div className="products">
      <h1>{products.name}</h1>
      <img src={products.image} alt={products.name} />
      <p>Rs {products.new_price}</p>
      <p>{products.description}</p>
      
      {/* Right - Details */}
      <div className="productsdisplay-right">
        <h1>{products.name}</h1>


        <div className="productsdisplay-right-prices">
          <div className="productsdisplay-right-price-old">Rs {products.old_price}</div>
          <div className="productsdisplay-right-price-new">Rs {products.new_price}</div>
        </div>

        <div className="productsdisplay-right-description">{products.description}</div>

        <button onClick={handleAddToCart}>ADD TO CART</button>

        {/* Category */}
        <p className="productsdisplay-right-category">
          <span>Category :</span> {products.category}
        </p>
      </div>
    </div>
  );
};

export default Product;


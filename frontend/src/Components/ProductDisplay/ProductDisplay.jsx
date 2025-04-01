



import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import star_icon from '../Assets/star_icon.png';  // Ensure you have these images
import star_dull_icon from '../Assets/star_dull_icon.png';

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
          rating: 4, // Mock rating: 4 out of 5
          reviews: 128, // Mock reviews: 128 reviews
          sizes: ["Small", "Medium", "Large"], // Mock sizes
          tags: ["Gift Card", "Fortnite", "V-Bucks"], // Mock tags
          description: "This is a mock description for the products.", // Mock description
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

        {/* Rating Section */}
        <div className="productsdisplay-right-stars">
          {Array.from({ length: 5 }, (_, index) => (
            <img key={index} src={index < products.rating ? star_icon : star_dull_icon} alt="star" />
          ))}
          <p>({products.reviews} reviews)</p>
        </div>

        <div className="productsdisplay-right-prices">
          <div className="productsdisplay-right-price-old">Rs {products.old_price}</div>
          <div className="productsdisplay-right-price-new">Rs {products.new_price}</div>
        </div>

        <div className="productsdisplay-right-description">{products.description}</div>

        <div className="productsdisplay-right-size">
          <h1>Select Size</h1>
          {products.sizes && products.sizes.length > 0 ? (
            products.sizes.map((size, index) => (
              <div key={index}>{size}</div>
            ))
          ) : (
            <p>No sizes available</p>
          )}
        </div>

        <button onClick={handleAddToCart}>ADD TO CART</button>

        {/* Category and Tags */}
        <p className="productsdisplay-right-category">
          <span>Category :</span> {products.category}
        </p>
        <p className="productsdisplay-right-category">
          <span>Tags :</span> {products.tags ? products.tags.join(', ') : 'No tags available'}
        </p>
      </div>
    </div>
  );
};

export default Product;


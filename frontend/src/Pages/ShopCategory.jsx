import React, { useState, useEffect, useContext } from 'react';
import './CSS/ShopCategory.css';
import Item from '../Components/Item/Item';
import { ShopContext } from '../Context/ShopContext';

const ShopCategory = (props) => {
  const { searchResults } = useContext(ShopContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4000/allproducts');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const getDisplayedProducts = () => {
    // If on homepage and there are search results, use them
    if (props.category === 'all' && searchResults) {
      return searchResults;
    }
    return props.category === 'all' 
      ? products 
      : products.filter(item => item.category === props.category);
  };

  const displayedProducts = getDisplayedProducts();

  return (
    <div className="shop-category">
      {props.banner && (
        <img className="shopcategory-banner" src={props.banner} alt="Category Banner" />
      )}

      <div className="shopcategory-indexSort">
        <p>
          <span>Showing 1-{displayedProducts.length}</span> out of {displayedProducts.length} products
        </p>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="shopcategory-products">
          {displayedProducts.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))}
        </div>
      )}
      <div className="shopcategory-loadmore">Explore More</div>
    </div>
  );
};

export default ShopCategory;
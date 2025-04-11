import React, { useEffect, useState } from 'react';
import './ListProduct.css';
import cross_icon from '../../assets/cross_icon.png';

const ListProduct = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ show: false, productId: null });

  const fetchInfo = async () => {
    try {
      const res = await fetch('http://localhost:4000/allproducts');
      const data = await res.json();
      setAllProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  const handleRemove = async (id) => {
    try {
      await fetch('http://localhost:4000/removeproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      await fetchInfo();
    } catch (error) {
      console.error('Error removing product:', error);
    } finally {
      setConfirmModal({ show: false, productId: null });
    }
  };

  return (
    <div className="list-product">
      <h1>All Products List</h1>
      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>
      <div className="listproduct-allproducts">
        <hr />
        {allProducts.map((product) => (
          <div key={product.id}>
            <div className="listproduct-format">
              <img
                src={product.image}
                alt={product.name}
                className="listproduct-product-icon"
              />
              <p className="listproduct-title">{product.name}</p>
              <p className="listproduct-old-price">Rs {product.old_price}</p>
              <p className="listproduct-new-price">Rs {product.new_price}</p>
              <p className="listproduct-category">{product.category}</p>
              <img
                onClick={() => setConfirmModal({ show: true, productId: product.id })}
                className="listproduct-remove-icon"
                src={cross_icon}
                alt="Remove Product"
              />
            </div>
            <hr />
          </div>
        ))}
      </div>

      {confirmModal.show && (
        <div className="confirm-modal">
          <div className="confirm-modal-content">
            <p>Are you sure you want to remove this item?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn confirm-yes"
                onClick={() => handleRemove(confirmModal.productId)}
              >
                Yes
              </button>
              <button
                className="confirm-btn confirm-no"
                onClick={() => setConfirmModal({ show: false, productId: null })}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProduct;
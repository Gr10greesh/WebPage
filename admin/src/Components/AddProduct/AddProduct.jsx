import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';

const AddProduct = () => {
  const [image, setImage] = useState(null); // Initialize with null instead of false
  const [productDetails, setProductDetails] = useState({
    name: "",
    image: "",
    category: "giftcard",
    new_price: "",
    old_price: "",
  });

  // Handle image file selection
  const imageHandler = (e) => {
    setImage(e.target.files[0]); // Save the file object in state
  };

  // Handle product details changes
  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  // Add Product function to handle both image upload and product details save
  const Add_Product = async () => {
    let responseData;
    let product = productDetails;

    // Create form data to send the product data and the image
    let formData = new FormData();
    formData.append('file', image); // Ensure 'file' matches the backend key
    formData.append('name', product.name);
    formData.append('category', product.category);
    formData.append('old_price', product.old_price);
    formData.append('new_price', product.new_price);

    // Upload image to the server first
    await fetch('http://localhost:4000/upload', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: formData, // Send the form data with image and product details
    })
      .then((resp) => resp.json())
      .then((data) => {
        responseData = data;
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        alert("Image upload failed");
        return;
      });

    // If the image is uploaded successfully, proceed to add product
    if (responseData?.success) {
      // Assign the uploaded image URL to the product
      product.image = responseData.image_url;
      console.log(product);

      // Now send product details to add it to the database
      await fetch('http://localhost:4000/addproduct', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })
        .then((resp) => resp.json())
        .then((data) => {
          data.success ? alert("Product Added") : alert("Failed");
        })
        .catch((error) => {
          console.error("Error adding product:", error);
          alert("Failed to add product");
        });
    } else {
      alert("Image upload failed");
    }
  };

  return (
    <div className='add-product'>
      <div className="addproduct-itemfield">
        <p>Product title</p>
        <input
          value={productDetails.name}
          onChange={changeHandler}
          type="text"
          name='name'
          placeholder='Type here'
          required
        />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.old_price}
            onChange={changeHandler}
            type="text"
            name='old_price'
            placeholder='Type here'
            required
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={productDetails.new_price}
            onChange={changeHandler}
            type="text"
            name='new_price'
            placeholder='Type here'
            required
          />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={productDetails.category}
          onChange={changeHandler}
          name="category"
          className='add-product-selector'
        >
          <option value="giftcard">GiftCard</option>
          <option value="mobilegames">MobileGames</option>
          <option value="freefire">Freefire</option>
        </select>
      </div>
      <div className="addproduct-itemfield">
        <label htmlFor="file-input">
          <img
            src={image ? URL.createObjectURL(image) : upload_area}
            className='addproduct-thumnail-img'
            alt="Upload area"
          />
        </label>
        <input
          onChange={imageHandler}
          type="file"
          name='image'
          id='file-input'
          hidden
        />
      </div>
      <button onClick={Add_Product} className='addproduct-btn'>ADD</button>
    </div>
  );
};

export default AddProduct;

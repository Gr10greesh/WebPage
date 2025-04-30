import React, { useState } from 'react';
import './AddProduct.css';
import upload_area from '../../assets/upload_area.svg';
import { toast } from 'react-toastify';

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    image: "",
    category: "giftcard",
    new_price: "",
    old_price: "",
  });

  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  // Handle image file selection
  const imageHandler = (e) => {
    setImage(e.target.files[0]);
    setUploadedImageUrl(""); // reset uploaded preview when changing file
  };

  // Handle product detail changes
  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  // Add Product
  const Add_Product = async () => {
    let responseData;
    let product = productDetails;
  
    // Validate prices before uploading
    const oldPrice = Number(product.old_price);
    const newPrice = Number(product.new_price);
  
    if (isNaN(oldPrice) || isNaN(newPrice) || oldPrice <= 0 || newPrice <= 0) {
      toast.error("Prices must be positive numbers greater than 0!");
      return; // if invalid
    }
  
    // Prepare form data
    let formData = new FormData();
    formData.append('file', image);
    formData.append('name', product.name);
    formData.append('category', product.category);
    formData.append('old_price', product.old_price);
    formData.append('new_price', product.new_price);
  
    try {
      const uploadRes = await fetch('http://localhost:4000/upload', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
  
      responseData = await uploadRes.json();
  
      if (responseData?.success) {
        product.image = `http://localhost:4000${responseData.image_url}`;
        setUploadedImageUrl(product.image);
  
        const addProductRes = await fetch('http://localhost:4000/addproduct', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        });
  
        const addProductData = await addProductRes.json();
  
        if (addProductData.success) {
          toast.success("Product Added Successfully!");
        } else {
          toast.error("Failed to Add Product");
        }
      } else {
        toast.error("Image upload failed");
      }
    } catch (error) {
      console.error("Upload/Add Error:", error);
      toast.error("Something went wrong!");
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
            type="number"
            name='old_price'
            placeholder='Type here'
            min="1"
            required
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={productDetails.new_price}
            onChange={changeHandler}
            type="number"
            name='new_price'
            placeholder='Type here'
            min="1"
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

      {uploadedImageUrl && (
        <div className="addproduct-itemfield">
          <p> Uploaded Image Preview from Backend</p>
          <img
            src={uploadedImageUrl}
            alt="Uploaded Product"
            className='addproduct-thumnail-img'
            style={{ border: "2px solid green", marginTop: "10px" }}
          />
        </div>
      )}
    </div>
  );
};

export default AddProduct;

"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import { useShop } from "../Context/ShopContext"
import "./Product.css"

const Product = () => {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage] = useState(0)
  const { addToCart } = useShop()

  useEffect(() => {
    const fetchProductById = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/product/${productId}`)
        if (response.data.success) {
          setProduct(response.data.product)
        } else {
          setError("Product not found")
        }
      } catch (error) {
        setError("Error fetching product")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductById()
  }, [productId])

  const handleAddToCart = () => {
    if (product) {
      addToCart(product._id)
      alert(`${product.name} added to cart!`)
    }
  }

  const productImages = product?.images?.length > 0 ? product.images : [
    product?.image || "/placeholder.svg",
    "/placeholder2.svg",
    "/placeholder3.svg",
    "/placeholder4.svg"
  ]

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Loading product details...</p>
    </div>
  )

  if (error) return <p className="error">{error}</p>
  if (!product) return <p className="not-found">Product not found!</p>

  return (
    <div className="product-display">
<div className="product-display-left">
  <div className="image-container">
    <span className="tag-label">Hot Deal</span>
    <img 
      src={productImages[selectedImage]} 
      alt={product.name} 
      className="main-product-image" 
    />
  </div>
</div>




      <div className="product-display-right">
        <h1>{product.name}</h1>
        <div className="product-display-right-prices">
          <div className="product-display-right-price-old">Rs {product.old_price}</div>
          <div className="product-display-right-price-new">Rs {product.new_price}</div>
          {product.old_price > product.new_price && (
            <div className="price-save">
              Save Rs {product.old_price - product.new_price}
            </div>
          )}
        </div>

        <div className="product-display-right-description">
          {product.description}
        </div>

        <div className="product-details-extra">
          <p><strong>Region:</strong> Nepal</p>
          <p><strong>Delivery Time:</strong> 12–24 hours</p>
        </div>
        
        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
        >
          ADD TO CART
        </button>

        <div className="product-display-right-category">
          <span>Category:</span> {product.category}
        </div>
      </div>
    </div>
  )
}

export default Product

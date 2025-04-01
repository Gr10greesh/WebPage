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
  const [selectedSize, setSelectedSize] = useState(null)
  const { addToCart } = useShop()

  useEffect(() => {
    const fetchProductById = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/product/${productId}`)
        if (response.data.success) {
          setProduct(response.data.product)
          if (response.data.product.sizes && response.data.product.sizes.length > 0) {
            setSelectedSize(response.data.product.sizes[0])
          }
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

  const handleSizeSelect = (size) => {
    setSelectedSize(size)
  }

  if (loading) return <p className="loading">Loading product...</p>
  if (error) return <p className="error">{error}</p>
  if (!product) return <p className="not-found">Product not found!</p>

  return (
    <div className="product-display">
      <div className="product-display-left">
        <img src={product.image || "/placeholder.svg"} alt={product.name} className="product-image" />
      </div>

      <div className="product-display-right">
        <h1>{product.name}</h1>

        {/* Rating Section */}
        <div className="product-display-right-stars">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={`star-icon ${index < product.rating ? "star-filled" : "star-empty"}`}>
              {index < product.rating ? "★" : "☆"}
            </span>
          ))}
          <p>({product.reviews} reviews)</p>
        </div>

        <div className="product-display-right-prices">
          <div className="product-display-right-price-old">Rs {product.old_price}</div>
          <div className="product-display-right-price-new">Rs {product.new_price}</div>
        </div>

        <div className="product-display-right-description">{product.description}</div>

        {/* Size Selection */}
        <div className="product-display-right-size">
          <h3>Select Size</h3>
          <div className="size-options">
            {product.sizes && product.sizes.length > 0 ? (
              product.sizes.map((size, index) => (
                <div
                  key={index}
                  className={`size-option ${selectedSize === size ? "selected" : ""}`}
                  onClick={() => handleSizeSelect(size)}
                >
                  {size}
                </div>
              ))
            ) : (
              <p>No sizes available</p>
            )}
          </div>
        </div>

        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
        >
          ADD TO CART
        </button>

        {/* Category and Tags */}
        <p className="product-display-right-category">
          <span>Category:</span> {product.category}
        </p>
        <p className="product-display-right-category">
          <span>Tags:</span> {product.tags ? product.tags.join(", ") : "No tags available"}
        </p>
      </div>
    </div>
  )
}

export default Product
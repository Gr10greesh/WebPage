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
  const { addToCart, userProfile } = useShop()
  
  // Review state
  const [reviewError, setReviewError] = useState(null)
  const [newReview, setNewReview] = useState({
    name: userProfile?.email || '', // Pre-fill with user's email if available
    comment: '',
    rating: 5
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productResponse = await axios.get(`http://localhost:4000/product/${productId}`)
        if (productResponse.data.success) {
          setProduct(productResponse.data.product)
        } else {
          setError("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        setError("Error loading product details")
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchData()
    } else {
      setError("Product ID is missing")
      setLoading(false)
    }
  }, [productId])

  // Update newReview.name when userProfile changes
  useEffect(() => {
    if (userProfile?.email) {
      setNewReview(prev => ({
        ...prev,
        name: userProfile.email
      }));
    }
  }, [userProfile])

  const handleAddToCart = () => {
    if (!userProfile) {
      alert("Please log in to add items to your cart!");
      return;
    }
    if (product) {
      addToCart(product._id)
      alert(`${product.name} added to cart!`)
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    setReviewError(null)
    
    // Validate rating
    if (newReview.rating < 1 || newReview.rating > 5) {
      setReviewError("Rating must be between 1-5 stars")
      setReviewSubmitting(false)
      return
    }
    
    try {
      const response = await axios.post(`http://localhost:4000/product/${productId}/review`, {
        name: newReview.name.trim(),
        comment: newReview.comment.trim(),
        rating: Number(newReview.rating)
      })
      
      if (response.data.success) {
        // Update the product state with the new review
        setProduct(prev => ({
          ...prev,
          reviews: [response.data.review, ...(prev.reviews || [])]
        }))
        setNewReview({
          name: userProfile?.email || '',
          comment: '',
          rating: 5
        })
      } else {
        setReviewError(response.data.message || "Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      setReviewError(error.response?.data?.message || "Failed to submit review")
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setNewReview(prev => ({
      ...prev,
      [name]: name === 'rating' ? Math.min(5, Math.max(1, Number(value))) : value
    }))
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
    <div className="product-page">
      {/* Product Details Section */}
      <div className="product-display">
        {/* Left Column - Product Image */}
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

        {/* Right Column - Product Details */}
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

      {/* Reviews Section */}
      <div className="reviews-container">
        <h2>Customer Reviews</h2>
        
        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="review-form">
          <h3>Write a Review</h3>
          {!userProfile && <p className="error-message">Please log in to submit a review.</p>}
          {reviewError && <div className="error-message">{reviewError}</div>}
          
          <div className="form-group">
            <label>Your Email</label>
            <input
              type="text"
              name="name"
              value={newReview.name}
              onChange={handleReviewChange}
              required
              minLength={2}
              maxLength={50}
              disabled={!userProfile} // Disable if not logged in
              readOnly={!!userProfile} // Make read-only if logged in
            />
          </div>
          
          <div className="form-group">
            <label>Rating</label>
            <select
              name="rating"
              value={newReview.rating}
              onChange={handleReviewChange}
              required
              disabled={!userProfile}
            >
              {[5, 4, 3, 2, 1].map(num => (
                <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Your Review</label>
            <textarea
              name="comment"
              value={newReview.comment}
              onChange={handleReviewChange}
              required
              rows="4"
              minLength={10}
              maxLength={500}
              disabled={!userProfile}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={reviewSubmitting || !userProfile}
            className={`submit-review-btn ${reviewSubmitting ? 'submitting' : ''}`}
          >
            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
        
        {/* Reviews List */}
        <div className="reviews-list">
          {product.reviews && product.reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          ) : (
            product.reviews && product.reviews.map(review => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <h4>{review.name}</h4>
                  <div className="review-rating">
                    {'★'.repeat(review.rating).padEnd(5, '☆')}
                    <span className="rating-text">{review.rating}/5</span>
                  </div>
                  <small>{new Date(review.createdAt).toLocaleDateString()}</small>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Product
"use client"

import { useState, useEffect, useContext, useMemo } from "react"
import "./CSS/ShopCategory.css"
import Item from "../Components/Item/Item"
import { ShopContext } from "../Context/ShopContext"

const ShopCategory = (props) => {
  const { searchResults} = useContext(ShopContext)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleProducts, setVisibleProducts] = useState(16);

  // Filter states
  const [sortOption, setSortOption] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:4000/allproducts")
        const data = await response.json()
        setProducts(data)

        // Initialize categories from all products
        const uniqueCategories = [...new Set(data.map((item) => item.category))]
        setSelectedCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const sortProducts = (products) => {
    switch(sortOption) {
      case 'price-low':
        return [...products].sort((a, b) => a.new_price - b.new_price);
      case 'price-high':
        return [...products].sort((a, b) => b.new_price - a.new_price);
      case 'newest':
        return [...products].sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'featured':
      default:
        return products;
    }
  };

  // Get all unique categories for filter options
  const allCategories = useMemo(() => {
    return [...new Set(products.map((item) => item.category))]
  }, [products])

  // Get all unique platforms for filter options
  const allPlatforms = useMemo(() => {
    return [...new Set(products.flatMap((item) => item.platforms || ["All"]))]
  }, [products])

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handlePlatformChange = (platform) => {
    setSelectedPlatforms((prev) => (prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]))
  }

  const getDisplayedProducts = () => {
    let filteredProducts = products

    // Apply search results if available
    if (props.category === "all" && searchResults) {
      filteredProducts = searchResults
    }
    // Apply category filter if not on 'all' page
    else if (props.category !== "all") {
      filteredProducts = filteredProducts.filter((item) => item.category === props.category)
    }

    // Apply additional filters
    filteredProducts = filteredProducts.filter((item) => {
      const matchesCategory = selectedCategories.includes(item.category)
      const matchesPrice = item.new_price >= priceRange[0] && item.new_price <= priceRange[1]
      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        (item.platforms && item.platforms.some((platform) => selectedPlatforms.includes(platform)))

      return matchesCategory && matchesPrice && matchesPlatform
    })

    // Apply sorting before returning
    const sortedProducts = sortProducts(filteredProducts);
    return sortedProducts.slice(0,visibleProducts);
  };

  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 16);
  };

  useEffect(() => {
    setVisibleProducts(16);
  }, [priceRange, selectedCategories, selectedPlatforms, sortOption, props.category]);


  const displayedProducts = getDisplayedProducts()

  const toggleFilters = () => {
    setIsFilterVisible(!isFilterVisible)
  }

  return (
    <div className="shop-category">
      {props.banner && (
        <div className="banner-container">
          <img className="shopcategory-banner" src={props.banner || "/placeholder.svg"} alt="Category Banner" />
        </div>
      )}

      <div className="shopcategory-container">
        {/* Mobile Filter Toggle Button */}
        <button className="filter-toggle-btn" onClick={toggleFilters}>
          {isFilterVisible ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filter Sidebar */}
        <aside className={`shopcategory-sidebar ${isFilterVisible ? "visible" : ""}`}>
          <h3>Filters</h3>

          {/* Category Filter */}
          <div className="filter-section">
            <h4>Categories</h4>
            <div className="filter-options-container">
              {allCategories.map((category) => (
                <div key={category} className="filter-option">
                  <input
                    type="checkbox"
                    id={`cat-${category}`}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                  />
                  <label htmlFor={`cat-${category}`}>{category}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="price-slider">
              <input
                type="range"
                min="0"
                max="20000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                className="range-slider"
              />
              <div className="price-display">
                <p>
                  Max Price: <span>Rs {priceRange[1].toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="filter-section">
            <h4>Platform</h4>
            <div className="filter-options-container">
              {allPlatforms.map((platform) => (
                <div key={platform} className="filter-option">
                  <input
                    type="checkbox"
                    id={`platform-${platform}`}
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => handlePlatformChange(platform)}
                  />
                  <label htmlFor={`platform-${platform}`}>{platform}</label>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="shopcategory-main">
          <div className="shopcategory-indexSort">
            <p>
              <span>
                Showing {displayedProducts.length > 0 ? "1" : "0"}-{displayedProducts.length}
              </span>{" "}
              out of {displayedProducts.length} products
            </p>
            <div className="sort-container">
              <select 
                className="shopcategory-sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="no-products">
              <p>No products match your current filters. Try adjusting your selection.</p>
            </div>
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

          {displayedProducts.length > 0 && props.category === "all" && (
                  <button 
                    className="shopcategory-loadmore"
                    onClick={loadMoreProducts}
                    disabled={visibleProducts >= products.length}
                  >
                    Explore More
                  </button>
                )}
        </main>
      </div>
    </div>
  )
}

export default ShopCategory
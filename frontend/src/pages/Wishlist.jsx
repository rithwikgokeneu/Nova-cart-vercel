import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { getImageUrl } from '../utils/imageUrl'
import Loader from '../components/Loader'
import { toast } from 'react-toastify'

export default function Wishlist() {
  const { wishlistIds, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = () => {
    setLoading(true)
    API.get('/api/wishlist')
      .then(r => setProducts(r.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchWishlist() }, [])

  const handleRemove = async (productId) => {
    await toggleWishlist(productId)
    setProducts(prev => prev.filter(p => p._id !== productId))
    toast.success('Removed from wishlist')
  }

  const handleAddToCart = (productId) => {
    addToCart(productId)
    toast.success('Added to cart')
  }

  if (loading) return <Loader />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-2 text-gray-400">
        <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>Wishlist</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--heading-color)' }}>My Wishlist</h1>
          {products.length > 0 && <p className="text-gray-500 text-sm mt-1">{products.length} saved item{products.length !== 1 ? 's' : ''}</p>}
        </div>
        {products.length > 0 && (
          <Link to="/products" className="text-sm font-semibold" style={{ color: 'var(--primary-color)' }}>
            Continue Shopping →
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--white-smoke)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--heading-color)' }}>Your wishlist is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Save items you love by clicking the heart icon on any product.</p>
          <Link to="/products" className="btn-primary py-3 px-8">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null
            const price = product.discountPrice > 0 ? product.discountPrice : product.price
            const hasDiscount = product.discountPrice > 0
            const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(35,31,30,0.06)' }}
              >
                {/* Image */}
                <Link to={`/products/${product._id}`} className="block relative overflow-hidden bg-gray-50" style={{ height: '200px' }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200" style={{ backgroundColor: 'var(--white-smoke)' }}>
                      🛍️
                    </div>
                  )}
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#e5484d' }}>
                      -{discountPct}%
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute top-3 left-3 bg-gray-800/80 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                      Sold Out
                    </span>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={e => { e.preventDefault(); handleRemove(product._id) }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
                    title="Remove from wishlist"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#e5484d" stroke="#e5484d" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </Link>

                {/* Content */}
                <div className="p-4">
                  <Link to={`/products/${product._id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:underline mb-2" style={{ fontSize: '14px', color: 'var(--heading-color)', lineHeight: '1.4' }}>
                      {product.title}
                    </h3>
                  </Link>

                  {product.category?.name && (
                    <p className="text-xs text-gray-400 mb-2">{product.category.name}</p>
                  )}

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold" style={{ fontSize: '17px', color: 'var(--heading-color)' }}>
                      <span style={{ fontSize: '12px' }}>$</span>{price?.toFixed(2).split('.')[0]}
                      <span style={{ fontSize: '12px' }}>.{price?.toFixed(2).split('.')[1]}</span>
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">${product.price?.toFixed(2)}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product._id)}
                    disabled={product.stock === 0}
                    className="w-full text-xs py-2.5 font-semibold rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={
                      product.stock === 0
                        ? { backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1.5px solid #e5e7eb' }
                        : { backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none' }
                    }
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

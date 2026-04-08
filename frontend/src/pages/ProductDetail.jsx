import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'
import Breadcrumb from '../components/Breadcrumb'
import ProductCard from '../components/ProductCard'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { wishlistIds, toggleWishlist } = useWishlist()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [review, setReview] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [related, setRelated] = useState([])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/api/products/${id}`)
        setProduct(data.product)
        setReviews(data.reviews || [])
        // Record recently viewed
        if (user) API.post(`/api/recently-viewed/${id}`).catch(() => {})
        // Fetch related products
        const rel = await API.get(`/api/products/${id}/related`)
        setRelated(rel.data.products || [])
      } catch {
        toast.error('Product not found')
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return }
    addToCart(product._id, qty)
  }

  const handleReviewSubmit = async e => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setSubmitting(true)
    try {
      await API.post(`/api/products/${id}/reviews`, review)
      toast.success('Review submitted!')
      const { data } = await API.get(`/api/products/${id}`)
      setProduct(data.product)
      setReviews(data.reviews || [])
      setReview({ rating: 5, comment: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />
  if (!product) return null

  const price = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDiscount = product.discountPrice > 0
  const images = product.images?.length > 0 ? product.images : []
  const getImageUrl = img => img ? (img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${img}`) : ''
  const stars = Math.round(product.ratings || 0)

  return (
    <div style={{ backgroundColor: '#fff' }}>
      <div className="container py-10">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          ...(product.category ? [{ label: product.category.name, href: `/category/${product.category._id}` }] : []),
          { label: product.title }
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-14">
          {/* Images */}
          <div>
            <div
              className="rounded-2xl overflow-hidden mb-4 flex items-center justify-center"
              style={{ height: '420px', backgroundColor: 'var(--white-smoke)' }}
            >
              {images.length > 0 && getImageUrl(images[activeImg]) ? (
                <img src={getImageUrl(images[activeImg])} alt={product.title} className="w-full h-full object-contain p-6" onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <span className="text-8xl text-gray-200">🛍️</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all"
                    style={{
                      border: activeImg === i ? '2px solid var(--primary-color)' : '2px solid #e5e7eb',
                      backgroundColor: 'var(--white-smoke)',
                    }}
                  >
                    {getImageUrl(img) ? (
                      <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">🛍️</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--primary-color)' }}>{product.category?.name}</p>
            <h1 style={{ fontSize: '32px', fontWeight: 700, lineHeight: '120%', color: 'var(--heading-color)' }} className="mb-4">{product.title}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 20 20" fill={s <= stars ? '#F59E0B' : '#E5E7EB'}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-400">({product.numReviews} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span style={{ fontSize: '36px', fontWeight: 700, color: 'var(--heading-color)' }}>
                <span style={{ fontSize: '20px' }}>$</span>{price?.toFixed(2).split('.')[0]}
                <span style={{ fontSize: '20px' }}>.{price?.toFixed(2).split('.')[1]}</span>
              </span>
              {hasDiscount && <span className="text-lg text-gray-300 line-through">${product.price?.toFixed(2)}</span>}
              {hasDiscount && (
                <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#e5484d' }}>SALE</span>
              )}
            </div>

            <p className="text-gray-500 mb-6 leading-relaxed text-sm">{product.description}</p>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="px-4 py-2 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: product.stock > 0 ? '#dcfce7' : '#fef2f2',
                  color: product.stock > 0 ? '#16a34a' : '#dc2626',
                }}
              >
                {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
              </div>
            </div>

            {/* Vendor */}
            <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--white-smoke)' }}>
              <span className="text-gray-400 text-sm">Sold by</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--heading-color)' }}>{product.vendor?.name}</span>
            </div>

            {/* Qty + Add to Cart */}
            {user?.role !== 'vendor' && user?.role !== 'admin' && (
              <div>
                {user ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center rounded-full overflow-hidden border border-gray-200">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-5 py-3 text-gray-500 hover:bg-gray-50 font-bold text-lg transition-colors">−</button>
                      <span className="px-4 font-semibold" style={{ color: 'var(--heading-color)' }}>{qty}</span>
                      <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-5 py-3 text-gray-500 hover:bg-gray-50 font-bold text-lg transition-colors">+</button>
                    </div>
                    <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-primary flex-1 py-3.5 disabled:opacity-40">
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => toggleWishlist(product._id)}
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0"
                      style={{ borderColor: wishlistIds.has(product._id) ? '#e5484d' : '#e5e7eb', backgroundColor: wishlistIds.has(product._id) ? '#fff0f0' : '#fff' }}
                      title={wishlistIds.has(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistIds.has(product._id) ? '#e5484d' : 'none'} stroke={wishlistIds.has(product._id) ? '#e5484d' : '#6b7280'} strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/login')}
                      className="btn-primary w-full py-3.5 text-base"
                    >
                      Login to Buy
                    </button>
                    <p className="text-xs text-center text-gray-400">
                      Don't have an account?{' '}
                      <a href="/register" className="font-semibold" style={{ color: 'var(--primary-color)' }}>Sign up free</a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10" style={{ borderTop: '1px solid rgba(35,31,30,0.08)', paddingTop: '40px' }}>
          <div>
            <h3 className="font-bold mb-6" style={{ fontSize: '22px', color: 'var(--heading-color)' }}>Customer Reviews</h3>
            {reviews.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--white-smoke)' }}>
                <p className="text-4xl mb-3">💬</p>
                <p className="text-gray-400 text-sm">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: 'var(--primary-color)' }}>
                        {r.customer?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--heading-color)' }}>{r.customer?.name}</p>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <svg key={s} width="12" height="12" viewBox="0 0 20 20" fill={s <= r.rating ? '#F59E0B' : '#E5E7EB'}>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user && user.role === 'customer' && (
            <div>
              <h3 className="font-bold mb-6" style={{ fontSize: '22px', color: 'var(--heading-color)' }}>Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Your Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReview(r => ({ ...r, rating: s }))}>
                        <svg width="28" height="28" viewBox="0 0 20 20" fill={s <= review.rating ? '#F59E0B' : '#E5E7EB'} className="hover:scale-125 transition-transform">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Comment</label>
                  <textarea value={review.comment} onChange={e => setReview(r => ({ ...r, comment: e.target.value }))} rows={4} className="input-field" placeholder="Share your experience..." required />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--heading-color)' }}>You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

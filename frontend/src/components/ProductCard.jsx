import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { getImageUrl } from '../utils/imageUrl'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { wishlistIds, toggleWishlist } = useWishlist()
  const navigate = useNavigate()
  const inWishlist = wishlistIds.has(product._id)

  const price = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDiscount = product.discountPrice > 0
  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0
  const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null

  const stars = Math.round(product.ratings || 0)

  const handleCartAction = () => {
    if (!user) { navigate('/login'); return }
    addToCart(product._id)
  }

  return (
    <div
      className="bg-white rounded-xl overflow-hidden group transition-all duration-300 flex flex-col"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(35,31,30,0.06)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.11)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Image */}
      <Link to={`/products/${product._id}`} className="block relative overflow-hidden bg-gray-50 flex-shrink-0" style={{ height: '220px' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className="w-full h-full items-center justify-center text-6xl text-gray-200 absolute inset-0"
          style={{ display: imageUrl ? 'none' : 'flex', backgroundColor: 'var(--white-smoke)' }}>
          🛍️
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#e5484d' }}>
              -{discountPct}%
            </span>
          )}
          {product.stock === 0 && (
            <span className="bg-gray-800/80 text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              Sold Out
            </span>
          )}
        </div>

        {/* Category chip */}
        {product.category?.name && (
          <span className="absolute bottom-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.92)', color: 'var(--primary-color)' }}>
            {product.category.name}
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={e => { e.preventDefault(); user ? toggleWishlist(product._id) : navigate('/login') }}
          className={`absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm transition-opacity ${inWishlist ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={inWishlist ? '#e5484d' : 'none'} stroke={inWishlist ? '#e5484d' : '#231f1e'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="12" height="12" viewBox="0 0 20 20" fill={s <= stars ? '#F59E0B' : '#E5E7EB'}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[11px] text-gray-400">({product.numReviews || 0})</span>
        </div>

        <Link to={`/products/${product._id}`} className="flex-1">
          <h3
            className="font-semibold line-clamp-2 hover:underline mb-3"
            style={{ fontSize: '14px', color: 'var(--heading-color)', lineHeight: '1.4' }}
          >
            {product.title}
          </h3>
        </Link>

        {/* Price row */}
        <div className="flex items-baseline gap-2 mb-3 mt-auto">
          <span className="font-bold" style={{ fontSize: '17px', color: 'var(--heading-color)' }}>
            <span style={{ fontSize: '12px' }}>$</span>{price?.toFixed(2).split('.')[0]}
            <span style={{ fontSize: '12px' }}>.{price?.toFixed(2).split('.')[1]}</span>
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">${product.price?.toFixed(2)}</span>
          )}
        </div>

        {/* CTA button */}
        {user?.role === 'vendor' || user?.role === 'admin' ? null : (
          <button
            onClick={handleCartAction}
            disabled={product.stock === 0}
            className="w-full text-xs py-2.5 font-semibold rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              product.stock === 0
                ? { backgroundColor: '#f3f4f6', color: '#9ca3af', border: '1.5px solid #e5e7eb' }
                : user
                  ? { backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none' }
                  : { backgroundColor: 'transparent', color: 'var(--heading-color)', border: '1.5px solid var(--heading-color)' }
            }
          >
            {product.stock === 0 ? 'Out of Stock' : user ? 'Add to Cart' : 'Login to Buy'}
          </button>
        )}
      </div>
    </div>
  )
}

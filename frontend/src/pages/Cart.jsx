import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import Loader from '../components/Loader'

export default function Cart() {
  const { cart, cartLoading, cartTotal, updateCartItem, removeFromCart } = useCart()
  const navigate = useNavigate()

  if (cartLoading) return <Loader />

  const items = cart?.items || []

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="btn-primary py-3 px-8">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Shopping Cart ({items.length})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map(item => {
            const product = item.product
            if (!product) return null
            const price = product.discountPrice > 0 ? product.discountPrice : product.price
            const _base = import.meta.env.VITE_API_URL || 'http://localhost:5001'
            const imageUrl = product.images?.[0]
              ? (product.images[0].startsWith('http') ? product.images[0] : `${_base}${product.images[0]}`)
              : 'https://placehold.co/80x80?text=N/A'

            return (
              <div key={product._id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  onError={e => { e.target.src = 'https://placehold.co/80x80?text=N/A' }}
                />
                <div className="flex-1 min-w-0 w-full">
                  <Link to={`/products/${product._id}`} className="font-semibold text-gray-800 hover:text-primary-600 line-clamp-2 text-sm sm:text-base">{product.title}</Link>
                  <p className="font-bold mt-1 text-sm sm:text-base" style={{ color: 'var(--primary-color)' }}>${price?.toFixed(2)}</p>

                  {/* Controls row — full width on mobile */}
                  <div className="flex items-center justify-between mt-3 sm:mt-0 sm:hidden">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateCartItem(product._id, item.quantity - 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100 text-base">−</button>
                      <span className="px-3 py-2 font-medium text-sm">{item.quantity}</span>
                      <button onClick={() => updateCartItem(product._id, item.quantity + 1)} disabled={item.quantity >= product.stock} className="px-3 py-2 text-gray-600 hover:bg-gray-100 text-base disabled:opacity-50">+</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-gray-900 text-sm">${(price * item.quantity)?.toFixed(2)}</p>
                      <button onClick={() => removeFromCart(product._id)} className="text-red-400 hover:text-red-600 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Desktop controls */}
                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg flex-shrink-0">
                  <button onClick={() => updateCartItem(product._id, item.quantity - 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100">−</button>
                  <span className="px-3 py-1 font-medium text-sm">{item.quantity}</span>
                  <button onClick={() => updateCartItem(product._id, item.quantity + 1)} disabled={item.quantity >= product.stock} className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50">+</button>
                </div>
                <p className="hidden sm:block font-bold text-gray-900 w-20 text-right flex-shrink-0">${(price * item.quantity)?.toFixed(2)}</p>
                <button onClick={() => removeFromCart(product._id)} className="hidden sm:block text-red-400 hover:text-red-600 p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="card h-fit lg:sticky lg:top-24">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Order Summary</h3>
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
              <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm sm:text-base">
              <span>Shipping</span>
              <span className="text-green-600">{cartTotal >= 50 ? 'Free' : '$5.99'}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-base sm:text-lg text-gray-900">
              <span>Total</span>
              <span>${(cartTotal + (cartTotal >= 50 ? 0 : 5.99)).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3 text-sm sm:text-base">
            Proceed to Checkout
          </button>
          <Link to="/products" className="block text-center mt-4 text-sm font-medium hover:underline" style={{ color: 'var(--primary-color)' }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

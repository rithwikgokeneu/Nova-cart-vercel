import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import { toast } from 'react-toastify'

export default function Checkout() {
  const { cart, cartTotal } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || '',
    country: user?.address?.country || ''
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [availablePoints, setAvailablePoints] = useState(0)
  const [giftPointsApplied, setGiftPointsApplied] = useState(0)

  useEffect(() => {
    API.get('/api/auth/me').then(r => setAvailablePoints(r.data.user?.giftPoints ?? 0)).catch(() => {})
  }, [])

  const shipping = cartTotal >= 50 ? 0 : 5.99
  const subtotalAfterCoupon = cartTotal + shipping - discountAmount
  const total = Math.max(0, subtotalAfterCoupon - giftPointsApplied)
  const items = cart?.items || []

  const handleAddressNext = e => {
    e.preventDefault()
    const required = ['street', 'city', 'state', 'zipCode', 'country']
    for (const field of required) {
      if (!address[field]) { toast.error(`Please fill in ${field}`); return }
    }
    setStep(2)
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const { data } = await API.post('/api/coupons/validate', {
        code: couponInput.trim().toUpperCase(),
        cartTotal,
      })
      setCouponCode(data.code)
      setDiscountAmount(data.discountAmount)
      toast.success(`Coupon applied! You save $${data.discountAmount.toFixed(2)}`)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code')
      setCouponCode('')
      setDiscountAmount(0)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode('')
    setCouponInput('')
    setDiscountAmount(0)
    setCouponError('')
  }

  const handleStripeRedirect = async () => {
    setLoading(true)
    try {
      localStorage.setItem('pendingShippingAddress', JSON.stringify(address))
      localStorage.setItem('pendingOrderNotes', notes)
      localStorage.setItem('pendingCouponCode', couponCode)
      localStorage.setItem('pendingDiscountAmount', discountAmount.toString())
      localStorage.setItem('pendingGiftPointsUsed', giftPointsApplied.toString())

      const cartItems = items.map(item => ({
        title: item.product?.title,
        price: item.product?.price,
        discountPrice: item.product?.discountPrice,
        quantity: item.quantity,
      }))

      const { data } = await API.post('/api/payment/create-checkout-session', {
        items: cartItems,
        shipping,
        discountAmount,
      })
      window.location.href = data.url
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout')
      setLoading(false)
    }
  }

  if (items.length === 0) { navigate('/cart'); return null }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-6 sm:mb-8">
        {[['1', 'Shipping'], ['2', 'Payment']].map(([n, label], i) => (
          <div key={n} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 ${parseInt(n) <= step ? 'text-white' : 'bg-gray-200 text-gray-500'}`}
              style={parseInt(n) <= step ? { backgroundColor: 'var(--primary-color)' } : {}}>
              {n}
            </div>
            <span className={`ml-1.5 text-xs sm:text-sm font-medium hidden xs:block ${parseInt(n) <= step ? 'text-primary-600' : 'text-gray-400'}`}
              style={parseInt(n) <= step ? { color: 'var(--primary-color)' } : {}}>
              {label}
            </span>
            {i < 1 && <div className={`mx-2 sm:mx-4 h-px w-8 sm:w-12 flex-shrink-0 ${parseInt(n) < step ? 'bg-primary-600' : 'bg-gray-200'}`}
              style={parseInt(n) < step ? { backgroundColor: 'var(--primary-color)' } : {}} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <form onSubmit={handleAddressNext} className="card space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipping Address</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="input-field" placeholder="123 Main St" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input value={address.zipCode} onChange={e => setAddress({ ...address, zipCode: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input-field" placeholder="Any special delivery instructions..." />
              </div>
              <button type="submit" className="btn-primary w-full py-3">Continue to Payment →</button>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card space-y-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Review & Pay</h2>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--light-cyan)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--primary-color)' }}>Secure Checkout via Stripe</p>
                <p className="text-xs mt-1 text-gray-600">You'll be redirected to Stripe to complete your payment securely.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">Shipping to:</h3>
                <p className="text-gray-600 text-sm">{address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Items:</h3>
                <div className="space-y-2">
                  {items.map(item => {
                    const p = item.product
                    const price = p?.discountPrice > 0 ? p.discountPrice : p?.price
                    return (
                      <div key={p?._id} className="flex justify-between text-sm text-gray-600">
                        <span className="flex-1 mr-2 line-clamp-1">{p?.title} ×{item.quantity}</span>
                        <span className="flex-shrink-0">${(price * item.quantity).toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button onClick={handleStripeRedirect} disabled={loading} className="btn-primary flex-1 py-3">
                  {loading ? 'Redirecting...' : 'Pay with Stripe →'}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Order summary sidebar */}
        <div className="card h-fit lg:sticky lg:top-24">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4">
            {items.map(item => {
              const p = item.product
              const price = p?.discountPrice > 0 ? p.discountPrice : p?.price
              return (
                <div key={p?._id} className="flex justify-between text-xs sm:text-sm text-gray-600">
                  <span className="line-clamp-1 flex-1 mr-2">{p?.title} ×{item.quantity}</span>
                  <span className="flex-shrink-0">${(price * item.quantity).toFixed(2)}</span>
                </div>
              )
            })}
          </div>
          {/* Coupon */}
          <div className="border-t pt-3 mb-3">
            {couponCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-green-700">{couponCode} applied</p>
                  <p className="text-xs text-green-600">-${discountAmount.toFixed(2)} off</p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Coupon code"
                    className="input-field flex-1 text-sm py-2"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-500">{couponError}</p>}
              </div>
            )}
          </div>
          {/* Gift Points */}
          {availablePoints > 0 && (
            <div className="border-t pt-3 mb-3">
              {giftPointsApplied > 0 ? (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-purple-700">🎁 {giftPointsApplied} gift points applied</p>
                    <p className="text-xs text-purple-600">-${giftPointsApplied.toFixed(2)} off</p>
                  </div>
                  <button onClick={() => setGiftPointsApplied(0)} className="text-xs text-red-400 hover:text-red-600 font-medium">Remove</button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-purple-700">🎁 {availablePoints} gift points available</p>
                    <p className="text-xs text-purple-600">Worth ${availablePoints.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => setGiftPointsApplied(Math.min(availablePoints, subtotalAfterCoupon))}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors"
                    style={{ backgroundColor: '#7c3aed' }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span className="text-green-600">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600"><span>Coupon ({couponCode})</span><span>-${discountAmount.toFixed(2)}</span></div>
            )}
            {giftPointsApplied > 0 && (
              <div className="flex justify-between text-sm text-purple-600"><span>Gift Points</span><span>-${giftPointsApplied.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

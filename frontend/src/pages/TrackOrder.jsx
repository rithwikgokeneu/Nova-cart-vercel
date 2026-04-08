import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

const STATUS_CONFIG = {
  pending:    { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1e40af', label: 'Processing' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
}

function OrderProgress({ status }) {
  if (status === 'cancelled') return (
    <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#fee2e2' }}>
      <svg width="16" height="16" fill="none" stroke="#991b1b" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span className="text-sm font-semibold" style={{ color: '#991b1b' }}>This order was cancelled</span>
    </div>
  )
  const currentStep = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 mt-4">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentStep
        const isLast = i === STATUS_STEPS.length - 1
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  backgroundColor: done ? 'var(--primary-color)' : '#e5e7eb',
                  color: done ? '#fff' : '#9ca3af',
                }}
              >
                {done ? (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span
                className="text-[11px] mt-1.5 capitalize text-center leading-tight font-medium"
                style={{ color: done ? 'var(--primary-color)' : '#9ca3af' }}
              >
                {step}
              </span>
            </div>
            {!isLast && (
              <div
                className="flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all"
                style={{ backgroundColor: i < currentStep ? 'var(--primary-color)' : '#e5e7eb' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async e => {
    e.preventDefault()
    if (!orderId.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)
    try {
      const { data } = await API.get(`/api/orders/track/${orderId.trim()}`)
      setOrder(data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check the Order ID.')
    } finally {
      setLoading(false)
    }
  }

  const cfg = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.pending) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-2 text-gray-400">
        <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>Track Order</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--heading-color)' }}>Track Your Order</h1>
      <p className="text-gray-500 text-sm mb-6">Enter your Order ID to see the current status.</p>

      {/* Search form */}
      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <input
          value={orderId}
          onChange={e => { setOrderId(e.target.value); setError('') }}
          placeholder="Enter Order ID (e.g. 664abc123def...)"
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={loading || !orderId.trim()}
          className="btn-primary px-6 disabled:opacity-50 flex-shrink-0"
        >
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: '#fee2e2' }}>
          <svg width="18" height="18" fill="none" stroke="#991b1b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {order && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(35,31,30,0.06)' }}>
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-mono font-semibold text-gray-400 uppercase mb-1">Order #{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full capitalize"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Progress */}
            <OrderProgress status={order.status} />

            {/* Items summary */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--heading-color)' }}>Items ({order.items?.length})</p>
              <div className="flex flex-wrap gap-2">
                {order.items?.map((item, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ backgroundColor: 'var(--white-smoke)', color: 'var(--heading-color)' }}>
                    {item.title} ×{item.quantity}
                  </span>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--heading-color)' }}>Shipping To</p>
                <p className="text-sm text-gray-500">
                  {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-sm text-gray-500">Order Total</span>
              <span className="font-bold text-lg" style={{ color: 'var(--heading-color)' }}>${order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!order && !error && (
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'var(--white-smoke)' }}>
            📦
          </div>
          <p className="text-gray-400 text-sm">Your order status will appear here after tracking.</p>
          <p className="text-gray-400 text-xs mt-1">Find your Order ID in the confirmation email or <Link to="/orders" className="underline" style={{ color: 'var(--primary-color)' }}>My Orders</Link> page.</p>
        </div>
      )}
    </div>
  )
}

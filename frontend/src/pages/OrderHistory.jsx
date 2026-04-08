import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import { toast } from 'react-toastify'
import Loader from '../components/Loader'

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered']

const STATUS_CONFIG = {
  pending:    { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
  processing: { bg: '#dbeafe', color: '#1e40af', label: 'Processing' },
  shipped:    { bg: '#e0e7ff', color: '#3730a3', label: 'Shipped' },
  delivered:  { bg: '#dcfce7', color: '#15803d', label: 'Delivered' },
  cancelled:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
}

const REPLACEMENT_REASONS = [
  'Item arrived damaged',
  'Wrong item delivered',
  'Item is defective / not working',
  'Item does not match description',
  'Missing parts or accessories',
  'Other',
]

const CANCEL_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function getTimeLeft(createdAt, now) {
  const remaining = CANCEL_WINDOW_MS - (now - new Date(createdAt).getTime())
  if (remaining <= 0) return null
  const m = Math.floor(remaining / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return `${m}m ${s}s`
}

function OrderProgress({ status }) {
  if (status === 'cancelled') return null
  const currentStep = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 mt-4 mb-2">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentStep
        const isLast = i === STATUS_STEPS.length - 1
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                style={{
                  backgroundColor: done ? 'var(--primary-color)' : '#e5e7eb',
                  color: done ? '#fff' : '#9ca3af',
                }}
              >
                {done ? (
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span className="text-[10px] mt-1 capitalize text-center leading-tight"
                style={{ color: done ? 'var(--primary-color)' : '#9ca3af', fontWeight: done ? 600 : 400 }}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full"
                style={{ backgroundColor: i < currentStep ? 'var(--primary-color)' : '#e5e7eb' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [now, setNow] = useState(Date.now())

  // Replacement modal state
  const [replacementModal, setReplacementModal] = useState(null)
  const [replacementForm, setReplacementForm] = useState({ itemTitle: '', reason: '', note: '' })
  const [replacementSubmitting, setReplacementSubmitting] = useState(false)

  // Cancellation request modal state
  const [cancelRequestModal, setCancelRequestModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelRequestSubmitting, setCancelRequestSubmitting] = useState(false)

  // Live countdown tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchOrders = () => {
    API.get('/api/orders/my-orders')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [])

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    setCancelling(orderId)
    try {
      await API.put(`/api/orders/${orderId}/cancel`)
      toast.success('Order cancelled successfully')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setCancelling(null)
    }
  }

  const handleRequestCancellation = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) { toast.error('Please enter a reason'); return }
    setCancelRequestSubmitting(true)
    try {
      await API.post(`/api/orders/${cancelRequestModal._id}/request-cancel`, { reason: cancelReason })
      toast.success('Cancellation request submitted. The vendor will be notified.')
      setCancelRequestModal(null)
      setCancelReason('')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setCancelRequestSubmitting(false)
    }
  }

  const openReplacementModal = (order) => {
    setReplacementForm({ itemTitle: order.items?.[0]?.title || '', reason: '', note: '' })
    setReplacementModal(order)
  }

  const handleReplacementSubmit = async (e) => {
    e.preventDefault()
    if (!replacementForm.reason) { toast.error('Please select a reason'); return }
    setReplacementSubmitting(true)
    try {
      await API.post(`/api/orders/${replacementModal._id}/replacement`, replacementForm)
      toast.success('Replacement request submitted! We will contact you within 24 hours.')
      setReplacementModal(null)
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request')
    } finally {
      setReplacementSubmitting(false)
    }
  }

  if (loading) return <Loader />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 text-sm mb-2 text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color: 'var(--heading-color)', fontWeight: 600 }}>My Orders</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--heading-color)' }}>My Orders</h1>
        {orders.length > 0 && <p className="text-gray-500 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--white-smoke)' }}>📦</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--heading-color)' }}>No orders yet</h2>
          <p className="text-gray-500 text-sm mb-6">Looks like you haven't made any purchases yet.</p>
          <Link to="/products" className="btn-primary py-3 px-8">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const isOpen = expanded === order._id
            const timeLeft = order.status === 'pending' ? getTimeLeft(order.createdAt, now) : null
            const canCancel = order.status === 'pending' && timeLeft !== null
            const activeReplacement = order.replacementRequests?.find(r => r.status !== 'rejected')
            const canReplace = order.status === 'delivered' && !activeReplacement
            const cancelReqStatus = order.cancellationRequest?.status
            const canRequestCancel = order.paymentStatus === 'paid'
              && ['pending', 'processing'].includes(order.status)
              && cancelReqStatus !== 'pending'
              && cancelReqStatus !== 'approved'

            return (
              <div key={order._id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid rgba(35,31,30,0.06)' }}>
                {/* Order header */}
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono font-semibold text-gray-400 uppercase">#{order._id.slice(-8).toUpperCase()}</p>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {activeReplacement && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: activeReplacement.status === 'approved' ? '#dcfce7' : activeReplacement.status === 'pending' ? '#fef9c3' : '#fee2e2',
                              color: activeReplacement.status === 'approved' ? '#15803d' : activeReplacement.status === 'pending' ? '#854d0e' : '#991b1b',
                            }}>
                            Replacement {activeReplacement.status}
                          </span>
                        )}
                        {cancelReqStatus && cancelReqStatus !== 'none' && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: cancelReqStatus === 'approved' ? '#fee2e2' : cancelReqStatus === 'pending' ? '#fef9c3' : '#f3f4f6',
                              color: cancelReqStatus === 'approved' ? '#991b1b' : cancelReqStatus === 'pending' ? '#854d0e' : '#6b7280',
                            }}>
                            Cancel {cancelReqStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl" style={{ color: 'var(--heading-color)' }}>${order.totalAmount?.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Item chips */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {order.items?.slice(0, 4).map((item, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ backgroundColor: 'var(--white-smoke)', color: 'var(--heading-color)' }}>
                        {item.title} ×{item.quantity}
                      </span>
                    ))}
                    {order.items?.length > 4 && (
                      <span className="text-xs text-gray-400">+{order.items.length - 4} more</span>
                    )}
                  </div>

                  <OrderProgress status={order.status} />

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <button
                      onClick={() => setExpanded(isOpen ? null : order._id)}
                      className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      {isOpen ? 'Hide Details' : 'View Details'}
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                        className="transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Cancel button with countdown */}
                      {order.status === 'pending' && (
                        canCancel ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                              ⏱ Cancel available for {timeLeft}
                            </span>
                            <button
                              onClick={() => handleCancel(order._id)}
                              disabled={cancelling === order._id}
                              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {cancelling === order._id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                            Cancellation window expired
                          </span>
                        )
                      )}

                      {/* Post-payment cancellation request */}
                      {canRequestCancel && (
                        <button
                          onClick={() => { setCancelRequestModal(order); setCancelReason('') }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-orange-300 text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          Request Cancellation
                        </button>
                      )}
                      {cancelReqStatus === 'pending' && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          ⏳ Awaiting vendor decision
                        </span>
                      )}

                      {/* Replacement request button */}
                      {canReplace && (
                        <button
                          onClick={() => openReplacementModal(order)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
                          style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                        >
                          Request Replacement
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-5 py-5" style={{ backgroundColor: 'var(--white-smoke)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--heading-color)' }}>Order Items</h4>
                        <div className="space-y-2">
                          {order.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-gray-600">{item.title} <span className="text-gray-400">×{item.quantity}</span></span>
                              <span className="font-medium" style={{ color: 'var(--heading-color)' }}>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 mt-1">
                              <span>Coupon ({order.couponCode})</span>
                              <span>-${order.discountAmount?.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-sm" style={{ color: 'var(--heading-color)' }}>
                            <span>Total</span>
                            <span>${order.totalAmount?.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Replacement request detail */}
                        {activeReplacement && (
                          <div className="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50">
                            <p className="text-xs font-semibold text-amber-800 mb-1">Replacement Request</p>
                            <p className="text-xs text-amber-700"><span className="font-medium">Item:</span> {activeReplacement.itemTitle}</p>
                            <p className="text-xs text-amber-700"><span className="font-medium">Reason:</span> {activeReplacement.reason}</p>
                            {activeReplacement.note && <p className="text-xs text-amber-700"><span className="font-medium">Note:</span> {activeReplacement.note}</p>}
                            <p className="text-xs text-amber-600 mt-1 capitalize">Status: <strong>{activeReplacement.status}</strong></p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--heading-color)' }}>Shipping & Payment</h4>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-600 space-y-1 mb-3">
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        ) : <p className="text-sm text-gray-400 mb-3">No address on file</p>}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Payment:</span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize"
                            style={{
                              backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                              color: order.paymentStatus === 'paid' ? '#15803d' : '#854d0e'
                            }}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Request Cancellation Modal */}
      {cancelRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--heading-color)' }}>Request Cancellation</h3>
                <p className="text-xs text-gray-400 mt-0.5">Order #{cancelRequestModal._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setCancelRequestModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-800 font-medium">How it works</p>
              <p className="text-xs text-amber-700 mt-1">Your request will be sent to the vendor for review. If approved, your order total <strong>${cancelRequestModal.totalAmount?.toFixed(2)}</strong> will be credited as <strong>gift points</strong> to your account for future purchases.</p>
            </div>

            <form onSubmit={handleRequestCancellation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>
                  Reason for cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={3}
                  className="input-field text-sm"
                  placeholder="e.g. Changed my mind, found a better price, ordered by mistake..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCancelRequestModal(null)} className="btn-secondary flex-1 py-2.5 text-sm">
                  Keep Order
                </button>
                <button type="submit" disabled={cancelRequestSubmitting || !cancelReason.trim()} className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-50" style={{ backgroundColor: '#ea580c' }}>
                  {cancelRequestSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replacement Request Modal */}
      {replacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--heading-color)' }}>Request Replacement</h3>
                <p className="text-xs text-gray-400 mt-0.5">Order #{replacementModal._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setReplacementModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            </div>

            <form onSubmit={handleReplacementSubmit} className="space-y-4">
              {/* Select item */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>
                  Which item has an issue?
                </label>
                <select
                  value={replacementForm.itemTitle}
                  onChange={e => setReplacementForm({ ...replacementForm, itemTitle: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  {replacementModal.items?.map((item, i) => (
                    <option key={i} value={item.title}>{item.title} ×{item.quantity}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>
                  Reason
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REPLACEMENT_REASONS.map(r => (
                    <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={replacementForm.reason === r}
                        onChange={() => setReplacementForm({ ...replacementForm, reason: r })}
                        className="accent-[var(--primary-color)] w-3.5 h-3.5 flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional note */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>
                  Additional Note <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={replacementForm.note}
                  onChange={e => setReplacementForm({ ...replacementForm, note: e.target.value })}
                  rows={3}
                  className="input-field text-sm"
                  placeholder="Describe the issue in more detail..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setReplacementModal(null)} className="btn-secondary flex-1 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={replacementSubmitting || !replacementForm.reason} className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-50">
                  {replacementSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

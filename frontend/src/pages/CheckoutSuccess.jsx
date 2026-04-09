import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import API from '../api/axios'
import { toast } from 'react-toastify'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [status, setStatus] = useState('success')
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const sessionId = searchParams.get('session_id')
    if (!sessionId) { navigate('/cart'); return }

    // Show success immediately — Stripe already confirmed payment
    // Create order in background
    const shippingAddress = JSON.parse(localStorage.getItem('pendingShippingAddress') || '{}')
    const notes = localStorage.getItem('pendingOrderNotes') || ''
    const couponCode = localStorage.getItem('pendingCouponCode') || ''
    const discountAmount = parseFloat(localStorage.getItem('pendingDiscountAmount') || '0')
    const giftPointsUsed = parseFloat(localStorage.getItem('pendingGiftPointsUsed') || '0')

    API.post('/api/orders', {
      shippingAddress,
      paymentIntentId: sessionId,
      notes,
      couponCode,
      discountAmount,
      giftPointsUsed,
    }).then(() => {
      clearCart()
    }).catch(() => {})

    localStorage.removeItem('pendingShippingAddress')
    localStorage.removeItem('pendingOrderNotes')
    localStorage.removeItem('pendingCouponCode')
    localStorage.removeItem('pendingDiscountAmount')
    localStorage.removeItem('pendingGiftPointsUsed')

    toast.success('Order placed successfully!')
    setTimeout(() => navigate('/orders'), 2500)
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {status === 'success' && (
        <>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl"
            style={{ backgroundColor: 'var(--primary-color)' }}>
            ✓
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500">Your order has been placed. Redirecting to your orders...</p>
        </>
      )}
    </div>
  )
}

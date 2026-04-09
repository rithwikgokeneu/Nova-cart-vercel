import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import API from '../api/axios'
import { toast } from 'react-toastify'

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { clearCart } = useCart()
  const [status, setStatus] = useState('processing')
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const sessionId = searchParams.get('session_id')
    if (!sessionId) { navigate('/cart'); return }

    const completeOrder = async () => {
      try {
        // Stripe already confirmed payment by redirecting here — skip verification
        const shippingAddress = JSON.parse(localStorage.getItem('pendingShippingAddress') || '{}')
        const notes = localStorage.getItem('pendingOrderNotes') || ''
        const couponCode = localStorage.getItem('pendingCouponCode') || ''
        const discountAmount = parseFloat(localStorage.getItem('pendingDiscountAmount') || '0')
        const giftPointsUsed = parseFloat(localStorage.getItem('pendingGiftPointsUsed') || '0')

        await API.post('/api/orders', {
          shippingAddress,
          paymentIntentId: sessionId,
          notes,
          couponCode,
          discountAmount,
          giftPointsUsed,
        })

        await clearCart()
        localStorage.removeItem('pendingShippingAddress')
        localStorage.removeItem('pendingOrderNotes')
        localStorage.removeItem('pendingCouponCode')
        localStorage.removeItem('pendingDiscountAmount')
        localStorage.removeItem('pendingGiftPointsUsed')

        setStatus('success')
        toast.success('Order placed successfully!')
        setTimeout(() => navigate('/orders'), 2500)
      } catch {
        setStatus('error')
        toast.error('Failed to confirm order. Please contact support.')
      }
    }

    completeOrder()
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      {status === 'processing' && (
        <>
          <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin mx-auto mb-6"
            style={{ borderTopColor: 'var(--primary-color)' }} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your payment...</h1>
          <p className="text-gray-500">Please wait, do not close this page.</p>
        </>
      )}

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

      {status === 'error' && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 text-red-500 text-3xl">
            ✗
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-6">We couldn't confirm your payment. If you were charged, please contact support.</p>
          <button onClick={() => navigate('/cart')} className="btn-primary px-6 py-3">Return to Cart</button>
        </>
      )}
    </div>
  )
}

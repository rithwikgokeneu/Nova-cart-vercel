import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import { toast } from 'react-toastify'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorType, setErrorType] = useState(null)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setErrorType(null)
    try {
      await API.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      const data = err.response?.data
      if (data?.notFound) setErrorType('notFound')
      else toast.error(data?.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ backgroundColor: 'var(--white-smoke)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="Nova Cart" className="h-14 w-auto max-w-[200px] object-contain mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ backgroundColor: 'var(--light-cyan)' }}>📧</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--heading-color)' }}>Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.</p>
              <Link to="/login" className="btn-primary px-6 py-2.5 text-sm inline-block">Back to Login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--heading-color)' }}>Forgot Password?</h2>
                <p className="text-sm text-gray-500 mt-2">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrorType(null) }}
                    className={`input-field ${errorType === 'notFound' ? 'border-red-400' : ''}`}
                    placeholder="you@example.com"
                    required
                  />
                  {errorType === 'notFound' && (
                    <p className="mt-2 text-xs text-red-500">
                      No account found with this email.{' '}
                      <Link to="/register" className="font-semibold underline">Create an account</Link>
                    </p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary-color)' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

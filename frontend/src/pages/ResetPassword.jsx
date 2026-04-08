import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import API from '../api/axios'
import { toast } from 'react-toastify'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await API.post(`/api/auth/reset-password/${token}`, { password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.')
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
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ backgroundColor: 'var(--light-cyan)' }}>✓</div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--heading-color)' }}>Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-4">Your password has been updated. Redirecting to login...</p>
              <Link to="/login" className="btn-primary px-6 py-2.5 text-sm inline-block">Go to Login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--heading-color)' }}>Set New Password</h2>
                <p className="text-sm text-gray-500 mt-2">Enter your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className={`input-field ${confirm && confirm !== password ? 'border-red-400' : ''}`}
                    placeholder="••••••••"
                    required
                  />
                  {confirm && confirm !== password && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

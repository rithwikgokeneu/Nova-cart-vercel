import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

export default function Register() {
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') === 'vendor' ? 'vendor' : 'customer'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    searchParams.get('error') === 'email_taken'
      ? 'This email is already registered. Please sign up with a different email or log in.'
      : ''
  )
  const errorRef = useRef(null)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/google?role=${form.role}&intent=signup`
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await register(form.name, form.email, form.password, form.role)
      toast.success('Account created successfully!')
      if (user.role === 'vendor') navigate('/vendor')
      else navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      setError(msg)
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
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
          <div className="text-center mb-8">
            <h2 style={{ fontSize: '28px', color: 'var(--heading-color)', fontWeight: 700 }}>Create Account</h2>
            <p className="text-gray-500 mt-2 text-sm">Join Nova Cart today — it's free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError('') }}
                className="input-field"
                placeholder="you@example.com"
                required
                style={error && error.toLowerCase().includes('email') ? { borderColor: '#ef4444' } : {}}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="Min. 6 characters" required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'customer', label: '🛍️ Shop', desc: 'Buy products' },
                  { value: 'vendor',   label: '🏪 Sell', desc: 'List & sell products' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: opt.value })}
                    className="p-4 text-left rounded-xl border-2 transition-all"
                    style={{
                      borderColor: form.role === opt.value ? 'var(--primary-color)' : '#e5e7eb',
                      backgroundColor: form.role === opt.value ? '#e6f0ec' : '#fff',
                    }}
                  >
                    <div className="font-semibold text-sm" style={{ color: 'var(--heading-color)' }}>{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div ref={errorRef} style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '12px 16px', color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-gray-400">or sign up with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-full border border-gray-200 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--primary-color)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import { toast } from 'react-toastify'
import { getImageUrl } from '../utils/imageUrl'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '', zipCode: '', country: '' })
  const [password, setPassword] = useState({ new: '', confirm: '' })
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('profile')
  const [giftPoints, setGiftPoints] = useState(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '', phone: user.phone || '',
        street: user.address?.street || '', city: user.address?.city || '',
        state: user.address?.state || '', zipCode: user.address?.zipCode || '',
        country: user.address?.country || ''
      })
      if (user.avatar) setPreview(getImageUrl(user.avatar))
    }
    // Fetch fresh gift points balance from backend
    API.get('/api/auth/me').then(r => setGiftPoints(r.data.user?.giftPoints ?? 0)).catch(() => {})
  }, [user])

  const handleAvatarChange = e => {
    const file = e.target.files[0]
    if (file) { setAvatar(file); setPreview(URL.createObjectURL(file)) }
  }

  const handleProfileSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('phone', form.phone)
      fd.append('address', JSON.stringify({ street: form.street, city: form.city, state: form.state, zipCode: form.zipCode, country: form.country }))
      if (avatar) fd.append('avatar', avatar)
      const { data } = await API.put('/api/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally { setLoading(false) }
  }

  const handlePasswordSubmit = async e => {
    e.preventDefault()
    if (password.new !== password.confirm) { toast.error('Passwords do not match'); return }
    if (password.new.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await API.put('/api/users/profile', { password: password.new })
      toast.success('Password updated!')
      setPassword({ new: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex mb-6 bg-gray-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {[['profile', 'Profile Info'], ['password', 'Change Password']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${tab === t ? 'bg-white shadow text-sm' : 'text-gray-500 hover:text-gray-700'}`}
            style={tab === t ? { color: 'var(--primary-color)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          {/* Avatar card */}
          <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative flex-shrink-0">
              {preview
                ? <img src={preview} alt="" className="w-20 h-20 rounded-full object-cover" />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: 'var(--primary-color)' }}>{user?.name?.charAt(0).toUpperCase()}</div>
              }
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow cursor-pointer border border-gray-200">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full capitalize" style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)' }}>{user?.role}</span>
            </div>
          </div>

          {/* Gift Points balance */}
          {giftPoints !== null && (
            <div className="rounded-2xl p-5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #1a3c34 0%, #2176ae 100%)' }}>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Gift Points Balance</p>
                <p className="text-white text-3xl font-black">{giftPoints} <span className="text-lg font-semibold text-white/80">pts</span></p>
                <p className="text-white/60 text-xs mt-1">Worth ${giftPoints.toFixed(2)} — use at checkout</p>
              </div>
              <div className="text-5xl opacity-80">🎁</div>
            </div>
          )}

          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-800">Address</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="input-field" placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[['city', 'City'], ['state', 'State'], ['zipCode', 'Zip Code'], ['country', 'Country']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input-field" />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary py-3 px-8 w-full sm:w-auto">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="card space-y-4 w-full sm:max-w-md">
          <h3 className="font-semibold text-gray-800">Change Password</h3>
          {[['new', 'New Password'], ['confirm', 'Confirm Password']].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type="password" value={password[key]} onChange={e => setPassword({ ...password, [key]: e.target.value })} className="input-field" placeholder="••••••••" required />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary py-3 px-8 w-full sm:w-auto">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  )
}

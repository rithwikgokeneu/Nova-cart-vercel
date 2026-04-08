import { useState, useEffect, useRef } from 'react'
import API from '../api/axios'
import Loader from '../components/Loader'
import { toast } from 'react-toastify'
import { useCategories } from '../context/CategoryContext'

const statusColors = { pending: 'bg-yellow-100 text-yellow-800', processing: 'bg-blue-100 text-blue-800', shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }

const EMPTY_FORM = { title: '', description: '', price: '', discountPrice: '', category: '', stock: '', brand: '', tags: '' }

export default function AdminDashboard() {
  const { categories, refreshCategories } = useCategories()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 })
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
  const [couponSubmitting, setCouponSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [productForm, setProductForm] = useState(EMPTY_FORM)
  const [productImages, setProductImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [csvExporting, setCsvExporting] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { fetchOverview() }, [])
  useEffect(() => {
    if (tab === 'users') fetchUsers()
    else if (tab === 'products') fetchProducts()
    else if (tab === 'orders') fetchOrders()
    else if (tab === 'coupons') fetchCoupons()
  }, [tab])

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const [u, p, o] = await Promise.all([
        API.get('/api/users?limit=5'),
        API.get('/api/products?limit=5'),
        API.get('/api/orders?limit=100')
      ])
      const revenue = (o.data.orders || []).filter(x => x.paymentStatus === 'paid').reduce((a, b) => a + b.totalAmount, 0)
      setStats({ users: u.data.total || 0, products: p.data.total || 0, orders: o.data.total || 0, revenue })
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchUsers = async (search = '') => {
    setLoading(true)
    try {
      const url = search ? `/api/users?limit=50&search=${encodeURIComponent(search)}` : '/api/users?limit=50'
      const { data } = await API.get(url)
      setUsers(data.users || [])
    }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try { const { data } = await API.get('/api/coupons'); setCoupons(data.coupons || []) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const handleCreateCoupon = async e => {
    e.preventDefault()
    setCouponSubmitting(true)
    try {
      await API.post('/api/coupons', {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : 1000,
      })
      setCouponForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' })
      fetchCoupons()
      toast.success('Coupon created!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create coupon') }
    finally { setCouponSubmitting(false) }
  }

  const handleDeleteCoupon = async id => {
    if (!window.confirm('Delete this coupon?')) return
    try { await API.delete(`/api/coupons/${id}`); fetchCoupons(); toast.success('Coupon deleted') }
    catch { toast.error('Failed') }
  }

  const handleExportCSV = async () => {
    setCsvExporting(true)
    try {
      const { data } = await API.get('/api/orders/export/csv', { responseType: 'text' })
      const blob = new Blob([data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV downloaded!')
    } catch { toast.error('Failed to export CSV') }
    finally { setCsvExporting(false) }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try { const { data } = await API.get('/api/products?limit=50'); setProducts(data.products || []) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try { const { data } = await API.get('/api/orders?limit=50'); setOrders(data.orders || []) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }


  const handleDeleteUser = async id => {
    if (!window.confirm('Delete this user?')) return
    try { await API.delete(`/api/users/${id}`); setUsers(u => u.filter(x => x._id !== id)); toast.success('User deleted') }
    catch { toast.error('Failed to delete user') }
  }

  const handleToggleUser = async (id, isActive) => {
    try { await API.put(`/api/users/${id}`, { isActive: !isActive }); fetchUsers(); toast.success('User updated') }
    catch { toast.error('Failed to update user') }
  }

  const handleDeleteProduct = async id => {
    if (!window.confirm('Delete this product?')) return
    try { await API.delete(`/api/products/${id}`); setProducts(p => p.filter(x => x._id !== id)); toast.success('Product deleted') }
    catch { toast.error('Failed to delete product') }
  }

  const handleUpdateOrderStatus = async (id, status) => {
    try { await API.put(`/api/orders/${id}/status`, { status }); fetchOrders(); toast.success('Order updated') }
    catch { toast.error('Failed to update order') }
  }

  const handleAddCategory = async e => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try { await API.post('/api/categories', { name: newCategory }); refreshCategories(); setNewCategory(''); toast.success('Category added') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDeleteCategory = async id => {
    if (!window.confirm('Delete this category?')) return
    try { await API.delete(`/api/categories/${id}`); refreshCategories(); toast.success('Category deleted') }
    catch { toast.error('Failed') }
  }

  const openNewProductForm = () => {
    setEditProduct(null)
    setProductForm(EMPTY_FORM)
    setProductImages([])
    setShowProductForm(true)
  }

  const openEditProductForm = p => {
    setEditProduct(p)
    setProductForm({
      title: p.title || '', description: p.description || '',
      price: p.price || '', discountPrice: p.discountPrice || '',
      category: p.category?._id || '', stock: p.stock || '',
      brand: p.brand || '', tags: p.tags?.join(', ') || ''
    })
    setProductImages([])
    setShowProductForm(true)
  }

  const handleSubmitProduct = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(productForm).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      productImages.forEach(img => fd.append('images', img))
      if (editProduct) {
        await API.put(`/api/products/${editProduct._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product updated!')
      } else {
        await API.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product created!')
      }
      setShowProductForm(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally { setSubmitting(false) }
  }

  const tabs = ['overview', 'users', 'products', 'orders', 'categories', 'coupons']

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Admin Dashboard</h1>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                    <input type="number" step="0.01" value={productForm.discountPrice} onChange={e => setProductForm({ ...productForm, discountPrice: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} className="input-field" required>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} className="input-field" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input value={productForm.tags} onChange={e => setProductForm({ ...productForm, tags: e.target.value })} className="input-field" placeholder="electronics, phone" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                  <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => setProductImages(Array.from(e.target.files))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowProductForm(false)} className="btn-secondary flex-1 py-3">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                    {submitting ? 'Saving...' : (editProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex overflow-x-auto mb-6 sm:mb-8 border-b border-gray-200 gap-0">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-3 sm:px-4 font-medium text-xs sm:text-sm capitalize border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${tab === t ? '' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={tab === t ? { borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        loading ? <Loader /> : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                { label: 'Total Users', value: stats.users, icon: '👥', color: 'bg-blue-500' },
                { label: 'Total Products', value: stats.products, icon: '📦', color: 'bg-green-500' },
                { label: 'Total Orders', value: stats.orders, icon: '🛒', color: 'bg-purple-500' },
                { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: '💰', color: 'bg-accent-500' }
              ].map(s => (
                <div key={s.label} className="card flex items-center gap-4">
                  <div className={`${s.color} text-white rounded-xl p-3 text-2xl`}>{s.icon}</div>
                  <div>
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div className="mb-4">
            <input
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); fetchUsers(e.target.value) }}
              placeholder="Search users by name or email..."
              className="input-field max-w-sm"
            />
          </div>
          {loading ? <Loader /> : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleToggleUser(u._id, u.isActive)} className="text-xs btn-secondary py-1 px-2">{u.isActive ? 'Disable' : 'Enable'}</button>
                      {u.role !== 'admin' && <button onClick={() => handleDeleteUser(u._id)} className="text-xs btn-danger py-1 px-2">Delete</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* Products */}
      {tab === 'products' && (
        loading ? <Loader /> : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600 text-sm">{products.length} products total</p>
              <button onClick={openNewProductForm} className="btn-primary text-sm py-2 px-5">+ Add Product</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Vendor', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${p.images[0]}`) : 'https://placehold.co/40x40'} alt="" className="w-10 h-10 rounded-lg object-cover" onError={e => { e.target.src = 'https://placehold.co/40x40' }} />
                          <span className="font-medium text-gray-800 text-sm line-clamp-1 max-w-32">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{p.category?.name}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 text-sm">${p.price?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${p.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{p.vendor?.name}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => openEditProductForm(p)} className="text-xs btn-secondary py-1 px-2">Edit</button>
                        <button onClick={() => handleDeleteProduct(p._id)} className="text-xs btn-danger py-1 px-2">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Orders */}
      {tab === 'orders' && (
        loading ? <Loader /> : (
          <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">{orders.length} orders</p>
            <button
              onClick={handleExportCSV}
              disabled={csvExporting}
              className="text-sm font-semibold px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
            >
              {csvExporting ? 'Exporting...' : '⬇ Export CSV'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Update Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(o => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">#{o._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{o.customer?.name}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 text-sm">${o.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[o.status]}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={o.status} onChange={e => handleUpdateOrderStatus(o._id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )
      )}

      {/* Coupons */}
      {tab === 'coupons' && (
        <div className="max-w-3xl space-y-6">
          {/* Create coupon form */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-4">Create Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAVE20"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type *</label>
                  <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value })} className="input-field">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount Value *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    placeholder={couponForm.discountType === 'percentage' ? '20' : '5.00'}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Amount</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={couponForm.minOrderAmount}
                    onChange={e => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                    placeholder="0.00"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Uses</label>
                  <input
                    type="number" min="1"
                    value={couponForm.maxUses}
                    onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    placeholder="100"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expires At</label>
                  <input
                    type="date"
                    value={couponForm.expiresAt}
                    onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <button type="submit" disabled={couponSubmitting} className="btn-primary px-6 py-2 text-sm">
                {couponSubmitting ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>

          {/* Coupon list */}
          {loading ? <Loader /> : (
            <div className="card space-y-3">
              <h3 className="font-bold text-gray-800">Active Coupons ({coupons.length})</h3>
              {coupons.length === 0 ? <p className="text-gray-500 text-sm">No coupons yet.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', ''].map(h => (
                          <th key={h} className="pb-2 px-2 text-left text-xs font-semibold text-gray-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {coupons.map(c => (
                        <tr key={c._id} className="hover:bg-gray-50">
                          <td className="py-3 px-2 font-mono text-sm font-bold" style={{ color: 'var(--primary-color)' }}>{c.code}</td>
                          <td className="py-3 px-2 text-xs text-gray-600 capitalize">{c.discountType}</td>
                          <td className="py-3 px-2 text-sm font-semibold text-gray-800">{c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue}`}</td>
                          <td className="py-3 px-2 text-xs text-gray-500">{c.minOrderAmount > 0 ? `$${c.minOrderAmount}` : '-'}</td>
                          <td className="py-3 px-2 text-xs text-gray-500">{c.usedCount}/{c.maxUses}</td>
                          <td className="py-3 px-2 text-xs text-gray-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                          <td className="py-3 px-2">
                            <button onClick={() => handleDeleteCoupon(c._id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="max-w-xl space-y-6">
          <form onSubmit={handleAddCategory} className="card flex gap-3">
            <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category name..." className="input-field flex-1" required />
            <button type="submit" className="btn-primary px-6">Add</button>
          </form>
          {loading ? <Loader /> : (
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-800">Categories ({categories.length})</h3>
              {categories.length === 0 ? <p className="text-gray-500 text-sm">No categories yet.</p> : (
                categories.map(c => (
                  <div key={c._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c._id)} className="text-xs btn-danger py-1 px-3">Delete</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import API from '../api/axios'
import Loader from '../components/Loader'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../context/CategoryContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const statusColors = { pending: 'bg-yellow-100 text-yellow-800', processing: 'bg-blue-100 text-blue-800', shipped: 'bg-indigo-100 text-indigo-800', delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800' }

function InvoiceModal({ order, vendor, onClose }) {
  const handlePrint = () => window.print()
  const subtotal = order.items.reduce((a, i) => a + i.price * i.quantity, 0)
  const shipping = subtotal >= 50 ? 0 : 5.99

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" id="invoice-print">
        <style>{`@media print { body * { visibility: hidden; } #invoice-print, #invoice-print * { visibility: visible; } #invoice-print { position: fixed; top: 0; left: 0; width: 100%; } .no-print { display: none !important; } }`}</style>

        {/* Invoice header */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black" style={{ color: 'var(--primary-color)' }}>
                Nova<span style={{ color: 'var(--heading-color)' }}>Cart</span>
              </h1>
              <p className="text-gray-400 text-xs mt-1">E-Commerce Platform</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--heading-color)' }}>INVOICE</h2>
              <p className="text-sm text-gray-500 mt-1">#{order._id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Bill to / From */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Bill To</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--heading-color)' }}>{order.customer?.name}</p>
              <p className="text-xs text-gray-500">{order.customer?.email}</p>
              {order.shippingAddress && (
                <p className="text-xs text-gray-500 mt-1">
                  {order.shippingAddress.street}, {order.shippingAddress.city},<br />
                  {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                  {order.shippingAddress.country}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">From</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--heading-color)' }}>{vendor?.name || 'Vendor'}</p>
              <p className="text-xs text-gray-500">{vendor?.email}</p>
              <div className="mt-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[order.status]}`}>{order.status}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-6">
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3">Item</th>
                <th className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3">Qty</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3">Unit Price</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-400 pb-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td className="py-3 text-sm font-medium" style={{ color: 'var(--heading-color)' }}>{item.title}</td>
                  <td className="py-3 text-sm text-center text-gray-500">{item.quantity}</td>
                  <td className="py-3 text-sm text-right text-gray-500">${item.price?.toFixed(2)}</td>
                  <td className="py-3 text-sm text-right font-semibold" style={{ color: 'var(--heading-color)' }}>${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '2px solid var(--heading-color)', color: 'var(--heading-color)' }}>
                <span>Total</span><span>${order.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Payment</span>
                <span className={order.paymentStatus === 'paid' ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>
                  {order.paymentStatus?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs text-gray-400 text-center">Thank you for shopping with Nova Cart. For questions, contact support@novacart.com</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 no-print">
            <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">Close</button>
            <button onClick={handlePrint} className="btn-primary flex-1 py-3 text-sm">
              🖨 Print / Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const { categories } = useCategories()
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', price: '', discountPrice: '', category: '', stock: '', brand: '', tags: '' })
  const [images, setImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [invoiceOrder, setInvoiceOrder] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (tab === 'products') fetchProducts()
    else if (tab === 'orders' || tab === 'cancellations') fetchOrders()
    else if (tab === 'analytics') fetchAnalytics()
  }, [tab])

  const handleResolveCancellation = async (orderId, action) => {
    try {
      await API.put(`/api/orders/${orderId}/resolve-cancel`, { action })
      toast.success(action === 'approve'
        ? 'Approved — customer refunded with gift points.'
        : 'Cancellation request rejected.')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request')
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try { const { data } = await API.get('/api/products/vendor/my-products'); setProducts(data.products || []) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchOrders = async () => {
    setLoading(true)
    try { const { data } = await API.get('/api/orders/vendor'); setOrders(data.orders || []) }
    catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/api/orders/vendor/analytics')
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const formatted = (data.analytics || []).map(d => ({
        month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
        revenue: parseFloat(d.totalRevenue.toFixed(2)),
        orders: d.totalOrders,
      }))
      setAnalytics(formatted)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const openNewForm = () => {
    setEditProduct(null)
    setForm({ title: '', description: '', price: '', discountPrice: '', category: '', stock: '', brand: '', tags: '' })
    setImages([])
    setShowForm(true)
  }

  const openEditForm = product => {
    setEditProduct(product)
    setForm({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category?._id || '',
      stock: product.stock || '',
      brand: product.brand || '',
      tags: product.tags?.join(', ') || ''
    })
    setImages([])
    setShowForm(true)
  }

  const handleSubmitProduct = async e => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      images.forEach(img => fd.append('images', img))

      if (editProduct) {
        await API.put(`/api/products/${editProduct._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product updated!')
      } else {
        await API.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product created!')
      }
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProduct = async id => {
    if (!window.confirm('Delete this product?')) return
    try { await API.delete(`/api/products/${id}`); setProducts(p => p.filter(x => x._id !== id)); toast.success('Deleted!') }
    catch { toast.error('Failed to delete') }
  }

  const handleUpdateOrderStatus = async (id, status) => {
    try { await API.put(`/api/orders/${id}/status`, { status }); fetchOrders(); toast.success('Order status updated') }
    catch { toast.error('Failed') }
  }

  const vendorRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((a, b) => a + b.totalAmount, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {invoiceOrder && <InvoiceModal order={invoiceOrder} vendor={user} onClose={() => setInvoiceOrder(null)} />}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Vendor Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'My Products', value: products.length, icon: '📦', color: 'bg-blue-500' },
          { label: 'Total Orders', value: orders.length, icon: '🛒', color: 'bg-purple-500' },
          { label: 'Revenue', value: `$${vendorRevenue.toFixed(2)}`, icon: '💰', color: 'bg-green-500' }
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

      {/* Tabs */}
      <div className="flex overflow-x-auto mb-6 border-b border-gray-200">
        {[['products', 'My Products'], ['orders', 'My Orders'], ['cancellations', 'Cancellations'], ['analytics', 'Analytics']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-3 px-4 font-medium text-sm capitalize border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${tab === t ? '' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            style={tab === t ? { borderColor: 'var(--primary-color)', color: 'var(--primary-color)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                    <input type="number" step="0.01" value={form.discountPrice} onChange={e => setForm({ ...form, discountPrice: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" required>
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="input-field" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="electronics, phone, gadget" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Images (max 5)</label>
                  <input ref={fileRef} type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                  {images.length > 0 && <p className="text-xs text-gray-500 mt-1">{images.length} file(s) selected</p>}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 py-3">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3">
                    {submitting ? 'Saving...' : (editProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products tab */}
      {tab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 text-sm">{products.length} products</p>
            <button onClick={openNewForm} className="btn-primary">+ Add Product</button>
          </div>
          {loading ? <Loader /> : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-gray-500 mb-4">You haven't added any products yet.</p>
              <button onClick={openNewForm} className="btn-primary">Add Your First Product</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => {
                const imageUrl = p.images?.[0] ? (p.images[0].startsWith('http') ? p.images[0] : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${p.images[0]}`) : 'https://placehold.co/300x200?text=No+Image'
                return (
                  <div key={p._id} className="card">
                    <img src={imageUrl} alt={p.title} className="w-full h-40 object-cover rounded-lg mb-3" onError={e => { e.target.src = 'https://placehold.co/300x200?text=No+Image' }} />
                    <h3 className="font-semibold text-gray-800 line-clamp-1 mb-1">{p.title}</h3>
                    <p className="text-primary-600 font-bold mb-1">${p.price?.toFixed(2)}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">{p.category?.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock === 0 ? 'Out of Stock' : p.stock < 5 ? `Low: ${p.stock}` : `Stock: ${p.stock}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditForm(p)} className="btn-secondary flex-1 text-sm py-1.5">Edit</button>
                      <button onClick={() => handleDeleteProduct(p._id)} className="btn-danger flex-1 text-sm py-1.5">Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        loading ? <Loader /> : (
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-5xl mb-4">🛒</p>
                <p className="text-gray-500">No orders for your products yet.</p>
              </div>
            ) : (
              <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Update', 'Invoice'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">#{o._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{o.customer?.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{o.items?.length} item(s)</td>
                      <td className="px-4 py-3 font-medium text-gray-800 text-sm">${o.totalAmount?.toFixed(2)}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusColors[o.status]}`}>{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={e => handleUpdateOrderStatus(o._id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setInvoiceOrder(o)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                          style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)' }}
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* Cancellations tab */}
      {tab === 'cancellations' && (
        loading ? <Loader /> : (() => {
          const pending = orders.filter(o => o.cancellationRequest?.status === 'pending')
          return pending.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-4">✅</p>
              <p className="text-gray-500">No pending cancellation requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{pending.length} pending request{pending.length !== 1 ? 's' : ''}</p>
              {pending.map(o => (
                <div key={o._id} className="bg-white rounded-2xl p-5 border border-orange-200" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-mono font-semibold text-gray-400 uppercase mb-1">#{o._id.slice(-8).toUpperCase()}</p>
                      <p className="font-semibold text-gray-800">{o.customer?.name}</p>
                      <p className="text-xs text-gray-400">{o.customer?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl" style={{ color: 'var(--heading-color)' }}>${o.totalAmount?.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">to be refunded as gift points</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                    <p className="text-xs font-semibold text-orange-800 mb-1">Customer's Reason</p>
                    <p className="text-sm text-orange-700">{o.cancellationRequest.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">Requested {new Date(o.cancellationRequest.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Items in this order</p>
                    <div className="flex flex-wrap gap-1.5">
                      {o.items?.map((item, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{item.title} ×{item.quantity}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolveCancellation(o._id, 'reject')}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleResolveCancellation(o._id, 'approve')}
                      className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors"
                      style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                      Approve & Refund {Math.round(o.totalAmount)} Points
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && (
        loading ? <Loader /> : (
          <div className="space-y-6">
            {analytics.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-4">📊</p>
                <p className="text-gray-500">No sales data yet. Analytics will appear once you have paid orders.</p>
              </div>
            ) : (
              <>
                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={v => `$${v}`} />
                      <Tooltip formatter={v => [`$${v}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                      <Bar dataKey="revenue" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-bold text-gray-800 mb-4">Orders Per Month</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                      <Tooltip formatter={v => [v, 'Orders']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                      <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Revenue', value: `$${analytics.reduce((a,b) => a + b.revenue, 0).toFixed(2)}`, icon: '💰' },
                    { label: 'Total Orders', value: analytics.reduce((a,b) => a + b.orders, 0), icon: '🛒' },
                    { label: 'Avg / Month', value: `$${analytics.length ? (analytics.reduce((a,b) => a + b.revenue, 0) / analytics.length).toFixed(2) : '0.00'}`, icon: '📈' },
                  ].map(s => (
                    <div key={s.label} className="card flex items-center gap-3">
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className="font-bold text-lg" style={{ color: 'var(--heading-color)' }}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      )}
    </div>
  )
}

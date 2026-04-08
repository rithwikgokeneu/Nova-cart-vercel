import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import API from '../api/axios'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import Breadcrumb from '../components/Breadcrumb'
import { useCategories } from '../context/CategoryContext'

const CAT_IMAGE_MAP = {
  furniture:              '/muse/cat-furniture.png',
  'hand bag':             '/muse/cat-handbag.png',
  handbag:                '/muse/cat-handbag.png',
  bags:                   '/muse/cat-handbag.png',
  fashion:                '/muse/cat-handbag.png',
  clothing:               '/muse/cat-handbag.png',
  books:                  '/muse/cat-books.png',
  tech:                   '/muse/cat-tech.png',
  electronics:            '/muse/cat-tech.png',
  sneakers:               '/muse/cat-sneakers.png',
  shoes:                  '/muse/cat-sneakers.png',
  sports:                 '/muse/cat-sneakers.png',
  travel:                 '/muse/cat-travel.png',
  automotive:             '/muse/cat-travel.png',
  beauty:                 '/muse/cat-handbag.png',
  toys:                   '/muse/cat-tech.png',
  'home & kitchen':       '/muse/cat-furniture.png',
  home:                   '/muse/cat-furniture.png',
}

function getCatImage(name = '') {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(CAT_IMAGE_MAP)) {
    if (key.includes(k)) return v
  }
  return '/muse/cat-tech.png'
}

export default function CategoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { categories } = useCategories()

  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')

  const category = categories.find(c => c._id === id) || null

  useEffect(() => {
    if (categories.length > 0 && !category) navigate('/products')
  }, [categories, category])

  // fetch products whenever page, sort, or id changes
  useEffect(() => {
    if (!id) return
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 12, category: id, sort })
    API.get(`/api/products?${params}`)
      .then(r => {
        setProducts(r.data.products || [])
        setTotal(r.data.total || 0)
        setPages(r.data.pages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, page, sort])

  const bannerImg = category ? getCatImage(category.name) : '/muse/cat-tech.png'

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '80vh' }}>

      {/* Category banner */}
      <div
        className="relative overflow-hidden flex items-end"
        style={{ height: '260px' }}
      >
        <img
          src={bannerImg}
          alt={category?.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)' }} />
        <div className="container relative z-10 pb-8">
          <nav className="flex items-center gap-1.5 text-xs mb-3 flex-wrap">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">Home</Link>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-white/40"><path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <Link to="/products" className="text-white/60 hover:text-white transition-colors">Products</Link>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-white/40"><path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span className="text-white font-medium">{category?.name}</span>
          </nav>
          {category && (
            <h1
              className="text-white font-bold"
              style={{ fontSize: '40px', lineHeight: '120%' }}
            >
              {category.name}
            </h1>
          )}
          <p className="text-white/70 text-sm mt-1">{total} products found</p>
        </div>
      </div>

      <div className="container py-10">
        {/* Sort + count bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold" style={{ color: 'var(--heading-color)' }}>{products.length}</span> of {total} products
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Sort:</span>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              className="input-field text-sm"
              style={{ width: 'auto', paddingTop: '8px', paddingBottom: '8px' }}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Products grid */}
        {loading ? <Loader /> : (
          <>
            {products.length === 0 ? (
              <div
                className="text-center py-20 rounded-2xl"
                style={{ backgroundColor: 'var(--white-smoke)' }}
              >
                <p className="text-5xl mb-4">📦</p>
                <p className="text-gray-500 mb-2">No products in this category yet.</p>
                <p className="text-gray-400 text-sm mb-6">Check back soon or explore other categories.</p>
                <Link to="/products" className="btn-primary">Browse All Products</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs py-2.5 px-5 disabled:opacity-40"
                >
                  ← Prev
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-10 h-10 rounded-full font-semibold text-sm transition-all"
                    style={p === page
                      ? { backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none' }
                      : { backgroundColor: '#fff', color: 'var(--heading-color)', border: '1.5px solid #e5e7eb' }
                    }
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-secondary text-xs py-2.5 px-5 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Other categories */}
      <OtherCategories currentId={id} />
    </div>
  )
}

function OtherCategories({ currentId }) {
  const { categories } = useCategories()
  const cats = categories.filter(c => c._id !== currentId).slice(0, 5)

  if (cats.length === 0) return null

  return (
    <section style={{ backgroundColor: 'var(--white-smoke)', paddingTop: '60px', paddingBottom: '60px' }}>
      <div className="container">
        <h3 className="section-title mb-8">Explore Other Categories</h3>
        <div className="flex flex-wrap gap-3">
          {cats.map(c => (
            <Link
              key={c._id}
              to={`/category/${c._id}`}
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:shadow-md"
              style={{
                backgroundColor: '#fff',
                color: 'var(--heading-color)',
                border: '1.5px solid #e5e7eb',
              }}
            >
              {c.name}
            </Link>
          ))}
          <Link
            to="/products"
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
          >
            View All →
          </Link>
        </div>
      </div>
    </section>
  )
}

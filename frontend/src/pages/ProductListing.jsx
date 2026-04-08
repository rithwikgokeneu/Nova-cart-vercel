import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import API from '../api/axios'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import Breadcrumb from '../components/Breadcrumb'
import { useCategories } from '../context/CategoryContext'

export default function ProductListing() {
  const { categories } = useCategories()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [searchParams] = useSearchParams()
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  })

  useEffect(() => { fetchProducts() }, [page, filters.search, filters.category, filters.minPrice, filters.maxPrice, filters.sort])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 12 })
      if (filters.search) params.set('search', filters.search)
      if (filters.category) params.set('category', filters.category)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.sort) params.set('sort', filters.sort)
      const { data } = await API.get(`/api/products?${params}`)
      setProducts(data.products || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleSearch = e => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchInput }))
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: 'newest' })
    setPage(1)
  }

  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice]
    .filter(Boolean).length + (filters.sort !== 'newest' ? 1 : 0)

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Category</h4>
        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="input-field text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Price Range</h4>
        <div className="flex gap-2">
          <input type="number" placeholder="Min $" min="0" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)} className="input-field text-sm" />
          <input type="number" placeholder="Max $" min="0" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)} className="input-field text-sm" />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Sort By</h4>
        <select value={filters.sort} onChange={e => handleFilterChange('sort', e.target.value)} className="input-field text-sm">
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <button onClick={clearFilters} className="btn-secondary w-full text-xs py-2.5">
        Clear Filters
      </button>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '80vh' }}>
      {/* Page header */}
      <div style={{ backgroundColor: 'var(--white-smoke)', paddingTop: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(35,31,30,0.08)' }}>
        <div className="container">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'All Products', href: '/products' }]} />
          <h2 style={{ color: 'var(--heading-color)', fontWeight: 700, fontSize: '28px' }}>All Products</h2>
          <p className="text-gray-500 text-sm mt-1">{total} product{total !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search bar + mobile filter button */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10 rounded-full"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="submit" className="btn-primary px-5 text-sm">Search</button>
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setFilterDrawerOpen(true)}
            className="lg:hidden relative flex items-center gap-2 btn-secondary text-sm px-4"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.828V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.172a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </form>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-5">
            <span className="text-xs text-gray-400">Active filters:</span>
            {filters.category && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)' }}>
                {categories.find(c => c._id === filters.category)?.name}
                <button onClick={() => handleFilterChange('category', '')} className="hover:opacity-70">×</button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)' }}>
                ${filters.minPrice || '0'} – ${filters.maxPrice || '∞'}
                <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', '') }} className="hover:opacity-70">×</button>
              </span>
            )}
            {filters.sort !== 'newest' && (
              <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--light-cyan)', color: 'var(--primary-color)' }}>
                {filters.sort === 'price_asc' ? 'Price ↑' : filters.sort === 'price_desc' ? 'Price ↓' : 'Top Rated'}
                <button onClick={() => handleFilterChange('sort', 'newest')} className="hover:opacity-70">×</button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">Clear all</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters sidebar */}
          <aside className="hidden lg:block lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 sticky top-28" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--heading-color)' }}>Filters</h3>
                {activeFilterCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--primary-color)' }}>{activeFilterCount}</span>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1">
            {loading ? <Loader /> : (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-20" style={{ backgroundColor: 'var(--white-smoke)', borderRadius: '16px' }}>
                    <p className="text-5xl mb-4">🔍</p>
                    <p className="text-gray-500 font-medium mb-1">No products found</p>
                    <p className="text-gray-400 text-sm mb-5">Try adjusting your search or filters.</p>
                    <button onClick={clearFilters} className="btn-primary text-sm px-6 py-2.5">Clear Filters</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map(p => <ProductCard key={p._id} product={p} />)}
                  </div>
                )}

                {pages > 1 && (
                  <div className="flex justify-center gap-2 mt-10 flex-wrap">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-2.5 px-5 disabled:opacity-40">← Prev</button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-10 h-10 rounded-full font-semibold text-sm transition-all"
                        style={p === page
                          ? { backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none' }
                          : { backgroundColor: '#fff', color: 'var(--heading-color)', border: '1.5px solid #e5e7eb' }
                        }
                      >{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-xs py-2.5 px-5 disabled:opacity-40">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setFilterDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl p-6 pb-8" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-base" style={{ color: 'var(--heading-color)' }}>Filters & Sort</h3>
              <button onClick={() => setFilterDrawerOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel />
            <button onClick={() => setFilterDrawerOpen(false)} className="btn-primary w-full mt-6 py-3">
              Show {total} Results
            </button>
          </div>
        </>
      )}
    </div>
  )
}

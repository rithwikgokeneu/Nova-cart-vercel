import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCategories } from '../context/CategoryContext'

function MobileCategorySection({ categories, setMenuOpen }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-4 text-base font-medium"
        style={{ color: 'var(--heading-color)' }}
      >
        <Link to="/products" onClick={() => setMenuOpen(false)} className="font-bold" style={{ color: 'var(--heading-color)' }}>Products</Link>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"
          className="transition-transform duration-200 opacity-50"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && categories.map(c => (
        <Link
          key={c._id}
          to={`/category/${c._id}`}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 py-3 pl-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--primary-color)' }} />
          {c.name}
        </Link>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { categories } = useCategories()

  const productsRef = useRef(null)
  const accountRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = e => {
      if (productsRef.current && !productsRef.current.contains(e.target)) setProductsOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropdownOpen(false)
  }

  const handleSearch = e => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <>
      {/* Topbar */}
      <div style={{ backgroundColor: 'var(--primary-color)' }} className="py-2">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/muse/star.svg" alt="" className="w-4 h-4 brightness-0 invert" />
              <span className="text-white text-xs">+00 1234 567890</span>
            </div>
            <div className="text-white text-xs font-medium hidden sm:block overflow-hidden flex-1 mx-8">
              <div style={{ display: 'flex', animation: 'marquee 18s linear infinite', whiteSpace: 'nowrap' }}>
                <span>Get 50% Off on Selected Items &nbsp;|&nbsp; Shop Now &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Free Shipping on Orders Over $50 &nbsp;|&nbsp; Limited Time Offer &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                <span>Get 50% Off on Selected Items &nbsp;|&nbsp; Shop Now &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Free Shipping on Orders Over $50 &nbsp;|&nbsp; Limited Time Offer &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              </div>
              <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
            </div>
            <div className="flex items-center gap-4 text-white text-xs opacity-80">
              <span>Eng</span>
              <span>Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-white sticky top-0 z-50 border-b border-gray-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="container">
          <div className="flex items-center justify-between h-16 gap-6">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <img src="/logo.png" alt="Nova Cart" className="h-14 sm:h-16 w-auto max-w-[180px] sm:max-w-[210px] object-contain" />
            </Link>

            {/* Nav Links (desktop) */}
            <div className="hidden lg:flex items-center gap-7 flex-shrink-0">
              <Link
                to="/"
                className="text-sm font-medium transition-colors relative pb-0.5"
                style={{
                  color: isActive('/') ? 'var(--primary-color)' : 'var(--heading-color)',
                  borderBottom: isActive('/') ? '2px solid var(--primary-color)' : '2px solid transparent'
                }}
              >
                Home
              </Link>

              {/* Products dropdown */}
              <div className="relative" ref={productsRef}>
                <button
                  onClick={() => setProductsOpen(o => !o)}
                  className="flex items-center gap-1 text-sm font-medium transition-colors relative pb-0.5"
                  style={{
                    color: isActive('/products') || isActive('/category') ? 'var(--primary-color)' : 'var(--heading-color)',
                    borderBottom: isActive('/products') || isActive('/category') ? '2px solid var(--primary-color)' : '2px solid transparent'
                  }}
                >
                  Products
                  <svg
                    width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
                    className="transition-transform duration-200"
                    style={{ transform: productsOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6 }}
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {productsOpen && (
                  <div
                    className="absolute left-0 mt-3 bg-white rounded-2xl border border-gray-100 py-3 z-50"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '220px' }}
                  >
                    {/* All Products link */}
                    <Link
                      to="/products"
                      onClick={() => setProductsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                      style={{ color: 'var(--primary-color)' }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: 'var(--primary-color)' }}>✦</span>
                      All Products
                    </Link>

                    {categories.length > 0 && (
                      <>
                        <div className="mx-4 my-2 border-t border-gray-100" />
                        <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Categories</p>
                        {categories.map(c => (
                          <Link
                            key={c._id}
                            to={`/category/${c._id}`}
                            onClick={() => setProductsOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                            style={{ color: 'var(--heading-color)' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--primary-color)' }} />
                            {c.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium transition-colors relative pb-0.5"
                  style={{
                    color: isActive('/admin') ? 'var(--primary-color)' : 'var(--heading-color)',
                    borderBottom: isActive('/admin') ? '2px solid var(--primary-color)' : '2px solid transparent'
                  }}>Admin</Link>
              )}
              {user?.role === 'vendor' && (
                <Link to="/vendor" className="text-sm font-medium transition-colors relative pb-0.5"
                  style={{
                    color: isActive('/vendor') ? 'var(--primary-color)' : 'var(--heading-color)',
                    borderBottom: isActive('/vendor') ? '2px solid var(--primary-color)' : '2px solid transparent'
                  }}>Dashboard</Link>
              )}
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md items-center">
              <div className="relative w-full">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Product"
                  className="w-full border border-gray-200 rounded-full px-5 py-2.5 text-sm pr-12 focus:outline-none focus:border-primary-600 transition-colors"
                  style={{ color: 'var(--heading-color)', fontSize: '13px' }}
                />
                <button type="submit" className="absolute right-0 top-0 h-full px-4 flex items-center justify-center rounded-r-full transition-colors hover:bg-gray-50">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <path opacity="0.8" d="M8.33317 3.33317C5.57175 3.33317 3.33317 5.57175 3.33317 8.33317C3.33317 11.0946 5.57175 13.3332 8.33317 13.3332C11.0946 13.3332 13.3332 11.0946 13.3332 8.33317C13.3332 5.57175 11.0946 3.33317 8.33317 3.33317ZM1.6665 8.33317C1.6665 4.65127 4.65127 1.6665 8.33317 1.6665C12.0151 1.6665 14.9998 4.65127 14.9998 8.33317C14.9998 9.87376 14.4773 11.2923 13.5997 12.4212L18.0891 16.9106C18.4145 17.236 18.4145 17.7637 18.0891 18.0891C17.7637 18.4145 17.236 18.4145 16.9106 18.0891L12.4212 13.5997C11.2923 14.4773 9.87376 14.9998 8.33317 14.9998C4.65127 14.9998 1.6665 12.0151 1.6665 8.33317Z" fill="#231F1E"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-5 flex-shrink-0">
              {user ? (
                <>
                  {(user.role === 'customer' || user.role === 'admin') && (
                    <>
                      <Link to="/wishlist" className="relative flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--heading-color)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </Link>
                      <Link to="/cart" className="relative flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--heading-color)' }}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="hidden sm:block">Cart</span>
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--primary-color)' }}>{cartCount}</span>
                        )}
                      </Link>
                    </>
                  )}
                  <div className="relative" ref={accountRef}>
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--heading-color)' }}>
                      {user.avatar ? (
                        <img src={(import.meta.env.VITE_API_URL || 'http://localhost:5001') + (user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar)} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: 'var(--primary-color)' }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="hidden sm:block">{user.name?.split(' ')[0]}</span>
                    </button>
                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                        <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">Profile</Link>
                        {(user.role === 'customer' || user.role === 'admin') && (
                          <>
                            <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">My Orders</Link>
                            <Link to="/wishlist" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">Wishlist</Link>
                          </>
                        )}
                        <Link to="/track-order" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">Track Order</Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-xs text-red-500 hover:bg-gray-50 transition-colors">Logout</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70" style={{ color: 'var(--heading-color)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:block">Login</span>
                  </Link>
                  <Link to="/register" className="btn-primary text-xs py-2 px-5">Sign Up</Link>
                </>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-50"
                style={{ color: 'var(--heading-color)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown (non-fixed, scrolls with page) ── */}
      {menuOpen && (
        <div
          className="lg:hidden bg-white rounded-2xl mx-4 mb-4 overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13)', zIndex: 40, position: 'relative' }}
        >
          {/* Search bar */}
          <div className="px-5 pt-5 pb-3">
            <form onSubmit={e => { handleSearch(e); setMenuOpen(false) }}>
              <div className="relative">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Product"
                  className="w-full border border-gray-200 rounded-full px-5 py-3 text-sm pr-12 focus:outline-none"
                  style={{ color: 'var(--heading-color)' }}
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path opacity="0.6" d="M8.33317 3.33317C5.57175 3.33317 3.33317 5.57175 3.33317 8.33317C3.33317 11.0946 5.57175 13.3332 8.33317 13.3332C11.0946 13.3332 13.3332 11.0946 13.3332 8.33317C13.3332 5.57175 11.0946 3.33317 8.33317 3.33317ZM1.6665 8.33317C1.6665 4.65127 4.65127 1.6665 8.33317 1.6665C12.0151 1.6665 14.9998 4.65127 14.9998 8.33317C14.9998 9.87376 14.4773 11.2923 13.5997 12.4212L18.0891 16.9106C18.4145 17.236 18.4145 17.7637 18.0891 18.0891C17.7637 18.4145 17.236 18.4145 16.9106 18.0891L12.4212 13.5997C11.2923 14.4773 9.87376 14.9998 8.33317 14.9998C4.65127 14.9998 1.6665 12.0151 1.6665 8.33317Z" fill="#231F1E"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Nav links */}
          <div className="px-5 pb-5">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center py-4 text-base font-medium border-b border-gray-100"
              style={{ color: 'var(--heading-color)' }}
            >
              Home
            </Link>

            {/* Products with categories */}
            <MobileCategorySection categories={categories} setMenuOpen={setMenuOpen} />

            {user ? (
              <>
                {(user.role === 'customer' || user.role === 'admin') && (
                  <Link to="/cart" onClick={() => setMenuOpen(false)} className="flex items-center justify-between py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>
                    Cart
                    {cartCount > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: 'var(--primary-color)' }}>{cartCount}</span>}
                  </Link>
                )}
                {(user.role === 'customer' || user.role === 'admin') && (
                  <>
                    <Link to="/orders" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>Orders</Link>
                    <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>Wishlist</Link>
                  </>
                )}
                <Link to="/track-order" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>
                  Track Order
                </Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>Admin</Link>
                )}
                {user.role === 'vendor' && (
                  <Link to="/vendor" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>Dashboard</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left py-4 text-base font-medium text-red-500">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-medium border-b border-gray-100" style={{ color: 'var(--heading-color)' }}>
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-4 text-base font-bold" style={{ color: 'var(--primary-color)' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import { useCategories } from '../context/CategoryContext'

const CAT_IMAGE_MAP = [
  { keywords: ['furniture', 'home', 'kitchen', 'decor'],    img: '/muse/cat-furniture.png' },
  { keywords: ['bag', 'fashion', 'clothing', 'handbag'],    img: '/muse/cat-handbag.png' },
  { keywords: ['book'],                                      img: '/muse/cat-books.png' },
  { keywords: ['tech', 'electronics', 'gadget', 'toys'],    img: '/muse/cat-tech.png' },
  { keywords: ['sneaker', 'shoe', 'sports', 'fitness'],     img: '/muse/cat-sneakers.png' },
  { keywords: ['travel', 'automotive', 'beauty', 'care'],   img: '/muse/cat-travel.png' },
]

function getImageForCategory(name = '') {
  const lower = name.toLowerCase()
  for (const entry of CAT_IMAGE_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.img
  }
  // fallback: cycle through images
  return CAT_IMAGE_MAP[0].img
}

const HERO_PRODUCTS = [
  '/muse/prod-airpodmax.png',
  '/muse/prod-macbook.png',
  '/muse/prod-homepad.png',
  '/muse/prod-headphone.png',
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { categories } = useCategories()

  const getCategoryLink = (keyword) => {
    const match = categories.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()))
    return match ? `/category/${match._id}` : '/products'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const prodRes = await API.get('/api/products?limit=8')
        setProducts(prodRes.data.products || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div style={{ backgroundColor: '#fff', color: 'var(--heading-color)' }}>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: 'url(/muse/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          paddingTop: '120px',
          paddingBottom: '120px',
        }}
      >
        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1 max-w-xl">
              <h1 style={{ fontSize: '64px', fontWeight: 700, lineHeight: '74px', color: 'var(--primary-color)' }} className="mb-6">
                shopping and<br />department store.
              </h1>
              <p style={{ fontSize: '18px', lineHeight: '145%', color: 'var(--heading-color)', maxWidth: '460px' }} className="mb-8 opacity-80">
Discover thousands of products across electronics, fashion, home & kitchen, and more — all in one place, delivered to your door.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products" className="btn-primary">Learn More</Link>
                <Link to="/register?role=vendor" className="btn-secondary">Become a Vendor</Link>
              </div>
            </div>

            {/* Product images grid */}
            <div className="flex-1 hidden lg:grid grid-cols-2 gap-4 max-w-md">
              {HERO_PRODUCTS.map((src, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-center h-44">
                  <img src={src} alt="" className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP CATEGORIES ── */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className="container">
          <div className="mb-10">
            <h3 className="section-title">Shop Our Top Categories</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {(categories.length > 0 ? categories.slice(0, 6) : []).map((cat, i) => (
              <Link
                key={cat._id}
                to={`/category/${cat._id}`}
                className="group relative block overflow-hidden rounded-2xl"
                style={{ aspectRatio: '1 / 1', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}
              >
                {/* Background image */}
                <img
                  src={getImageForCategory(cat.name) || CAT_IMAGE_MAP[i % CAT_IMAGE_MAP.length].img}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Subtle dark overlay so text is always legible */}
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }} />
                {/* Centered label */}
                <div className="absolute inset-0 flex items-center justify-center px-2">
                  <span
                    className="text-white font-bold text-center leading-tight drop-shadow-lg"
                    style={{ fontSize: '15px', textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
                  >
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}

            {/* Fallback tiles while categories load (keeps layout stable) */}
            {categories.length === 0 && CAT_IMAGE_MAP.map((c, i) => (
              <Link
                key={i}
                to="/products"
                className="group relative block overflow-hidden rounded-2xl"
                style={{ aspectRatio: '1 / 1', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}
              >
                <img src={c.img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST DEAL FOR YOU ── */}
      <section style={{ paddingBottom: '80px', backgroundColor: 'var(--white-smoke)' }}>
        <div className="container" style={{ paddingTop: '60px' }}>
          <div className="flex items-center justify-between mb-10">
            <h3 className="section-title">Best Deal for You!</h3>
            <Link to="/products" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary-color)' }}>
              View All →
            </Link>
          </div>
          {loading ? <Loader /> : (
            products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 mb-6">No products yet — be the first to list!</p>
                <Link to="/register?role=vendor" className="btn-primary">Become a Vendor</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 4).map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── DISCOUNT BANNER ── */}
      <section style={{ paddingTop: '60px', paddingBottom: '60px' }}>
        <div className="container">
          <div
            className="rounded-3xl overflow-hidden flex flex-col md:flex-row items-center justify-between"
            style={{ backgroundColor: 'var(--linen)', minHeight: '220px' }}
          >
            {/* Left — text block */}
            <div className="flex-1 px-14 py-12">
              <h2
                style={{
                  fontSize: '52px',
                  fontWeight: 800,
                  lineHeight: '115%',
                  color: 'var(--heading-color)',
                  letterSpacing: '-1px',
                }}
                className="mb-3"
              >
                Get 5% Cash Back
              </h2>
              <p
                style={{ color: 'var(--heading-color)', opacity: 0.55, fontSize: '16px' }}
                className="mb-8"
              >
                on Nova Cart.com
              </p>
              <Link
                to="/register"
                className="btn-primary"
                style={{ paddingTop: '14px', paddingBottom: '14px', paddingLeft: '36px', paddingRight: '36px', fontSize: '15px' }}
              >
                Learn More
              </Link>
            </div>

            {/* Right — card image */}
            <div
              className="flex-shrink-0 flex items-end justify-center md:justify-end self-end"
              style={{ paddingRight: '60px', paddingBottom: '0' }}
            >
              <img
                src="/muse/discount-banner.png"
                alt="Cash back card"
                style={{ height: '200px', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── MOST SELLING PRODUCTS ── */}
      {products.length > 4 && (
        <section style={{ paddingBottom: '80px', backgroundColor: 'var(--white-smoke)' }}>
          <div className="container" style={{ paddingTop: '60px' }}>
            <div className="flex items-center justify-between mb-10">
              <h3 className="section-title">Most Selling Products</h3>
              <Link to="/products" className="text-sm font-semibold hover:underline" style={{ color: 'var(--primary-color)' }}>
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(4).map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── TRENDING PRODUCTS ── */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#fff' }}>
        <div className="container">
          <h3 className="section-title mb-10">Trending Products For You!</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { img: '/muse/trend-furniture.png', name: 'Furniture Village', desc: 'Delivery within 24 hours', keyword: 'furniture' },
              { img: '/muse/trend-fashion.png',   name: 'Fashion World',     desc: 'Delivery within 24 hours', keyword: 'clothing' },
            ].map(item => (
              <div
                key={item.name}
                className="rounded-2xl overflow-hidden relative group cursor-pointer"
                style={{ height: '380px' }}
              >
                {/* Full image */}
                <img
                  src={item.img}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient overlay — stronger at bottom */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)' }}
                />
                {/* Text + button — bottom left */}
                <div className="absolute bottom-0 left-0 p-8">
                  <h3
                    className="text-white font-bold mb-1"
                    style={{ fontSize: '22px', lineHeight: '130%' }}
                  >
                    {item.name}
                  </h3>
                  <p className="mb-5" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
                    {item.desc}
                  </p>
                  <Link
                    to={getCategoryLink(item.keyword)}
                    className="inline-flex items-center justify-center font-semibold text-white text-xs transition-all duration-200"
                    style={{
                      backgroundColor: 'rgba(35,31,30,0.85)',
                      borderRadius: '50px',
                      padding: '11px 24px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLING STORE ── */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#fff' }}>
        <div className="container">
          <h3 className="section-title mb-10">Best Selling Store</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { img: '/muse/store-one.png',   initial: 'S', color: '#e53e3e', name: 'Staples',       tags: 'Bag • Perfume' },
              { img: '/muse/store-two.png',   initial: 'N', color: '#3182ce', name: 'Now Delivery',  tags: 'Electronics • Gadget' },
              { img: '/muse/store-three.png', initial: 'B', color: '#c53030', name: 'Bevmo',         tags: 'Beauty • Care' },
              { img: '/muse/store-four.png',  initial: 'Q', color: '#276749', name: 'Quicklly',      tags: 'Sneakers • Sports' },
            ].map(store => (
              <div key={store.name} className="group cursor-pointer">
                {/* Image with logo overlap */}
                <div className="relative mb-3">
                  <div className="overflow-hidden rounded-2xl" style={{ height: '240px' }}>
                    <img
                      src={store.img}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Store logo circle — overlaps image bottom */}
                  <div
                    className="absolute left-4 flex items-center justify-center rounded-full text-white font-black text-lg border-4 border-white"
                    style={{
                      bottom: '-20px',
                      width: '52px',
                      height: '52px',
                      backgroundColor: store.color,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {store.initial}
                  </div>
                </div>

                {/* Text — padded top to clear the logo */}
                <div style={{ paddingTop: '28px' }}>
                  <h4 className="font-bold mb-1" style={{ fontSize: '18px', color: 'var(--heading-color)' }}>
                    {store.name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">{store.tags}</p>
                  <div className="flex items-center gap-1.5">
                    {/* Pin icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#d53f8c"/>
                    </svg>
                    <span className="text-xs font-medium" style={{ color: '#d53f8c' }}>
                      Delivery within 24 hours
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ paddingTop: '80px', paddingBottom: '80px', backgroundColor: '#fff' }}>
        <div className="container">
          <h3 className="section-title mb-10">Services To Help You Shop</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: '/muse/service-faq.png',      title: 'Frequently Asked Questions', desc: 'Get instant answers about orders, returns, and your account — all in one place.' },
              { img: '/muse/service-payment.png',   title: 'Secure Online Payments',     desc: 'Pay safely with Stripe, Visa, Mastercard, Apple Pay, Google Pay, and more.' },
              { img: '/muse/service-delivery.png',  title: 'Fast Home Delivery',         desc: 'Free shipping on orders over $50. Track your package in real time until it arrives.' },
            ].map(s => (
              <div
                key={s.title}
                className="overflow-hidden rounded-2xl flex flex-col"
                style={{ backgroundColor: 'var(--white-smoke)' }}
              >
                {/* Text block — top */}
                <div className="px-8 pt-8 pb-6">
                  <h3
                    className="font-bold mb-3 leading-snug"
                    style={{ fontSize: '22px', color: 'var(--heading-color)' }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {/* Image block — bottom, flush */}
                <div className="flex-1" style={{ minHeight: '220px' }}>
                  <img
                    src={s.img}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

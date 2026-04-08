import { Link } from 'react-router-dom'
import { useCategories } from '../context/CategoryContext'

const PAYMENT_ICONS = [
  { src: '/muse/pay-stripe.png', alt: 'Stripe' },
  { src: '/muse/pay-visa.png', alt: 'Visa' },
  { src: '/muse/pay-mastercard.png', alt: 'Mastercard' },
  { src: '/muse/pay-amazon.png', alt: 'Amazon' },
  { src: '/muse/pay-apple.png', alt: 'Apple Pay' },
  { src: '/muse/pay-paypal.png', alt: 'PayPal' },
  { src: '/muse/pay-google.png', alt: 'Google Pay' },
]

export default function Footer() {
  const { categories } = useCategories()

  return (
    <footer className="bg-white mt-auto" style={{ borderTop: '1px solid rgba(35,31,30,0.12)' }}>
      <div className="container">
        {/* Top footer */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand col */}
          <div>
            <div className="mb-4">
              <img src="/logo.png" alt="Nova Cart" className="h-20 w-auto max-w-[240px] object-contain" />
            </div>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
Your one-stop online store for electronics, fashion, home essentials, and more. Fast delivery, secure payments, and great deals every day.
            </p>
            <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--heading-color)' }}>Accepted Payments</h4>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_ICONS.map(p => (
                <div key={p.alt} className="bg-gray-50 rounded-md p-1.5 flex items-center justify-center" style={{ height: '28px', minWidth: '36px' }}>
                  <img src={p.src} alt={p.alt} className="h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <h4 className="font-semibold mb-5 text-sm" style={{ color: 'var(--heading-color)', fontSize: '16px' }}>Department</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {categories.length > 0
                ? categories.map(c => (
                    <li key={c._id}>
                      <Link to={`/category/${c._id}`} className="hover:text-gray-900 transition-colors">{c.name}</Link>
                    </li>
                  ))
                : ['Fashion', 'Electronics & Gadget', 'Books', 'Sneakers', 'Furniture', 'Beauty Products'].map(item => (
                    <li key={item}><span className="text-gray-400">{item}</span></li>
                  ))
              }
            </ul>
          </div>

          {/* About & Services */}
          <div>
            <h4 className="font-semibold mb-5 text-sm" style={{ color: 'var(--heading-color)', fontSize: '16px' }}>Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {[['/', 'Home'], ['/products', 'Products'], ['/login', 'Login'], ['/register', 'Sign Up']].map(([to, label]) => (
                <li key={to}><Link to={to} className="hover:text-gray-900 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold mb-5 text-sm" style={{ color: 'var(--heading-color)', fontSize: '16px' }}>Help & Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                { label: 'FAQ', href: '/products' },
                { label: 'Shipping Policy', href: '/products' },
                { label: 'Returns', href: '/orders' },
                { label: 'Contact Us', href: 'mailto:support@novacart.com' },
                { label: 'Track Order', to: '/track-order' },
              ].map(item => (
                <li key={item.label}>
                  {item.to
                    ? <Link to={item.to} className="hover:text-gray-900 transition-colors">{item.label}</Link>
                    : <a href={item.href} className="hover:text-gray-900 transition-colors">{item.label}</a>
                  }
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500"
          style={{ borderTop: '1px solid rgba(35,31,30,0.1)' }}
        >
          <div className="flex items-center gap-6">
            <Link to="/register?role=vendor" className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
              <span>💼</span> Become Seller
            </Link>
            <Link to="/products" className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
              <span>🎁</span> Gift Cards
            </Link>
            <Link to="/track-order" className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
              <span>❓</span> Help Center
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/products" className="hover:text-gray-800 transition-colors">Terms of Service</Link>
            <Link to="/products" className="hover:text-gray-800 transition-colors">Privacy & Policy</Link>
          </div>
          <div>All Rights Reserved by Nova Cart &copy; {new Date().getFullYear()}</div>
        </div>
      </div>
    </footer>
  )
}

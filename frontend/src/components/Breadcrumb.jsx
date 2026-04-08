import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6 flex-wrap" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-gray-300 flex-shrink-0">
                <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {isLast ? (
              <span className="font-medium truncate max-w-[180px]" style={{ color: 'var(--heading-color)' }}>{item.label}</span>
            ) : (
              <Link to={item.href} className="text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap">{item.label}</Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}

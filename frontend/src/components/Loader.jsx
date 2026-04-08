export default function Loader({ size = 'md' }) {
  const sizes = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-14 w-14' }
  return (
    <div className="flex justify-center items-center py-12">
      <div
        className={`${sizes[size]} animate-spin rounded-full`}
        style={{ border: '3px solid #e5e7eb', borderTopColor: 'var(--primary-color)' }}
      />
    </div>
  )
}

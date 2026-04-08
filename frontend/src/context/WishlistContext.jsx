import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import API from '../api/axios'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth()
  const [wishlistIds, setWishlistIds] = useState(new Set())

  useEffect(() => {
    if (user) {
      API.get('/api/wishlist')
        .then(r => setWishlistIds(new Set(r.data.products.map(p => p._id))))
        .catch(() => {})
    } else {
      setWishlistIds(new Set())
    }
  }, [user])

  const toggleWishlist = async (productId) => {
    if (!user) return false
    try {
      const { data } = await API.post(`/api/wishlist/${productId}`)
      setWishlistIds(prev => {
        const next = new Set(prev)
        data.inWishlist ? next.add(productId) : next.delete(productId)
        return next
      })
      return data.inWishlist
    } catch { return false }
  }

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)

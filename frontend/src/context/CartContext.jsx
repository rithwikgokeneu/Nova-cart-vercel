import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] })
  const [cartLoading, setCartLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchCart()
    else setCart({ items: [] })
  }, [user])

  const fetchCart = async () => {
    try {
      setCartLoading(true)
      const { data } = await API.get('/api/cart')
      setCart(data.cart)
    } catch (err) {
      console.error('Failed to fetch cart')
    } finally {
      setCartLoading(false)
    }
  }

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await API.post('/api/cart', { productId, quantity })
      setCart(data.cart)
      toast.success('Added to cart!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart')
    }
  }

  const updateCartItem = async (productId, quantity) => {
    try {
      const { data } = await API.put(`/api/cart/${productId}`, { quantity })
      setCart(data.cart)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cart')
    }
  }

  const removeFromCart = async (productId) => {
    try {
      await API.delete(`/api/cart/${productId}`)
      setCart(prev => ({ ...prev, items: prev.items.filter(i => i.product._id !== productId) }))
      toast.success('Removed from cart')
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const clearCart = async () => {
    try {
      await API.delete('/api/cart')
      setCart({ items: [] })
    } catch (err) {
      console.error('Failed to clear cart')
    }
  }

  const cartCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const cartTotal = cart.items?.reduce((acc, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0
    return acc + price * item.quantity
  }, 0) || 0

  return (
    <CartContext.Provider value={{ cart, cartLoading, cartCount, cartTotal, addToCart, updateCartItem, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

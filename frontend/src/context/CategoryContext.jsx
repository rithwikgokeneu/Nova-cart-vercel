import { createContext, useContext, useState, useEffect } from 'react'
import API from '../api/axios'

const CategoryContext = createContext()

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([])

  const refreshCategories = async () => {
    try {
      const { data } = await API.get('/api/categories')
      setCategories(data.categories || [])
    } catch {}
  }

  useEffect(() => { refreshCategories() }, [])

  return (
    <CategoryContext.Provider value={{ categories, refreshCategories }}>
      {children}
    </CategoryContext.Provider>
  )
}

export const useCategories = () => useContext(CategoryContext)

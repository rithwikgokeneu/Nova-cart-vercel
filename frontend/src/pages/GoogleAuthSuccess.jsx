import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'
import Loader from '../components/Loader'

export default function GoogleAuthSuccess() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()

  useEffect(() => {
    const token = params.get('token')
    const role = params.get('role')
    if (!token) { navigate('/login'); return }

    localStorage.setItem('token', token)

    API.get('/api/auth/me')
      .then(({ data }) => {
        const user = data.user
        localStorage.setItem('user', JSON.stringify(user))
        updateUser(user)
        if (role === 'admin') navigate('/admin')
        else if (role === 'vendor') navigate('/vendor')
        else navigate('/')
      })
      .catch(() => {
        localStorage.removeItem('token')
        navigate('/login')
      })
  }, [])

  return <Loader />
}

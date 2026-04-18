import { Auth } from './pages/Auth'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { useState, useEffect } from 'react'

function App() {
  const [currentPage, setCurrentPage] = useState<'auth' | 'customer' | 'admin'>('auth')

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setCurrentPage(parsedUser.role === 'ADMIN' ? 'admin' : 'customer')
    }
  }, [])

  const handleLoginSuccess = (user: any) => {
    setCurrentPage(user.role === 'ADMIN' ? 'admin' : 'customer')
  }

  return (
    <>
      {currentPage === 'auth' && <Auth onLoginSuccess={handleLoginSuccess} />}
      {currentPage === 'customer' && <CustomerDashboard />}
      {currentPage === 'admin' && <AdminDashboard />}
    </>
  )
}

export default App

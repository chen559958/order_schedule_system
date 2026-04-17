import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from './lib/trpc'
import { Auth } from './pages/Auth'
import { CustomerDashboard } from './pages/CustomerDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient()
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
    }),
  ],
})

function App() {
  const [currentPage, setCurrentPage] = useState<'auth' | 'customer' | 'admin'>('auth')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setCurrentPage(parsedUser.role === 'ADMIN' ? 'admin' : 'customer')
    }
  }, [])

  const handleLoginSuccess = (userData: any) => {
    setUser(userData)
    setCurrentPage(userData.role === 'ADMIN' ? 'admin' : 'customer')
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {currentPage === 'auth' && <Auth onLoginSuccess={handleLoginSuccess} />}
        {currentPage === 'customer' && <CustomerDashboard />}
        {currentPage === 'admin' && <AdminDashboard />}
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default App

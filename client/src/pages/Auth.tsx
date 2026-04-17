import { useState } from 'react'
import { trpc } from '../lib/trpc'

interface AuthProps {
  onLoginSuccess?: (user: any) => void;
}

export function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('admin123')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const loginMutation = trpc.auth.login.useMutation()
  const registerMutation = trpc.auth.register.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const result = await loginMutation.mutateAsync({ email, password })
        localStorage.setItem('user', JSON.stringify(result))
        if (onLoginSuccess) {
          onLoginSuccess(result)
        } else {
          window.location.href = result.role === 'ADMIN' ? '/admin' : '/dashboard'
        }
      } else {
        const result = await registerMutation.mutateAsync({ email, password, name })
        localStorage.setItem('user', JSON.stringify(result))
        if (onLoginSuccess) {
          onLoginSuccess(result)
        } else {
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>{isLogin ? '登入' : '註冊'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            密碼:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>

        {!isLogin && (
          <div style={{ marginBottom: '15px' }}>
            <label>
              姓名:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </label>
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {loading ? '處理中...' : isLogin ? '登入' : '註冊'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setError('')
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {isLogin ? '尚未有帳號？點此註冊' : '已有帳號？點此登入'}
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h3>測試帳號:</h3>
        <p>管理員: admin@test.com / admin123</p>
        <p>客戶: user@test.com / user123</p>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function CustomerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    bags: 1,
    amount: 0,
    deliveryMethod: 'door-to-door-pickup',
    paymentMethod: 'cash',
    notes: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const ordersQuery = trpc.orders.listByUser.useQuery(
    user ? { userId: user.id, page: 1, limit: 10 } : undefined,
    { enabled: !!user }
  );

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      setShowOrderForm(false);
      setFormData({
        bags: 1,
        amount: 0,
        deliveryMethod: 'door-to-door-pickup',
        paymentMethod: 'cash',
        notes: '',
      });
      ordersQuery.refetch();
    },
  });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createOrderMutation.mutateAsync({
        userId: user.id,
        ...formData,
      });
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  if (!user) {
    return <div style={{ padding: '20px' }}>載入中...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>客戶儀表板</h1>
        <p>歡迎, {user.name}!</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {showOrderForm ? '取消' : '新增訂單'}
        </button>
      </div>

      {showOrderForm && (
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2>新增訂單</h2>
          <form onSubmit={handleCreateOrder}>
            <div style={{ marginBottom: '15px' }}>
              <label>
                袋數:
                <input
                  type="number"
                  min="1"
                  value={formData.bags}
                  onChange={(e) =>
                    setFormData({ ...formData, bags: parseInt(e.target.value) })
                  }
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                金額:
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) })
                  }
                  required
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                配送方式:
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, deliveryMethod: e.target.value })
                  }
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="door-to-door-pickup">上門取件</option>
                  <option value="door-to-door-return">上門送回</option>
                  <option value="self-delivery">自行送達</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                付款方式:
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="cash">現金</option>
                  <option value="credit-card">信用卡</option>
                  <option value="mobile-payment">行動支付</option>
                </select>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>
                備註:
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {createOrderMutation.isPending ? '提交中...' : '提交訂單'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h2>我的訂單</h2>
        {ordersQuery.isLoading ? (
          <p>載入中...</p>
        ) : ordersQuery.data?.orders.length === 0 ? (
          <p>尚無訂單</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>訂單日期</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>袋數</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>金額</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>配送方式</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>狀態</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.data?.orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    {new Date(order.orderDate).toLocaleDateString('zh-TW')}
                  </td>
                  <td style={{ padding: '10px' }}>{order.bags}</td>
                  <td style={{ padding: '10px' }}>${order.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>{order.deliveryMethod}</td>
                  <td style={{ padding: '10px' }}>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/';
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          登出
        </button>
      </div>
    </div>
  );
}

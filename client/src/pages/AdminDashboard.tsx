import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'members' | 'stats'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'ADMIN') {
        window.location.href = '/';
      }
      setUser(parsedUser);
    }
  }, []);

  // 今日排程
  const todaySchedulesQuery = trpc.schedules.getTodaySchedules.useQuery(undefined, {
    enabled: activeTab === 'today',
  });

  // 會員搜尋
  const membersSearchQuery = trpc.members.search.useQuery(
    { query: searchQuery, page: 1, limit: 20 },
    { enabled: activeTab === 'members' && searchQuery.length > 0 }
  );

  // 月度統計
  const statsQuery = trpc.orders.getMonthlyStats.useQuery(
    {
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      page: 1,
      limit: 20,
    },
    { enabled: activeTab === 'stats' }
  );

  if (!user) {
    return <div style={{ padding: '20px' }}>載入中...</div>;
  }

  const todaySchedules = todaySchedulesQuery.data;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1>管理員儀表板</h1>
        <p>歡迎, {user.name}!</p>
      </div>

      {/* 導航標籤 */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('today')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'today' ? '#007bff' : 'transparent',
            color: activeTab === 'today' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px',
          }}
        >
          今日排程
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'members' ? '#007bff' : 'transparent',
            color: activeTab === 'members' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px',
          }}
        >
          會員管理
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'stats' ? '#007bff' : 'transparent',
            color: activeTab === 'stats' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          訂單統計
        </button>
      </div>

      {/* 今日排程 */}
      {activeTab === 'today' && (
        <div>
          <h2>今日排程</h2>
          {todaySchedulesQuery.isLoading ? (
            <p>載入中...</p>
          ) : (
            <div>
              {/* 上門取件 */}
              <div style={{ marginBottom: '30px' }}>
                <h3>上門取件 ({todaySchedules?.['door-to-door-pickup']?.length || 0})</h3>
                {todaySchedules?.['door-to-door-pickup']?.length === 0 ? (
                  <p>無排程</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>時間</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>會員</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>袋數</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySchedules?.['door-to-door-pickup']?.map((schedule) => (
                        <tr key={schedule.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>{schedule.deliveryTime || '-'}</td>
                          <td style={{ padding: '10px' }}>{schedule.user.name}</td>
                          <td style={{ padding: '10px' }}>{schedule.order.bags}</td>
                          <td style={{ padding: '10px' }}>
                            {schedule.isCompleted ? '已完成' : '待處理'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 上門送回 */}
              <div style={{ marginBottom: '30px' }}>
                <h3>上門送回 ({todaySchedules?.['door-to-door-return']?.length || 0})</h3>
                {todaySchedules?.['door-to-door-return']?.length === 0 ? (
                  <p>無排程</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>時間</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>會員</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>袋數</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySchedules?.['door-to-door-return']?.map((schedule) => (
                        <tr key={schedule.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>{schedule.deliveryTime || '-'}</td>
                          <td style={{ padding: '10px' }}>{schedule.user.name}</td>
                          <td style={{ padding: '10px' }}>{schedule.order.bags}</td>
                          <td style={{ padding: '10px' }}>
                            {schedule.isCompleted ? '已完成' : '待處理'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 自行送達 */}
              <div>
                <h3>自行送達 ({todaySchedules?.['self-delivery']?.length || 0})</h3>
                {todaySchedules?.['self-delivery']?.length === 0 ? (
                  <p>無排程</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>時間</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>會員</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>袋數</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySchedules?.['self-delivery']?.map((schedule) => (
                        <tr key={schedule.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px' }}>{schedule.deliveryTime || '-'}</td>
                          <td style={{ padding: '10px' }}>{schedule.user.name}</td>
                          <td style={{ padding: '10px' }}>{schedule.order.bags}</td>
                          <td style={{ padding: '10px' }}>
                            {schedule.isCompleted ? '已完成' : '待處理'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 會員管理 */}
      {activeTab === 'members' && (
        <div>
          <h2>會員管理</h2>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="搜尋會員名稱或郵箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          {membersSearchQuery.isLoading ? (
            <p>搜尋中...</p>
          ) : membersSearchQuery.data?.users.length === 0 ? (
            <p>無搜尋結果</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>姓名</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>郵箱</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>加入日期</th>
                </tr>
              </thead>
              <tbody>
                {membersSearchQuery.data?.users.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{member.name}</td>
                    <td style={{ padding: '10px' }}>{member.email}</td>
                    <td style={{ padding: '10px' }}>
                      {new Date(member.createdAt).toLocaleDateString('zh-TW')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 訂單統計 */}
      {activeTab === 'stats' && (
        <div>
          <h2>訂單統計</h2>
          <div style={{ marginBottom: '20px' }}>
            <label>
              選擇月份:
              <input
                type="month"
                value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1));
                }}
                style={{ marginLeft: '10px', padding: '5px' }}
              />
            </label>
          </div>

          {statsQuery.isLoading ? (
            <p>載入中...</p>
          ) : (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                  marginBottom: '30px',
                }}
              >
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px' }}>
                  <h3>總訂單數</h3>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statsQuery.data?.total}</p>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px' }}>
                  <h3>總金額</h3>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    ${statsQuery.data?.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '4px' }}>
                  <h3>總袋數</h3>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statsQuery.data?.totalBags}</p>
                </div>
              </div>

              <h3>訂單明細</h3>
              {statsQuery.data?.orders.length === 0 ? (
                <p>本月無訂單</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>日期</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>會員</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>袋數</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>金額</th>
                      <th style={{ padding: '10px', textAlign: 'left' }}>配送方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsQuery.data?.orders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>
                          {new Date(order.orderDate).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '10px' }}>{order.user.name}</td>
                        <td style={{ padding: '10px' }}>{order.bags}</td>
                        <td style={{ padding: '10px' }}>${order.amount.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{order.deliveryMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

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

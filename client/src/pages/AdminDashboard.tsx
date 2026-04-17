import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Schedule {
  id: string;
  userId: string;
  orderId: string;
  scheduleDate: string;
  deliveryTime?: string;
  deliveryType: string;
  isCompleted: boolean;
}

interface Member {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  orderDate: string;
  bags: number;
  amount: number;
  deliveryMethod: string;
  paymentMethod: string;
  status: string;
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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('today')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'today'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Today's Schedule
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Today's Schedule Tab */}
            {activeTab === 'today' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                {todaySchedulesQuery.isLoading ? (
                  <p>Loading...</p>
                ) : todaySchedulesQuery.data ? (
                  <div className="space-y-4">
                    {Object.entries(todaySchedulesQuery.data).map(([type, schedules]: [string, any]) => (
                      <div key={type}>
                        <h3 className="font-semibold text-gray-700 mb-2">{type}</h3>
                        {schedules.length > 0 ? (
                          <ul className="space-y-2">
                            {schedules.map((schedule: Schedule) => (
                              <li key={schedule.id} className="bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-600">
                                  {schedule.user?.name || 'Unknown'} - {schedule.deliveryTime || 'No time set'}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-sm">No schedules</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No data</p>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Search Members</h2>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                />
                {membersSearchQuery.isLoading ? (
                  <p>Loading...</p>
                ) : membersSearchQuery.data?.users ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {membersSearchQuery.data.users.map((member: Member) => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.name || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">Search for members</p>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Monthly Statistics</h2>
                <div className="mb-4">
                  <input
                    type="month"
                    value={`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`}
                    onChange={(e) => {
                      const [year, month] = e.target.value.split('-');
                      setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1));
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {statsQuery.isLoading ? (
                  <p>Loading...</p>
                ) : statsQuery.data ? (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="text-gray-600 text-sm">Total Amount</p>
                      <p className="text-2xl font-bold text-blue-600">${statsQuery.data.totalAmount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <p className="text-gray-600 text-sm">Total Bags</p>
                      <p className="text-2xl font-bold text-green-600">{statsQuery.data.totalBags}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

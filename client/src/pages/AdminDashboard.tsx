import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'members' | 'stats'>('today');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadTodaySchedules();
      loadMonthlyStats();
    }
  }, []);

  const loadTodaySchedules = async () => {
    try {
      setLoading(true);
      const data = await api.schedules.getTodaySchedules();
      setSchedules(data || []);
    } catch (err) {
      console.error('Failed to load schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const data = await api.orders.getMonthlyStats(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const data = await api.members.search(searchQuery);
      setMembers(data.users || []);
    } catch (err) {
      console.error('Failed to search members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'members'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-300'
            }`}
          >
            Monthly Stats
          </button>
        </div>

        {activeTab === 'today' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Today's Schedules</h2>
            {loading ? (
              <div>Loading...</div>
            ) : schedules && schedules.length > 0 ? (
              <div className="space-y-4">
                {schedules.map((schedule: any) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold">{schedule.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">Time: {schedule.deliveryTime || 'Not set'}</p>
                    <p className="text-sm text-gray-600">Type: {schedule.deliveryType}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No schedules for today</p>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Search Members</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {members && members.length > 0 ? (
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
                    {members.map((member: any) => (
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
              <p className="text-gray-500">No members found</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Monthly Statistics</h2>
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => {
                  const prev = new Date(currentMonth);
                  prev.setMonth(prev.getMonth() - 1);
                  setCurrentMonth(prev);
                  loadMonthlyStats();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                ← Previous
              </button>
              <span className="px-3 py-1">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const next = new Date(currentMonth);
                  next.setMonth(next.getMonth() + 1);
                  setCurrentMonth(next);
                  loadMonthlyStats();
                }}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                Next →
              </button>
            </div>
            {stats ? (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalOrders || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">${stats.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Bags</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalBags || 0}</p>
                  </div>
                </div>
                {stats.orders && stats.orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bags</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.orders.map((order: any) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(order.orderDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.user?.name || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.bags}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No orders this month</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading statistics...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

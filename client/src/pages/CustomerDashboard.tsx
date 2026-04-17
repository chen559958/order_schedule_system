import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
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
  notes?: string;
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

    await createOrderMutation.mutateAsync({
      userId: user.id,
      bags: formData.bags,
      amount: formData.amount,
      deliveryMethod: formData.deliveryMethod,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
    });
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">Welcome, {user.name || user.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setShowOrderForm(!showOrderForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showOrderForm ? 'Cancel' : 'Create New Order'}
          </button>
        </div>

        {showOrderForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Bags</label>
                <input
                  type="number"
                  min="1"
                  value={formData.bags}
                  onChange={(e) => setFormData({ ...formData, bags: parseInt(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Method</label>
                <select
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="door-to-door-pickup">Door-to-Door Pickup</option>
                  <option value="door-to-door-return">Door-to-Door Return</option>
                  <option value="self-delivery">Self Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={createOrderMutation.isPending}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Your Orders</h2>
          </div>
          {ordersQuery.isLoading ? (
            <div className="p-6">Loading...</div>
          ) : ordersQuery.data?.orders && ordersQuery.data.orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bags</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordersQuery.data.orders.map((order: Order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.bags}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.deliveryMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">No orders yet. Create your first order!</div>
          )}
        </div>
      </div>
    </div>
  );
}

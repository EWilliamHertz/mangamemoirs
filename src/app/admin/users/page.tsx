'use client';

import { useState } from 'react';
import { searchUsers, getUserDetails, topUpUserCredits } from '../../actions/adminActions';

interface User {
  id: string;
  email: string;
  credits: number;
  total_credits_earned: number;
  created_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface UserDetail {
  user: User;
  transactions: Transaction[];
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Top-up form
  const [topUpAmount, setTopUpAmount] = useState(10);
  const [topUpReason, setTopUpReason] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSelectedUser(null);

    try {
      const data = await searchUsers(searchQuery);
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: User) => {
    setLoading(true);
    setError('');

    try {
      const details = await getUserDetails(user.id);
      setSelectedUser(details);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setTopUpLoading(true);
    setError('');

    try {
      await topUpUserCredits(selectedUser.user.id, topUpAmount, topUpReason);

      // Refresh user details
      const details = await getUserDetails(selectedUser.user.id);
      setSelectedUser(details);

      // Reset form
      setTopUpAmount(10);
      setTopUpReason('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Search Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
        <h2 className="text-2xl font-bold mb-6">Search Users</h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <input
            type="email"
            placeholder="Enter email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
          />

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-4 py-2 rounded font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="w-full text-left bg-slate-700 hover:bg-slate-600 p-3 rounded transition"
            >
              <div className="font-medium">{user.email}</div>
              <div className="text-sm text-slate-400">
                {user.credits} credits • Earned: {user.total_credits_earned}
              </div>
            </button>
          ))}
        </div>

        {users.length === 0 && searchQuery && !loading && (
          <div className="text-center py-8 text-slate-400">No users found</div>
        )}
      </div>

      {/* User Details & Top-Up Section */}
      {selectedUser ? (
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">User Details</h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-400">Email</div>
                <div className="font-medium">{selectedUser.user.email}</div>
              </div>

              <div>
                <div className="text-slate-400">Current Credits</div>
                <div className="text-2xl font-bold text-blue-400">{selectedUser.user.credits}</div>
              </div>

              <div>
                <div className="text-slate-400">Total Earned</div>
                <div className="font-medium">{selectedUser.user.total_credits_earned}</div>
              </div>

              <div>
                <div className="text-slate-400">Joined</div>
                <div className="font-medium">
                  {new Date(selectedUser.user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Top-Up Form */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Add Credits</h3>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <input
                  type="text"
                  placeholder="e.g., Bug compensation, promo..."
                  value={topUpReason}
                  onChange={(e) => setTopUpReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400"
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={topUpLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 px-4 py-2 rounded font-medium"
              >
                {topUpLoading ? 'Adding...' : 'Add Credits'}
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-xl font-bold mb-4">Transaction History</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedUser.transactions.map((tx) => (
                <div key={tx.id} className="bg-slate-700 p-3 rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium capitalize">{tx.type}</span>
                    <span className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">{tx.description}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {selectedUser.transactions.length === 0 && (
              <div className="text-center py-8 text-slate-400">No transactions yet</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
          <div className="text-center py-12 text-slate-400">
            Select a user to view details and manage credits
          </div>
        </div>
      )}
    </div>
  );
}

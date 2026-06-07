'use client';

import { useState, useEffect } from 'react';
import { searchUsers, getAdmins, makeUserAdmin, removeAdminStatus } from '../../actions/adminActions';

interface Admin {
  id: string;
  role: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  credits: number;
  total_credits_earned: number;
  created_at: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await searchUsers(searchQuery);
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    setLoading(true);
    setError('');

    try {
      await makeUserAdmin(userId);
      await loadAdmins();
      setUsers([]);
      setSearchQuery('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Remove admin status from this user?')) return;

    setLoading(true);
    setError('');

    try {
      await removeAdminStatus(userId);
      await loadAdmins();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = (userId: string) => admins.some((a) => a.id === userId);

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Search Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
        <h2 className="text-2xl font-bold mb-6">Add Admin</h2>

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
            <div
              key={user.id}
              className="flex items-center justify-between bg-slate-700 p-3 rounded"
            >
              <div className="flex-1">
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-slate-400">
                  {isAdmin(user.id) ? 'Admin' : 'User'}
                </div>
              </div>

              <button
                onClick={() => handleMakeAdmin(user.id)}
                disabled={isAdmin(user.id) || loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm"
              >
                {isAdmin(user.id) ? 'Already Admin' : 'Make Admin'}
              </button>
            </div>
          ))}
        </div>

        {users.length === 0 && searchQuery && !loading && (
          <div className="text-center py-8 text-slate-400">No users found</div>
        )}
      </div>

      {/* Admins List */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
        <h2 className="text-2xl font-bold mb-6">Current Admins</h2>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between bg-slate-700 p-3 rounded">
              <div>
                <div className="font-medium">{admin.id}</div>
                <div className="text-sm text-slate-400">
                  Added {new Date(admin.created_at).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => handleRemoveAdmin(admin.id)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 px-3 py-1 rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {admins.length === 0 && (
          <div className="text-center py-8 text-slate-400">No admins</div>
        )}
      </div>
    </div>
  );
}

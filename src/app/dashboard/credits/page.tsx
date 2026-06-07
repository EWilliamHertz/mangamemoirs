'use client';

import { useState, useEffect } from 'react';
import { redeemVoucher } from '../../actions/adminActions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  credits: number;
  total_credits_earned: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get user credits
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setError('Not authenticated');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits, total_credits_earned')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Get transactions
      const { data: txData, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) throw txError;
      setTransactions(txData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    setRedeemLoading(true);
    setRedeemError('');
    setRedeemSuccess(false);

    try {
      const result = await redeemVoucher(voucherCode);
      setRedeemSuccess(true);
      setVoucherCode('');

      // Reload data
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setRedeemError((err as Error).message);
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Credits Summary */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
          <div className="text-slate-300 mb-2">Current Credits</div>
          <div className="text-4xl font-bold text-blue-300">{user?.credits || 0}</div>
          <div className="text-sm text-slate-400 mt-2">
            Total earned: {user?.total_credits_earned || 0}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-6 border border-slate-700">
          <div className="text-slate-300 mb-2">How to Use Credits</div>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>🎨 Manga panel: 3 credits</li>
            <li>🎬 Anime clip (5s): 2 credits</li>
            <li>🎥 Longer clips: +2 per 5s</li>
          </ul>
        </div>
      </div>

      {/* Redeem Voucher */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4">Redeem Voucher Code</h2>

        <form onSubmit={handleRedeemVoucher} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter voucher code..."
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 uppercase"
            />
          </div>

          {redeemError && <div className="text-red-400 text-sm">{redeemError}</div>}
          {redeemSuccess && (
            <div className="text-green-400 text-sm">✓ Voucher redeemed successfully!</div>
          )}

          <button
            type="submit"
            disabled={redeemLoading || !voucherCode.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded font-medium"
          >
            {redeemLoading ? 'Redeeming...' : 'Redeem'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-slate-900 rounded text-sm text-slate-400">
          💡 Tip: Admins can generate voucher codes in the admin panel. Share the code to get
          free credits!
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Credit History</h2>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-slate-700 p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium capitalize">{tx.type.replace('_', ' ')}</div>
                <div className={tx.amount > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </div>
              </div>
              <div className="text-sm text-slate-400">{tx.description}</div>
              <div className="text-xs text-slate-500 mt-2">
                {new Date(tx.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-slate-400">No transactions yet</div>
        )}
      </div>
    </div>
  );
}

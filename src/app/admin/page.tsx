'use client';

import { useState } from 'react';
import { generateVoucher, getVouchers } from '../actions/adminActions';
import { useEffect } from 'react';

interface Voucher {
  id: string;
  code: string;
  credits: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [credits, setCredits] = useState(10);
  const [maxUses, setMaxUses] = useState(1);
  const [expiryDays, setExpiryDays] = useState(30);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleGenerateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const newVoucher = await generateVoucher(credits, maxUses, expiryDate);
      setVouchers([newVoucher, ...vouchers]);

      // Reset form
      setCredits(10);
      setMaxUses(1);
      setExpiryDays(30);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Generate Voucher Section */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Generate Voucher</h2>

        <form onSubmit={handleGenerateVoucher} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Credits</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Uses</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expires In (days)</label>
              <input
                type="number"
                min="1"
                max="3650"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 px-6 py-2 rounded font-medium"
          >
            {loading ? 'Generating...' : 'Generate Voucher'}
          </button>
        </form>
      </div>

      {/* Vouchers List */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Active Vouchers</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr>
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-right py-3 px-4">Credits</th>
                <th className="text-right py-3 px-4">Used / Max</th>
                <th className="text-right py-3 px-4">Expires</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => {
                const expiresDate = voucher.expires_at ? new Date(voucher.expires_at) : null;
                const isExpired = expiresDate && expiresDate < new Date();

                return (
                  <tr
                    key={voucher.id}
                    className="border-b border-slate-700 hover:bg-slate-700 transition"
                  >
                    <td className="py-3 px-4">
                      <code className="bg-slate-900 px-2 py-1 rounded font-mono">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="text-right py-3 px-4">{voucher.credits}</td>
                    <td className="text-right py-3 px-4">
                      {voucher.used_count} / {voucher.max_uses}
                      {voucher.used_count >= voucher.max_uses && (
                        <span className="ml-2 text-yellow-500">FULL</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      {isExpired ? (
                        <span className="text-red-400">Expired</span>
                      ) : expiresDate ? (
                        expiresDate.toLocaleDateString()
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => copyToClipboard(voucher.code)}
                        className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"
                      >
                        {copied === voucher.code ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {vouchers.length === 0 && (
          <div className="text-center py-8 text-slate-400">No vouchers created yet</div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User, Mail, Bell, Lock, Palette, Download, Trash2, LogOut, Settings as SettingsIcon,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    email_on_generation: true,
    email_on_share: true,
    email_on_comment: true,
  });

  useEffect(() => {
    loadUserProfile();
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(userProfile)
        .eq('id', user.id);

      if (error) throw error;
      alert('✓ Profile saved successfully!');
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      const { data: gallery } = await supabase
        .from('user_gallery')
        .select('*')
        .eq('user_id', user?.id);

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id);

      const dataStr = JSON.stringify(
        { gallery, projects, profile: userProfile },
        null,
        2
      );

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ouriye-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) {
      alert('Failed to download data');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('⚠️ This will permanently delete your account and all data. Are you sure?')) {
      return;
    }

    if (!confirm('🔥 Last chance. This cannot be undone.')) {
      return;
    }

    try {
      // Delete all user data
      await supabase.from('user_gallery').delete().eq('user_id', user?.id);
      await supabase.from('projects').delete().eq('user_id', user?.id);
      await supabase.from('credit_transactions').delete().eq('user_id', user?.id);
      await supabase.from('users').delete().eq('id', user?.id);

      // Sign out and redirect
      await signOut();
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-white" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Account Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Account</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Email</Label>
            <Input
              type="email"
              value={user?.emailAddresses[0]?.emailAddress || ''}
              disabled
              className="bg-slate-700 border-slate-600 text-gray-300"
            />
            <p className="text-xs text-gray-500 mt-2">
              Email is managed by Clerk. You cannot change it here.
            </p>
          </div>

          <div>
            <Label className="text-white mb-2 block">Username</Label>
            <Input
              type="text"
              value={userProfile?.username || user?.username || ''}
              onChange={(e) =>
                setUserProfile({ ...userProfile, username: e.target.value })
              }
              placeholder="Your display name"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            {saving ? '⏳ Saving...' : '✓ Save Profile'}
          </button>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              key: 'email_on_generation',
              label: 'Email when generation completes',
            },
            {
              key: 'email_on_share',
              label: 'Email when someone shares my work',
            },
            {
              key: 'email_on_comment',
              label: 'Email on new comments',
            },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifications[key as keyof typeof notifications]}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    [key]: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-white text-sm">{label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Appearance Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Appearance</h2>
        </div>
        <p className="text-sm text-gray-400">
          Coming soon: Light mode, custom color schemes, font size adjustment
        </p>
      </section>

      {/* Privacy & Data Section */}
      <section className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Privacy & Data</h2>
        </div>

        <button
          onClick={handleDownloadData}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Download My Data
        </button>

        <p className="text-xs text-gray-400">
          Download all your projects, gallery items, and profile data as JSON
        </p>
      </section>

      {/* Danger Zone */}
      <section className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl p-6 border border-red-700/30 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-red-400" />
          <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
        </div>

        <button
          onClick={handleDeleteAccount}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
        >
          🔥 Delete Account
        </button>

        <p className="text-xs text-red-300">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
      </section>

      {/* Sign Out */}
      <button
        onClick={() => signOut()}
        className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-all"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  );
}

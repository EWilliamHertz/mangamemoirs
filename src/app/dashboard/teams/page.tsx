'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import { Users, Plus, Mail, MoreVertical } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Team {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  avatar_url?: string;
  members_count?: number;
  role?: string;
}

export default function TeamsPage() {
  const { user } = useUser();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [user?.id]);

  const loadTeams = async () => {
    if (!user?.id) return;

    try {
      // Get teams where user is owner
      const { data: ownerTeams } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id);

      // Get teams where user is member
      const { data: memberTeams } = await supabase
        .from('team_members')
        .select('teams(*)')
        .eq('user_id', user.id);

      const allTeams = [
        ...(ownerTeams || []).map((t) => ({ ...t, role: 'owner' })),
        ...(memberTeams || []).map((m: any) => ({ ...m.teams, role: 'member' })),
      ];

      setTeams(allTeams as Team[]);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newTeamName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName,
          description: newTeamDesc,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTeams([...teams, { ...data, role: 'owner' }]);
      setNewTeamName('');
      setNewTeamDesc('');
      setShowCreateModal(false);
      alert('✓ Team created successfully!');
    } catch (err) {
      alert('Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-white">Loading teams...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Teams & Collaboration</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-plasma hover:bg-plasma/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold text-white">Create New Team</h2>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g., Manga Collective"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-white text-sm font-semibold mb-2 block">
                  Description (Optional)
                </label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="What's this team working on?"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-400 h-20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-plasma hover:bg-plasma/90 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-12 border border-slate-700 text-center space-y-4">
          <Users className="w-16 h-16 mx-auto text-gray-600" />
          <h2 className="text-xl font-bold text-white">No teams yet</h2>
          <p className="text-gray-400">
            Create a team to collaborate with others on manga and anime projects
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-plasma hover:bg-plasma/90 text-white px-6 py-2 rounded-lg font-medium transition-all mx-auto"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-plasma/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-plasma transition-colors">
                    {team.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {team.role === 'owner' ? '👑 Owner' : '👤 Member'}
                  </p>
                </div>
                <button className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {team.description && (
                <p className="text-sm text-gray-300 mb-4">{team.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-xs text-gray-400">
                  Members: {team.members_count || 1}
                </span>
                <button className="text-plasma hover:text-plasma/80 text-sm font-semibold flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6 space-y-3">
        <h3 className="font-bold text-white flex items-center gap-2">
          💡 Teams Features
        </h3>
        <ul className="text-sm text-blue-100 space-y-2">
          <li>✓ Share projects and collaborate in real-time</li>
          <li>✓ Assign roles (Owner, Editor, Viewer)</li>
          <li>✓ Combined credit pool for the team</li>
          <li>✓ Invite team members via email</li>
          <li>✓ Publish team projects to community</li>
        </ul>
      </div>
    </div>
  );
}

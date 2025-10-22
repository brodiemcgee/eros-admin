import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPhotos: 0,
    activeSubscriptions: 0,
    recentActions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [users, photos, subscriptions, actions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('photo_moderation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('moderation_actions')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalUsers: users.count || 0,
        pendingPhotos: photos.count || 0,
        activeSubscriptions: subscriptions.count || 0,
        recentActions: actions.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500' },
    { label: 'Pending Photos', value: stats.pendingPhotos, icon: '🖼️', color: 'bg-yellow-500' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptions, icon: '💳', color: 'bg-green-500' },
    { label: 'Actions (24h)', value: stats.recentActions, icon: '⚡', color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/photos"
              className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <div className="font-medium text-gray-900">Review Photos</div>
                  <div className="text-sm text-gray-600">{stats.pendingPhotos} pending</div>
                </div>
              </div>
            </a>
            <a
              href="/compliance"
              className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚖️</span>
                <div>
                  <div className="font-medium text-gray-900">Compliance Requests</div>
                  <div className="text-sm text-gray-600">Age verification & GDPR</div>
                </div>
              </div>
            </a>
            <a
              href="/users"
              className="block px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-medium text-gray-900">Manage Users</div>
                  <div className="text-sm text-gray-600">{stats.totalUsers} total users</div>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authentication</span>
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Storage</span>
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

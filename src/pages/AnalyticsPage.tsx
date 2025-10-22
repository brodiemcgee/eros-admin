import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState({
    pendingPhotos: 0,
    approvedPhotos: 0,
    rejectedPhotos: 0,
    totalFlags: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      await Promise.all([
        loadUserGrowth(),
        loadRevenueData(),
        loadSubscriptionBreakdown(),
        loadModerationStats(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGrowth = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const growthByDay: { [key: string]: number } = {};
      data?.forEach((user) => {
        const date = new Date(user.created_at).toLocaleDateString();
        growthByDay[date] = (growthByDay[date] || 0) + 1;
      });

      const sortedDates = Object.keys(growthByDay).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      let cumulative = 0;
      const growthData = sortedDates.slice(-30).map((date) => {
        cumulative += growthByDay[date];
        return {
          date: date,
          users: cumulative,
          newUsers: growthByDay[date],
        };
      });

      setUserGrowth(growthData);
    } catch (error) {
      console.error('Error loading user growth:', error);
    }
  };

  const loadRevenueData = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('amount, currency, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const revenueByDay: { [key: string]: number } = {};
      data?.forEach((transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        revenueByDay[date] = (revenueByDay[date] || 0) + transaction.amount / 100;
      });

      const sortedDates = Object.keys(revenueByDay).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const revenueData = sortedDates.slice(-30).map((date) => ({
        date: date,
        revenue: revenueByDay[date],
      }));

      setRevenueData(revenueData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    }
  };

  const loadSubscriptionBreakdown = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          subscription_plans (name)
        `)
        .eq('status', 'active');

      if (error) throw error;

      const breakdown: { [key: string]: number } = {};
      data?.forEach((sub: any) => {
        const planName = sub.subscription_plans?.name || 'Unknown';
        breakdown[planName] = (breakdown[planName] || 0) + 1;
      });

      const breakdownData = Object.keys(breakdown).map((name) => ({
        name,
        value: breakdown[name],
      }));

      setSubscriptionBreakdown(breakdownData);
    } catch (error) {
      console.error('Error loading subscription breakdown:', error);
    }
  };

  const loadModerationStats = async () => {
    try {
      const [pendingPhotos, approvedPhotos, rejectedPhotos, totalFlags] = await Promise.all([
        supabase
          .from('photo_moderation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('photo_moderation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('photo_moderation_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'rejected'),
        supabase.from('content_flags').select('id', { count: 'exact', head: true }),
      ]);

      setModerationStats({
        pendingPhotos: pendingPhotos.count || 0,
        approvedPhotos: approvedPhotos.count || 0,
        rejectedPhotos: rejectedPhotos.count || 0,
        totalFlags: totalFlags.count || 0,
      });
    } catch (error) {
      console.error('Error loading moderation stats:', error);
    }
  };

  const COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Pending Photos</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {moderationStats.pendingPhotos}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Approved Photos</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {moderationStats.approvedPhotos}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Rejected Photos</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {moderationStats.rejectedPhotos}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Flags</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {moderationStats.totalFlags}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Growth (Last 30 Days)</h2>
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  name="Total Users"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No user data available</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">No revenue data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Subscription Breakdown
          </h2>
          {subscriptionBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionBreakdown.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No active subscriptions available
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Moderation Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Photo Approval Rate</span>
              <span className="font-semibold text-gray-900">
                {moderationStats.approvedPhotos + moderationStats.rejectedPhotos > 0
                  ? (
                      (moderationStats.approvedPhotos /
                        (moderationStats.approvedPhotos + moderationStats.rejectedPhotos)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Photos Reviewed</span>
              <span className="font-semibold text-gray-900">
                {moderationStats.approvedPhotos + moderationStats.rejectedPhotos}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Review</span>
              <span className="font-semibold text-yellow-600">
                {moderationStats.pendingPhotos}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Content Flags</span>
              <span className="font-semibold text-purple-600">{moderationStats.totalFlags}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

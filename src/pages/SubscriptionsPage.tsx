import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SubscriptionPlan, UserSubscription } from '../types/database';
import toast from 'react-hot-toast';

export const SubscriptionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('subscriptions');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'plans') {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price_amount', { ascending: true });

        if (error) throw error;
        setPlans(data || []);
      } else {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            profiles!user_subscriptions_user_id_fkey (display_name, email),
            subscription_plans (name, price_amount, currency)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlanActive = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Subscription cancelled');
      loadData();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Failed to cancel subscription');
    }
  };

  const handleRefundSubscription = async (subscriptionId: string) => {
    const refundReason = prompt('Enter refund reason:');
    if (!refundReason) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: refundReason,
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Subscription refunded');
      loadData();
    } catch (error: any) {
      console.error('Error refunding subscription:', error);
      toast.error(error.message || 'Failed to refund subscription');
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub: any) =>
    sub.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading subscriptions...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'subscriptions'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            User Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'plans'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Subscription Plans
          </button>
        </div>
      </div>

      {activeTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-primary">
                  ${(plan.price_amount / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {plan.duration_days} days
                </div>
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Features:</div>
                  <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-green-500">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePlanActive(plan.id, plan.is_active)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    plan.is_active
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {plan.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {sub.profiles?.display_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{sub.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sub.subscription_plans?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sub.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : sub.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : sub.status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(sub.start_date).toLocaleDateString()}</div>
                      <div className="text-xs">to {new Date(sub.end_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${((sub.subscription_plans?.price_amount || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {sub.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleRefundSubscription(sub.id)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Refund
                          </button>
                        </>
                      )}
                      {sub.status === 'cancelled' && (
                        <span className="text-gray-400">Cancelled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12 text-gray-500">No subscriptions found</div>
          )}
        </div>
      )}
    </div>
  );
};

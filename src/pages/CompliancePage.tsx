import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AgeVerificationRequest, GdprRequest, ContentFlag } from '../types/database';
import toast from 'react-hot-toast';

export const CompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'age_verification' | 'gdpr' | 'content_flags'>(
    'age_verification'
  );
  const [ageVerifications, setAgeVerifications] = useState<AgeVerificationRequest[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GdprRequest[]>([]);
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'age_verification') {
        const { data, error } = await supabase
          .from('age_verification_requests')
          .select(`
            *,
            profiles!age_verification_requests_user_id_fkey (display_name, email)
          `)
          .order('submitted_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setAgeVerifications(data || []);
      } else if (activeTab === 'gdpr') {
        const { data, error } = await supabase
          .from('gdpr_requests')
          .select(`
            *,
            profiles!gdpr_requests_user_id_fkey (display_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setGdprRequests(data || []);
      } else if (activeTab === 'content_flags') {
        const { data, error } = await supabase
          .from('content_flags')
          .select(`
            *,
            reporter:profiles!content_flags_reported_by_fkey (display_name, email),
            target_user:profiles!content_flags_target_user_id_fkey (display_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setContentFlags(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeVerificationDecision = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    const rejectionReason =
      decision === 'rejected' ? prompt('Enter rejection reason:') : null;
    if (decision === 'rejected' && !rejectionReason) return;

    try {
      const { error } = await supabase
        .from('age_verification_requests')
        .update({
          status: decision,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`Age verification ${decision}`);
      loadData();
    } catch (error: any) {
      console.error('Error updating age verification:', error);
      toast.error(error.message || 'Failed to update age verification');
    }
  };

  const handleGdprRequest = async (requestId: string, action: 'completed' | 'rejected') => {
    const notes = prompt(`Enter notes for ${action} request:`);
    if (!notes) return;

    try {
      const updateData: any = {
        status: action === 'completed' ? 'completed' : 'rejected',
        completed_at: new Date().toISOString(),
        admin_notes: notes,
      };

      const { error } = await supabase
        .from('gdpr_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`GDPR request ${action}`);
      loadData();
    } catch (error: any) {
      console.error('Error updating GDPR request:', error);
      toast.error(error.message || 'Failed to update GDPR request');
    }
  };

  const handleContentFlag = async (flagId: string, action: 'resolved' | 'dismissed') => {
    const resolution = prompt(`Enter resolution notes:`);
    if (!resolution) return;

    try {
      const { error } = await supabase
        .from('content_flags')
        .update({
          status: action,
          resolved_at: new Date().toISOString(),
          resolution: resolution,
        })
        .eq('id', flagId);

      if (error) throw error;
      toast.success(`Content flag ${action}`);
      loadData();
    } catch (error: any) {
      console.error('Error updating content flag:', error);
      toast.error(error.message || 'Failed to update content flag');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading compliance data...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compliance Tools</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('age_verification')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'age_verification'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Age Verification
          </button>
          <button
            onClick={() => setActiveTab('gdpr')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'gdpr'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            GDPR Requests
          </button>
          <button
            onClick={() => setActiveTab('content_flags')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'content_flags'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Content Flags
          </button>
        </div>
      </div>

      {activeTab === 'age_verification' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ageVerifications.map((req: any) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {req.profiles?.display_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{req.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{req.verification_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAgeVerificationDecision(req.id, 'approved')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAgeVerificationDecision(req.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ageVerifications.length === 0 && (
            <div className="text-center py-12 text-gray-500">No age verification requests</div>
          )}
        </div>
      )}

      {activeTab === 'gdpr' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gdprRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {req.profiles?.display_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{req.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{req.request_type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : req.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleGdprRequest(req.id, 'completed')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleGdprRequest(req.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {gdprRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">No GDPR requests</div>
          )}
        </div>
      )}

      {activeTab === 'content_flags' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flag Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentFlags.map((flag: any) => (
                  <tr key={flag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {flag.reporter?.display_name || 'Anonymous'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {flag.target_user?.display_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{flag.target_user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{flag.flag_type}</div>
                      {flag.description && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {flag.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          flag.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : flag.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(flag.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {flag.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleContentFlag(flag.id, 'resolved')}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleContentFlag(flag.id, 'dismissed')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contentFlags.length === 0 && (
            <div className="text-center py-12 text-gray-500">No content flags</div>
          )}
        </div>
      )}
    </div>
  );
};

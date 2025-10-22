import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PhotoModerationQueue } from '../types/database';
import toast from 'react-hot-toast';

export const PhotoModerationPage: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoModerationQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadPhotos();
  }, [filter]);

  const loadPhotos = async () => {
    try {
      let query = supabase
        .from('photo_moderation_queue')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      toast.error('Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photo_moderation_queue')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', photoId);

      if (error) throw error;
      toast.success('Photo approved');
      loadPhotos();
    } catch (error) {
      console.error('Error approving photo:', error);
      toast.error('Failed to approve photo');
    }
  };

  const handleReject = async (photoId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('photo_moderation_queue')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', photoId);

      if (error) throw error;
      toast.success('Photo rejected');
      loadPhotos();
    } catch (error) {
      console.error('Error rejecting photo:', error);
      toast.error('Failed to reject photo');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading photos...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Photo Moderation</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending ({photos.filter((p) => p.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600">No photos pending review</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <span className="text-6xl">🖼️</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      photo.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : photo.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {photo.status}
                  </span>
                  {photo.ai_moderation_score && (
                    <span className="text-xs text-gray-600">
                      AI Score: {photo.ai_moderation_score.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  Submitted: {new Date(photo.submitted_at).toLocaleString()}
                </div>
                {photo.ai_flags && photo.ai_flags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">AI Flags:</div>
                    <div className="flex flex-wrap gap-1">
                      {photo.ai_flags.map((flag, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {photo.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(photo.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(photo.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

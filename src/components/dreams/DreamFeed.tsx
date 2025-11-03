import { useState, useEffect } from 'react';
import { supabase, Dream } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DreamCard } from './DreamCard';
import { Loader2 } from 'lucide-react';

export const DreamFeed = () => {
  const { user } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following' | 'mine'>('all');

  useEffect(() => {
    loadDreams();
  }, [filter, user?.id]);

  const loadDreams = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('dreams')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (filter === 'mine' && user) {
        query = query.eq('user_id', user.id);
      } else if (filter === 'following' && user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = follows?.map((f) => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          setDreams([]);
          setLoading(false);
          return;
        }
      } else {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDreams(data as Dream[]);
    } catch (error) {
      console.error('Error loading dreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    loadDreams();
  };

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Dreams
          </button>
          {user && (
            <>
              <button
                onClick={() => setFilter('following')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  filter === 'following'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  filter === 'mine'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Dreams
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : dreams.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">
            {filter === 'mine'
              ? 'You haven\'t shared any dreams yet.'
              : filter === 'following'
              ? 'You\'re not following anyone yet.'
              : 'No dreams to display yet.'}
          </p>
        </div>
      ) : (
        dreams.map((dream) => <DreamCard key={dream.id} dream={dream} onDelete={handleDelete} />)
      )}
    </div>
  );
};

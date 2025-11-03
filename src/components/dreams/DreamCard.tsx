import { useState, useEffect } from 'react';
import { supabase, Dream, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, MessageCircle, Share2, Flag, MoreHorizontal, Lock, Trash2 } from 'lucide-react';

type DreamCardProps = {
  dream: Dream;
  onDelete?: () => void;
};

export const DreamCard = ({ dream, onDelete }: DreamCardProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    loadDreamData();
  }, [dream.id, user?.id]);

  const loadDreamData = async () => {
    if (dream.profiles) {
      setProfile(dream.profiles);
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', dream.user_id)
        .maybeSingle();
      if (data) setProfile(data);
    }

    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dream.id);
    setLikesCount(likesCount || 0);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('dream_id', dream.id);
    setCommentsCount(commentsCount || 0);

    if (user) {
      const { data: like } = await supabase
        .from('likes')
        .select('id')
        .eq('dream_id', dream.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setLiked(!!like);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    if (liked) {
      await supabase
        .from('likes')
        .delete()
        .eq('dream_id', dream.id)
        .eq('user_id', user.id);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from('likes').insert({
        dream_id: dream.id,
        user_id: user.id,
      });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/dream/${dream.id}`;
    if (navigator.share) {
      await navigator.share({
        title: dream.title,
        text: dream.content.substring(0, 100) + '...',
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleReport = async () => {
    if (!user) return;
    const reason = prompt('Please provide a reason for reporting this dream:');
    if (!reason) return;

    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_dream_id: dream.id,
      reason,
    });
    alert('Dream reported. Thank you for keeping our community safe.');
    setShowMenu(false);
  };

  const handleBlock = async () => {
    if (!user || !confirm('Are you sure you want to block this user?')) return;

    await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: dream.user_id,
    });
    alert('User blocked successfully.');
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this dream?')) return;

    await supabase.from('dreams').delete().eq('id', dream.id);
    onDelete?.();
  };

  const isOwner = user?.id === dream.user_id;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 transition-transform hover:scale-[1.01]">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {profile?.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{profile?.full_name || profile?.username}</p>
              <p className="text-sm text-gray-500">
                @{profile?.username} · {new Date(dream.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!dream.is_public && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                <Lock className="w-4 h-4" />
                Private
              </span>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                  {isOwner ? (
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Dream
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleReport}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        Report Dream
                      </button>
                      <button
                        onClick={handleBlock}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        Block User
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">{dream.title}</h3>
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{dream.content}</p>

        {dream.image_url && (
          <img
            src={dream.image_url}
            alt={dream.title}
            className="w-full rounded-xl mb-4 max-h-96 object-cover"
          />
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span className="font-medium">{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{commentsCount}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share</span>
          </button>
        </div>
      </div>

      {showComments && user && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <p className="text-gray-500 text-center">Comments feature coming soon!</p>
        </div>
      )}
    </div>
  );
};

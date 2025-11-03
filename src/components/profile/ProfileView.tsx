import { useAuth } from '../../contexts/AuthContext';
import { Settings, LogOut } from 'lucide-react';

type ProfileViewProps = {
  onEditProfile: () => void;
};

export const ProfileView = ({ onEditProfile }: ProfileViewProps) => {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || profile.username}</h2>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEditProfile}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={signOut}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>

      {profile.bio && (
        <p className="text-gray-700 mb-4">{profile.bio}</p>
      )}

      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-bold text-gray-900">Member since</span>
          <p className="text-gray-600">
            {new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

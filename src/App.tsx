import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { ProfileView } from './components/profile/ProfileView';
import { ProfileEditor } from './components/profile/ProfileEditor';
import { DreamEditor } from './components/dreams/DreamEditor';
import { DreamFeed } from './components/dreams/DreamFeed';
import { Moon, Plus, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState<'login' | 'signup'>('login');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showDreamEditor, setShowDreamEditor] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center mb-8 mt-16">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Moon className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">DreamShare</h1>
          </div>
          <p className="text-gray-600">Share your dreams with the world</p>
        </div>
        {showAuth === 'login' ? (
          <LoginForm onSwitchToSignup={() => setShowAuth('signup')} />
        ) : (
          <SignupForm onSwitchToLogin={() => setShowAuth('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">DreamShare</h1>
          </div>
          <button
            onClick={() => setShowDreamEditor(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Dream
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProfileView onEditProfile={() => setShowProfileEditor(true)} />
        <DreamFeed />
      </main>

      {showProfileEditor && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}

      {showDreamEditor && (
        <DreamEditor
          onClose={() => setShowDreamEditor(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

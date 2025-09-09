import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback: React.FC = () => {
  const { setUser, setSession, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          return;
        }

        if (data.session) {
          setUser(data.session.user);
          setSession(data.session);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [setUser, setSession, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-white text-lg">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  return <Navigate to="/" replace />;
};

export default AuthCallback;
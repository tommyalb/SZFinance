import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthGuard({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading session...</p>;
  if (!session) return <Navigate to="/login" replace />;

  return children;
}
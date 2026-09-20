import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      if (isRegister) {
        // Register a new account
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // Instantly logged in if email confirmation is disabled
          window.location.href = '/';
        } else {
          setInfoMsg('Account created! Please check your email to confirm, or log in.');
          setIsRegister(false);
        }
      } else {
        // Log in to existing account
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        window.location.href = '/';
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background Neon Wave Glow */}
      <div className="neon-circle neon-1"></div>
      <div className="neon-circle neon-2"></div>

      {/* Glassmorphic Card */}
      <div className="login-card">
        <h1 className="login-title">{isRegister ? 'Register' : 'Login'}</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>

        {errorMsg && <p className="status-msg error">{errorMsg}</p>}
        {infoMsg && <p className="status-msg info">{infoMsg}</p>}

        <div className="toggle-mode">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="switch-btn"
                onClick={() => {
                  setIsRegister(false);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                Login
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="switch-btn"
                onClick={() => {
                  setIsRegister(true);
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                Register
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
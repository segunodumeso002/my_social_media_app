import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';

const PENDING_PROFILE_KEY = 'pendingProfileSetup';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);

      const pendingRaw = localStorage.getItem(PENDING_PROFILE_KEY);
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending?.username === username) {
            const pendingBio = (pending?.bio || '').trim();
            const pendingProfilePicture = (pending?.profilePicture || '').trim();
            if (pendingBio || pendingProfilePicture) {
              await api.updateProfile(pendingBio, pendingProfilePicture);
            }
            localStorage.removeItem(PENDING_PROFILE_KEY);
          }
        } catch {
          localStorage.removeItem(PENDING_PROFILE_KEY);
        }
      }

      navigate('/');
    } catch {
      // Error is handled by toast in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full glass-card surface-glow rounded-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-1 text-gray-800">Welcome Back</h2>
        <p className="text-center text-sm text-slate-600 mb-6">Sign in to continue your social space.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-2 rounded-lg hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-sky-600 hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const PENDING_PROFILE_KEY = 'pendingProfileSetup';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, email);
      localStorage.setItem(
        PENDING_PROFILE_KEY,
        JSON.stringify({
          username,
          bio: bio.trim(),
          profilePicture: profilePicture.trim()
        })
      );
      navigate('/verify', { state: { username, email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full glass-card surface-glow rounded-xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-1 text-gray-800">Create Account</h2>
        <p className="text-center text-sm text-slate-600 mb-6">Build your profile and join the feed.</p>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
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
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
            required
            minLength={8}
          />
          <input
            type="text"
            placeholder="Short bio (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
            maxLength={160}
          />
          <input
            type="url"
            placeholder="Profile picture URL (optional)"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 bg-white/85"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-2 rounded-lg hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-sky-600 hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

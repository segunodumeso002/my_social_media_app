import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Verify() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirmSignUpCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || '';
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUpCode(username, code);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      // Error handled by toast
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
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Verify Email</h2>
        <p className="text-center text-gray-600 mb-6">
          We sent a verification code to <strong>{email}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border border-sky-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 text-gray-800 text-center text-2xl tracking-widest bg-white/85"
            required
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <button 
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-2 rounded-lg hover:opacity-95 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already verified? <Link to="/login" className="text-sky-600 hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}

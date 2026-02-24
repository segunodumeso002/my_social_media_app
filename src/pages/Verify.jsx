import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Verify Email</h2>
        <p className="text-center text-gray-600 mb-6">
          We sent a verification code to <strong>{email}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-center text-2xl tracking-widest"
            required
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <button 
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already verified? <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

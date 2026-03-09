import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Home, User, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { onNotificationsRefresh } from '../utils/notifications';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRouteId = user?.userId || user?.username || 'me';

  useEffect(() => {
    let isMounted = true;

    const loadUnreadCount = async () => {
      const count = await api.getUnreadNotificationsCount();
      if (isMounted) {
        setUnreadCount(count);
      }
    };

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        loadUnreadCount();
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    const unsubscribe = onNotificationsRefresh(loadUnreadCount);
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-lg shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="text-xl sm:text-2xl font-bold brand-text truncate">SocialApp</Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/" aria-label="Home" className="flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors">
            <Home size={20} />
          </Link>
          <Link to="/notifications" className="relative flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors" aria-label="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold shadow">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to={`/profile/${profileRouteId}`} aria-label="Profile" className="flex items-center gap-2 text-slate-600 hover:text-sky-600 transition-colors">
            <User size={20} />
          </Link>
          <button onClick={logout} aria-label="Logout" className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

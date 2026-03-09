import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { emitNotificationsRefresh } from '../utils/notifications';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadNotifications({ isMountedRef: isMounted, silent: false });

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        loadNotifications({ isMountedRef: isMounted, silent: true });
      }
    };

    const interval = setInterval(
      () => loadNotifications({ isMountedRef: isMounted, silent: true }),
      15000
    );
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.isRead).length,
    [notifications]
  );

  const loadNotifications = async ({ isMountedRef = true, silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await api.getNotifications();
      if (isMountedRef) {
        setNotifications(data);
        emitNotificationsRefresh();
      }
    } finally {
      if (!silent && isMountedRef) {
        setLoading(false);
      }
    }
  };

  const handleMarkRead = async (notificationId) => {
    if (!notificationId) return;
    await api.markNotificationRead(notificationId);
    setNotifications((prev) =>
      prev.map((item) =>
        item.notificationId === notificationId ? { ...item, isRead: true } : item
      )
    );
    emitNotificationsRefresh();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setMarkingAll(false);
    emitNotificationsRefresh();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-xl p-6 border border-white/80"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll || notifications.length === 0 || unreadCount === 0}
              className="text-sm px-3 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-lg hover:opacity-95 disabled:opacity-50 transition"
            >
              {markingAll ? 'Updating...' : 'Mark all as read'}
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="text-gray-600">No notifications yet. Likes and comments will appear here.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.notificationId || `${notification.type}-${notification.createdAt}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, delay: Math.min(index * 0.025, 0.15) }}
                    className={`p-4 rounded-lg border ${notification.isRead ? 'border-slate-200 bg-white/85' : 'border-sky-200 bg-sky-50/80'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTime(notification.createdAt)}</p>
                      </div>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkRead(notification.notificationId)}
                          className="text-sm text-sky-600 hover:text-sky-700"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

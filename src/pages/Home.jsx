import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

const FEED_MODE_KEY_PREFIX = 'socialapp:home-feed-mode';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedMode, setFeedMode] = useState('global');
  const [profileNeedsSetup, setProfileNeedsSetup] = useState(false);
  const [dismissProfilePrompt, setDismissProfilePrompt] = useState(false);

  const normalizeValue = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
  const getPostOwnerId = (post) =>
    post?.userId || post?.userID || post?.ownerId || post?.ownerID || post?.authorId || post?.authorID || '';
  const getPostOwnerUsername = (post) =>
    post?.username || post?.userName || post?.ownerUsername || post?.author || '';

  useEffect(() => {
    if (user?.userId) {
      checkProfileCompletion();
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId && !user?.username) {
      setPosts([]);
      return;
    }

    loadPosts();
  }, [user?.userId, user?.username]);

  useEffect(() => {
    const identity = user?.userId || user?.username;
    if (!identity) {
      setFeedMode('global');
      return;
    }

    try {
      const stored = localStorage.getItem(`${FEED_MODE_KEY_PREFIX}:${identity}`);
      if (stored === 'global' || stored === 'mine') {
        setFeedMode(stored);
      } else {
        setFeedMode('global');
      }
    } catch {
      setFeedMode('global');
    }
  }, [user?.userId, user?.username]);

  useEffect(() => {
    const identity = user?.userId || user?.username;
    if (!identity) return;

    try {
      localStorage.setItem(`${FEED_MODE_KEY_PREFIX}:${identity}`, feedMode);
    } catch {
      // Ignore localStorage failures (private mode or storage restrictions)
    }
  }, [feedMode, user?.userId, user?.username]);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load posts. Please check your connection and try again.');
    }
    setLoading(false);
  };

  const checkProfileCompletion = async () => {
    try {
      const profile = await api.getProfile(user.userId);
      const needsSetup = !profile?.bio?.trim() || !profile?.profilePicture?.trim();
      setProfileNeedsSetup(needsSetup);
    } catch (err) {
      console.error(err);
      setProfileNeedsSetup(true);
    }
  };

  const handleNewPost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    if (!updatedPost?.postId) return;
    setPosts((prev) =>
      prev.map((item) => (item.postId === updatedPost.postId ? { ...item, ...updatedPost } : item))
    );
  };

  const handlePostDeleted = (postId) => {
    if (!postId) return;
    setPosts((prev) => prev.filter((item) => item.postId !== postId));
  };

  const visiblePosts = useMemo(() => {
    if (feedMode === 'global') {
      return posts;
    }

    const currentUserId = user?.userId || '';
    const currentUsername = normalizeValue(user?.username);

    return posts.filter((post) => {
      const ownerId = getPostOwnerId(post);
      const ownerUsername = normalizeValue(getPostOwnerUsername(post));
      return (
        (!!currentUserId && !!ownerId && ownerId === currentUserId) ||
        (!!currentUsername && !!ownerUsername && ownerUsername === currentUsername)
      );
    });
  }, [feedMode, posts, user?.userId, user?.username]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {profileNeedsSetup && !dismissProfilePrompt && user?.userId && (
          <div className="glass-card rounded-xl p-4 mb-4 border border-sky-100 surface-glow float-in">
            <p className="text-gray-800 font-medium">Complete your profile to stand out.</p>
            <p className="text-sm text-gray-600 mt-1">Add a bio and profile picture so your portfolio app looks production-ready.</p>
            <div className="flex items-center gap-3 mt-3">
              <Link
                to={`/profile/${user.userId}?edit=1`}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-lg hover:opacity-95 transition"
              >
                Complete Profile
              </Link>
              <button
                type="button"
                onClick={() => setDismissProfilePrompt(true)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        <CreatePost onPostCreated={handleNewPost} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="mt-4 glass-card rounded-xl p-1.5 inline-flex gap-1.5 border border-white/70"
        >
          <button
            type="button"
            onClick={() => setFeedMode('global')}
            className={`px-4 py-2 text-sm rounded-md transition ${
              feedMode === 'global'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'
            }`}
          >
            Global Feed
          </button>
          <button
            type="button"
            onClick={() => setFeedMode('mine')}
            className={`px-4 py-2 text-sm rounded-md transition ${
              feedMode === 'mine'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'
            }`}
          >
            My Posts
          </button>
        </motion.div>

        {loading ? (
          <p className="text-center mt-8">Loading...</p>
        ) : error ? (
          <div className="text-center mt-8 glass-card rounded-xl p-6 border border-red-100">
            <p className="text-red-600 mb-3">{error}</p>
            <button
              type="button"
              onClick={loadPosts}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-lg hover:opacity-95 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <AnimatePresence mode="popLayout">
              {visiblePosts.map((post, index) => (
                <motion.div
                  key={post.postId}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.2) }}
                >
                  <Post
                    post={post}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {visiblePosts.length === 0 && (
              <p className="text-center text-gray-500 py-8 glass-card rounded-xl border border-white/70">
                {feedMode === 'mine'
                  ? 'No posts yet for this account. Create your first post.'
                  : 'No posts available yet. Be the first to post.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

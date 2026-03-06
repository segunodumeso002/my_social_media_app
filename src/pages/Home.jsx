import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import Navbar from '../components/Navbar';

const FEED_MODE_KEY_PREFIX = 'socialapp:home-feed-mode';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const data = await api.getPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {profileNeedsSetup && !dismissProfilePrompt && user?.userId && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-blue-100">
            <p className="text-gray-800 font-medium">Complete your profile to stand out.</p>
            <p className="text-sm text-gray-600 mt-1">Add a bio and profile picture so your portfolio app looks production-ready.</p>
            <div className="flex items-center gap-3 mt-3">
              <Link
                to={`/profile/${user.userId}?edit=1`}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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

        <div className="mt-4 bg-white rounded-lg shadow-sm p-1 inline-flex gap-1 border border-gray-200">
          <button
            type="button"
            onClick={() => setFeedMode('global')}
            className={`px-4 py-2 text-sm rounded-md transition ${
              feedMode === 'global'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Global Feed
          </button>
          <button
            type="button"
            onClick={() => setFeedMode('mine')}
            className={`px-4 py-2 text-sm rounded-md transition ${
              feedMode === 'mine'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            My Posts
          </button>
        </div>

        {loading ? (
          <p className="text-center mt-8">Loading...</p>
        ) : (
          <div className="space-y-4 mt-6">
            {visiblePosts.map((post) => (
              <Post
                key={post.postId}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
            {visiblePosts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
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

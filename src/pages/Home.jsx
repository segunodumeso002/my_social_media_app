import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import Navbar from '../components/Navbar';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileNeedsSetup, setProfileNeedsSetup] = useState(false);
  const [dismissProfilePrompt, setDismissProfilePrompt] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (user?.userId) {
      checkProfileCompletion();
    }
  }, [user?.userId]);

  const loadPosts = async () => {
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
        {loading ? (
          <p className="text-center mt-8">Loading...</p>
        ) : (
          <div className="space-y-4 mt-6">
            {posts.map((post) => (
              <Post
                key={post.postId}
                post={post}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

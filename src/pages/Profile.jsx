import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImageToS3 } from '../utils/storage';

export default function Profile() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [pictureUploadProgress, setPictureUploadProgress] = useState(0);
  const [followUpdating, setFollowUpdating] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [profilePictureInput, setProfilePictureInput] = useState('');
  const isOwnProfile = Boolean(user?.userId && userId === user.userId);

  useEffect(() => {
    loadProfile();
  }, [userId, user?.userId, user?.username]);

  useEffect(() => {
    if (isOwnProfile && searchParams.get('edit') === '1') {
      setEditing(true);
    }
  }, [isOwnProfile, searchParams]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await api.getProfile(userId);
      if (data) {
        setProfile(data);
        setBioInput(data.bio || '');
        setProfilePictureInput(data.profilePicture || '');
      } else if (isOwnProfile) {
        const fallbackProfile = {
          userId: user?.userId,
          username: user?.username || 'You',
          bio: '',
          profilePicture: '',
          isFollowing: false
        };
        setProfile(fallbackProfile);
        setBioInput(fallbackProfile.bio);
        setProfilePictureInput(fallbackProfile.profilePicture);
      } else {
        setProfile(null);
        setNotFound(true);
      }
    } catch (err) {
      console.error(err);
      if (isOwnProfile) {
        const fallbackProfile = {
          userId: user?.userId,
          username: user?.username || 'You',
          bio: '',
          profilePicture: '',
          isFollowing: false
        };
        setProfile(fallbackProfile);
        setBioInput(fallbackProfile.bio);
        setProfilePictureInput(fallbackProfile.profilePicture);
      } else {
        setProfile(null);
        setNotFound(true);
      }
    }
    setLoading(false);
  };

  const handleFollow = async () => {
    if (isOwnProfile || followUpdating || !profile) return;

    const wasFollowing = Boolean(profile.isFollowing);
    setFollowUpdating(true);
    setProfile((prev) => ({ ...prev, isFollowing: !wasFollowing }));

    try {
      if (wasFollowing) {
        await api.unfollowUser(userId);
      } else {
        await api.followUser(userId);
      }
    } catch (err) {
      setProfile((prev) => ({ ...prev, isFollowing: wasFollowing }));
      toast.error('Could not update follow status. Please try again.');
      console.error(err);
    }

    setFollowUpdating(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile(bioInput.trim(), profilePictureInput.trim());
      setProfile((prev) => ({
        ...prev,
        ...(updated || {}),
        bio: updated?.bio ?? bioInput.trim(),
        profilePicture: updated?.profilePicture ?? profilePictureInput.trim()
      }));
      setEditing(false);
      setSearchParams({}, { replace: true });
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setBioInput(profile?.bio || '');
    setProfilePictureInput(profile?.profilePicture || '');
    setEditing(false);
    setPictureUploadProgress(0);
    setSearchParams({}, { replace: true });
  };

  const handleProfileImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPictureUploading(true);
    try {
      const uploaded = await uploadImageToS3(file, 'profiles', setPictureUploadProgress);
      setProfilePictureInput(uploaded.url);
      toast.success('Profile picture uploaded');
    } catch (err) {
      toast.error(err?.message || 'Failed to upload profile picture');
    }
    setPictureUploading(false);
    e.target.value = '';
  };

  if (loading) return <p>Loading...</p>;

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Profile not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.username} className="w-20 h-20 rounded-full shrink-0 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                <User size={40} />
              </div>
            )}
            <div className="flex-1 w-full">
              <h2 className="text-2xl font-bold">{profile.username}</h2>
              {editing && isOwnProfile ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                    maxLength={160}
                    placeholder="Write your bio"
                  />
                  <input
                    type="url"
                    value={profilePictureInput}
                    onChange={(e) => setProfilePictureInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste profile picture URL"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                    <span>{pictureUploading ? 'Uploading image...' : 'Upload from device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageFile}
                      className="hidden"
                      disabled={pictureUploading}
                    />
                  </label>
                  {pictureUploadProgress > 0 && pictureUploadProgress < 100 && (
                    <p className="text-xs text-gray-500">Upload progress: {pictureUploadProgress}%</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">{profile.bio || 'No bio yet.'}</p>
              )}
            </div>
            {isOwnProfile ? (
              editing ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving || pictureUploading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 w-full sm:w-auto"
                >
                  Edit Profile
                </button>
              )
            ) : (
              <button
                onClick={handleFollow}
                disabled={followUpdating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-60 w-full sm:w-auto"
              >
                {followUpdating ? 'Updating...' : (profile.isFollowing ? 'Unfollow' : 'Follow')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { resolveS3ImageUrl } from '../utils/storage';

const profileImageCache = new Map();

const getCommentText = (comment) => comment?.text || comment?.comment || comment?.content || '';

const getCommentKey = (comment, index) => {
  if (comment?.commentId) return comment.commentId;
  if (comment?.id) return comment.id;
  return `${comment?.username || 'comment'}-${comment?.createdAt || 'now'}-${index}`;
};

const formatDate = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const normalizeValue = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const getPostOwnerId = (post) =>
  post?.userId || post?.userID || post?.ownerId || post?.ownerID || post?.authorId || post?.authorID || '';

const getPostOwnerUsername = (post) =>
  post?.username || post?.userName || post?.ownerUsername || post?.author || '';

const getPostOwnerImage = (post) =>
  post?.profilePicture || post?.profilePic || post?.userProfilePicture || post?.avatar || post?.avatarUrl || '';

const getProfileImage = (profile) =>
  profile?.profilePicture || profile?.profilePic || profile?.avatar || profile?.avatarUrl || profile?.image || '';

export default function Post({ post, onPostUpdated, onPostDeleted }) {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState(post.image || '');
  const [authorImageSrc, setAuthorImageSrc] = useState('');
  const [postContent, setPostContent] = useState(post.content || '');
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [postDeleting, setPostDeleting] = useState(false);
  const [postEditing, setPostEditing] = useState(false);
  const [postSaving, setPostSaving] = useState(false);
  const [postEditContent, setPostEditContent] = useState(post.content || '');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentKey, setEditingCommentKey] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      const nextSrc = await resolveS3ImageUrl(post.image || '');
      if (isMounted) {
        setImageSrc(nextSrc);
      }
    };

    resolveImage();

    return () => {
      isMounted = false;
    };
  }, [post.image]);

  useEffect(() => {
    let isMounted = true;

    const resolveAuthorImage = async () => {
      const directImage = getPostOwnerImage(post);
      if (directImage) {
        const resolved = await resolveS3ImageUrl(directImage);
        if (isMounted) {
          setAuthorImageSrc(resolved);
        }
        return;
      }

      const ownerId = getPostOwnerId(post);
      const ownerUsername = getPostOwnerUsername(post);
      const currentUsername = normalizeValue(user?.username);
      const postUsername = normalizeValue(ownerUsername);
      const identifiers = [ownerId, ownerUsername].filter(Boolean);

      if (!identifiers.length) {
        // If post lacks owner identifiers but appears to be mine, reuse current profile.
        if (postUsername && currentUsername && postUsername === currentUsername && user?.userId) {
          identifiers.push(user.userId);
        }
      }

      if (!identifiers.length) {
        if (isMounted) {
          setAuthorImageSrc('');
        }
        return;
      }

      for (const identifier of identifiers) {
        const cacheKey = String(identifier);
        if (!cacheKey) continue;

        if (profileImageCache.has(cacheKey)) {
          const cached = profileImageCache.get(cacheKey) || '';
          if (isMounted) {
            setAuthorImageSrc(cached);
          }
          return;
        }

        const profile = await api.getProfile(identifier);
        const profilePicture = getProfileImage(profile);
        const resolved = profilePicture ? await resolveS3ImageUrl(profilePicture) : '';

        profileImageCache.set(cacheKey, resolved || '');

        if (resolved) {
          if (ownerId) {
            profileImageCache.set(String(ownerId), resolved);
          }
          if (ownerUsername) {
            profileImageCache.set(String(ownerUsername), resolved);
          }
          if (isMounted) {
            setAuthorImageSrc(resolved);
          }
          return;
        }
      }

      if (ownerId) {
        profileImageCache.set(String(ownerId), '');
      }
      if (ownerUsername) {
        profileImageCache.set(String(ownerUsername), '');
      }
      if (isMounted) {
        setAuthorImageSrc('');
      }
    };

    resolveAuthorImage();

    return () => {
      isMounted = false;
    };
  }, [
    post?.postId,
    post?.userId,
    post?.userID,
    post?.ownerId,
    post?.ownerID,
    post?.authorId,
    post?.authorID,
    post?.username,
    post?.userName,
    post?.ownerUsername,
    post?.author,
    post?.profilePicture,
    post?.profilePic,
    post?.userProfilePicture,
    post?.avatar,
    post?.avatarUrl,
    user?.userId,
    user?.username
  ]);

  useEffect(() => {
    setPostContent(post.content || '');
    if (!postEditing) {
      setPostEditContent(post.content || '');
    }
  }, [post.content, postEditing]);

  const currentUserId = user?.userId || '';
  const postOwnerId = getPostOwnerId(post);
  const currentUsername = normalizeValue(user?.username);
  const postOwnerUsername = normalizeValue(getPostOwnerUsername(post));
  const isOwnPost =
    (!!postOwnerId && !!currentUserId && postOwnerId === currentUserId) ||
    (!!postOwnerUsername && !!currentUsername && postOwnerUsername === currentUsername);

  const handleLike = async () => {
    if (liking) return;

    const previousLiked = liked;
    const previousLikes = likes;
    const nextLiked = !previousLiked;
    const nextLikes = nextLiked ? previousLikes + 1 : Math.max(0, previousLikes - 1);

    setLiking(true);
    setLiked(nextLiked);
    setLikes(nextLikes);

    try {
      await api.likePost(post.postId, post.createdAt);
    } catch (err) {
      setLiked(previousLiked);
      setLikes(previousLikes);
      toast.error('Failed to update like. Please try again.');
      console.error(err);
    }

    setLiking(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (commentSubmitting) return;

    const trimmedComment = comment.trim();
    if (!trimmedComment) return;

    const tempCommentId = `temp-${Date.now()}`;
    const optimisticComment = {
      id: tempCommentId,
      username: user?.username || 'You',
      userId: user?.userId,
      text: trimmedComment,
      createdAt: new Date().toISOString(),
      optimistic: true
    };

    setCommentSubmitting(true);
    setComment('');
    setComments((prev) => [...prev, optimisticComment]);

    try {
      const newComment = await api.addComment(post.postId, trimmedComment, post.createdAt);
      setComments((prev) =>
        prev.map((item) => {
          const itemKey = item.commentId || item.id;
          if (itemKey !== tempCommentId) return item;
          return {
            ...item,
            ...(newComment || {}),
            text: newComment?.text || newComment?.comment || newComment?.content || trimmedComment,
            optimistic: false
          };
        })
      );
    } catch (err) {
      setComments((prev) => prev.filter((item) => (item.commentId || item.id) !== tempCommentId));
      setComment(trimmedComment);
      toast.error('Failed to add comment. Please try again.');
      console.error(err);
    }

    setCommentSubmitting(false);
  };

  const handleStartEdit = (commentItem, commentKey) => {
    setEditingCommentKey(commentKey);
    setEditingCommentText(getCommentText(commentItem));
  };

  const handleCancelEdit = () => {
    setEditingCommentKey(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async (commentItem, commentKey) => {
    const trimmedComment = editingCommentText.trim();
    if (!trimmedComment) return;

    try {
      const updated = commentItem?.commentId
        ? await api.updateComment(post.postId, commentItem.commentId, trimmedComment, post.createdAt)
        : null;

      setComments((prev) =>
        prev.map((item, index) => {
          const key = getCommentKey(item, index);
          if (key !== commentKey) return item;
          return {
            ...item,
            ...(updated || {}),
            text: updated?.text || updated?.comment || updated?.content || trimmedComment
          };
        })
      );
      handleCancelEdit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentItem, commentKey) => {
    try {
      if (commentItem?.commentId) {
        await api.deleteComment(post.postId, commentItem.commentId, post.createdAt);
      }
      setComments((prev) =>
        prev.filter((item, index) => getCommentKey(item, index) !== commentKey)
      );
      if (editingCommentKey === commentKey) {
        handleCancelEdit();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartPostEdit = () => {
    setPostEditContent(postContent || '');
    setPostEditing(true);
  };

  const handleCancelPostEdit = () => {
    setPostEditContent(postContent || '');
    setPostEditing(false);
  };

  const handleSavePostEdit = async () => {
    const trimmedContent = postEditContent.trim();
    if (!trimmedContent) {
      toast.error('Post content cannot be empty');
      return;
    }

    setPostSaving(true);
    try {
      const updated = await api.updatePost(post.postId, trimmedContent, post.image || '', post.createdAt);
      if (!updated) {
        throw new Error('Failed to update post');
      }

      const nextPost = {
        ...post,
        ...updated,
        content: updated?.content || trimmedContent
      };

      setPostContent(nextPost.content);
      setPostEditing(false);
      onPostUpdated?.(nextPost);
      toast.success('Post updated');
    } catch (err) {
      toast.error(err?.message || 'Failed to update post');
      console.error(err);
    }
    setPostSaving(false);
  };

  const handleDeletePost = async () => {
    if (postDeleting) return;

    const confirmed = window.confirm('Delete this post? This action cannot be undone.');
    if (!confirmed) return;

    setPostDeleting(true);
    try {
      const deleted = await api.deletePost(post.postId, post.createdAt);
      if (!deleted) {
        throw new Error('Failed to delete post');
      }

      onPostDeleted?.(post.postId);
      toast.success('Post deleted');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete post');
      console.error(err);
    }
    setPostDeleting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center gap-3 mb-3">
        {authorImageSrc ? (
          <img src={authorImageSrc} alt={post.username || 'User'} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={18} className="text-gray-500" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold">{post.username}</p>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
        {isOwnPost && !postEditing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartPostEdit}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={postDeleting}
              className="text-xs text-red-500 hover:text-red-600 disabled:opacity-60"
            >
              {postDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>
      {postEditing ? (
        <div className="mb-3 space-y-2">
          <textarea
            value={postEditContent}
            onChange={(e) => setPostEditContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSavePostEdit}
              disabled={postSaving}
              className="px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-60"
            >
              {postSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelPostEdit}
              disabled={postSaving}
              className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mb-3">{postContent}</p>
      )}
      {imageSrc && <img src={imageSrc} alt="Post" className="w-full rounded-lg mb-3" />}
      <div className="flex items-center gap-4 mb-3">
        <button onClick={handleLike} disabled={liking} className={`flex items-center gap-1 ${liked ? 'text-red-500' : ''} disabled:opacity-60`}>
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-1">
          <MessageCircle size={20} />
          <span>{comments.length}</span>
        </button>
      </div>
      <form onSubmit={handleComment} className="flex gap-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          {commentSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>
      {comments.length > 0 && (
        <div className="mt-3 space-y-2">
          {comments.map((c, i) => {
            const commentKey = getCommentKey(c, i);
            const isEditing = editingCommentKey === commentKey;
            const isOwnComment = (c?.userId && c.userId === user?.userId) || c?.username === user?.username;
            return (
              <div key={commentKey} className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p>
                      <span className="font-semibold">{c.username || 'User'}</span>{' '}
                      {!isEditing && (getCommentText(c) || '')}
                    </p>
                    {isEditing && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(c, commentKey)}
                          className="px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{formatDate(c?.createdAt)}</p>
                  </div>
                  {isOwnComment && !isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(c, commentKey)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c, commentKey)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

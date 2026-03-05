import { get, post, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { extractNotificationList, normalizeNotification } from '../utils/notificationAdapter';
import { warnNotificationContractMismatch } from '../utils/notificationContract';

const API_NAME = 'SocialMediaAPI';
const NOTIFICATION_FAILURE_COOLDOWN_MS = 2 * 60 * 1000;

let notificationsTemporarilyDisabledUntil = 0;

const isNotificationCooldownActive = () => Date.now() < notificationsTemporarilyDisabledUntil;

const activateNotificationCooldown = () => {
  notificationsTemporarilyDisabledUntil = Date.now() + NOTIFICATION_FAILURE_COOLDOWN_MS;
};

const isLikelyNetworkOrCorsError = (error) => {
  const message = (error?.message || '').toLowerCase();
  return (
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('cors') ||
    message.includes('preflight') ||
    message.includes('err_failed')
  );
};

const isNotFoundError = (error) => {
  const message = error?.message || '';
  return message.includes('404') || message.includes('Not Found');
};

const getAuthHeaders = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return {
      Authorization: token || ''
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return {};
  }
};

export const api = {
  getPosts: async () => {
    try {
      const response = await get({ apiName: API_NAME, path: '/posts' });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  },

  createPost: async (content, image) => {
    try {
      const headers = await getAuthHeaders();
      const response = await post({
        apiName: API_NAME,
        path: '/posts',
        options: { 
          body: { content, image },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  updatePost: async (postId, content, image, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await put({
        apiName: API_NAME,
        path: `/posts/${postId}`,
        options: {
          body: {
            content,
            image,
            createdAt
          },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (!isNotFoundError(error)) {
        console.error('Error updating post:', backendMessage || error);
      }
      return null;
    }
  },

  deletePost: async (postId, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await del({
        apiName: API_NAME,
        path: `/posts/${postId}`,
        options: {
          body: { createdAt },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (!isNotFoundError(error)) {
        console.error('Error deleting post:', backendMessage || error);
      }
      return null;
    }
  },

  likePost: async (postId, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await post({
        apiName: API_NAME,
        path: `/posts/${postId}/like`,
        options: {
          body: { createdAt },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      console.error('Error liking post:', backendMessage || error);
      throw error;
    }
  },

  addComment: async (postId, comment, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await post({
        apiName: API_NAME,
        path: `/posts/${postId}/comments`,
        options: { 
          body: {
            comment,
            text: comment,
            content: comment,
            createdAt
          },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      console.error('Error adding comment:', backendMessage || error);
      throw error;
    }
  },

  updateComment: async (postId, commentId, comment, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await put({
        apiName: API_NAME,
        path: `/posts/${postId}/comments/${commentId}`,
        options: {
          body: {
            comment,
            text: comment,
            content: comment,
            createdAt
          },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (!isNotFoundError(error)) {
        console.error('Error updating comment:', backendMessage || error);
      }
      return null;
    }
  },

  deleteComment: async (postId, commentId, createdAt) => {
    try {
      const headers = await getAuthHeaders();
      const response = await del({
        apiName: API_NAME,
        path: `/posts/${postId}/comments/${commentId}`,
        options: {
          body: { createdAt },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      if (!isNotFoundError(error)) {
        console.error('Error deleting comment:', backendMessage || error);
      }
      return null;
    }
  },

  getProfile: async (userId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await get({ 
        apiName: API_NAME, 
        path: `/users/${userId}`,
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.message;
      console.error('Error fetching profile:', backendMessage || error);
      return null;
    }
  },

  updateProfile: async (bio, profilePicture) => {
    try {
      const headers = await getAuthHeaders();
      const response = await put({
        apiName: API_NAME,
        path: '/users/profile',
        options: { 
          body: { bio, profilePicture },
          headers
        }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  followUser: async (userId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await post({
        apiName: API_NAME,
        path: `/users/${userId}/follow`,
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  unfollowUser: async (userId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await del({
        apiName: API_NAME,
        path: `/users/${userId}/follow`,
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  getNotifications: async () => {
    if (isNotificationCooldownActive()) {
      return [];
    }

    try {
      const headers = await getAuthHeaders();
      const response = await get({
        apiName: API_NAME,
        path: '/notifications',
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      const list = extractNotificationList(jsonData);

      if (import.meta.env.DEV) {
        list.forEach((item, index) => {
          warnNotificationContractMismatch(item, index);
        });
      }

      return list.map((item, index) => normalizeNotification(item, index));
    } catch (error) {
      if (isLikelyNetworkOrCorsError(error)) {
        activateNotificationCooldown();
        return [];
      }

      if (!isNotFoundError(error)) {
        console.error('Error fetching notifications:', error);
      }
      return [];
    }
  },

  getUnreadNotificationsCount: async () => {
    if (isNotificationCooldownActive()) {
      return 0;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await get({
        apiName: API_NAME,
        path: '/notifications/unread-count',
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      const count = Number(jsonData?.count);
      return Number.isFinite(count) ? count : 0;
    } catch (error) {
      if (isLikelyNetworkOrCorsError(error)) {
        activateNotificationCooldown();
        return 0;
      }

      if (!isNotFoundError(error)) {
        console.error('Error fetching unread notification count:', error);
      }
      return 0;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await put({
        apiName: API_NAME,
        path: `/notifications/${notificationId}/read`,
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      if (!isNotFoundError(error)) {
        console.error('Error marking notification as read:', error);
      }
      return null;
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await put({
        apiName: API_NAME,
        path: '/notifications/read-all',
        options: { headers }
      });
      const data = await response.response;
      const jsonData = await data.body.json();
      return jsonData;
    } catch (error) {
      if (!isNotFoundError(error)) {
        console.error('Error marking all notifications as read:', error);
      }
      return null;
    }
  }
};

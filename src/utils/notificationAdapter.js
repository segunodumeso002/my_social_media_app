const toBooleanRead = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    return normalized === 'read' || normalized === 'true';
  }
  return false;
};

const toIsoDate = (value) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
};

const buildMessage = (type, actorUsername, fallbackMessage) => {
  if (fallbackMessage) return fallbackMessage;
  const actor = actorUsername || 'Someone';
  if (type === 'like') return `${actor} liked your post`;
  if (type === 'comment') return `${actor} commented on your post`;
  if (type === 'follow') return `${actor} started following you`;
  return `${actor} has new activity`;
};

export const extractNotificationList = (responseBody) => {
  if (Array.isArray(responseBody)) return responseBody;
  if (Array.isArray(responseBody?.items)) return responseBody.items;
  if (Array.isArray(responseBody?.notifications)) return responseBody.notifications;
  if (Array.isArray(responseBody?.data?.items)) return responseBody.data.items;
  if (Array.isArray(responseBody?.data?.notifications)) return responseBody.data.notifications;
  return [];
};

export const normalizeNotification = (notification, index = 0) => {
  const type = notification?.type || notification?.eventType || notification?.event || 'activity';
  const actorUsername =
    notification?.actorUsername ||
    notification?.actor?.username ||
    notification?.username ||
    notification?.fromUsername ||
    '';

  const createdAt = toIsoDate(
    notification?.createdAt || notification?.timestamp || notification?.time || notification?.date
  );

  const notificationId =
    notification?.notificationId ||
    notification?.id ||
    notification?.pk ||
    `${type}-${createdAt}-${index}`;

  const hasStatus = notification?.status !== undefined && notification?.status !== null;
  const isRead =
    notification?.isRead ??
    notification?.read ??
    (hasStatus ? toBooleanRead(notification?.status) : Boolean(notification?.readAt));

  return {
    ...notification,
    notificationId,
    type,
    actorUsername,
    message: buildMessage(type, actorUsername, notification?.message || notification?.text),
    createdAt,
    isRead: Boolean(isRead)
  };
};

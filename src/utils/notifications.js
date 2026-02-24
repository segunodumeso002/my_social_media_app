const NOTIFICATIONS_REFRESH_EVENT = 'socialapp:notifications-refresh';

export const emitNotificationsRefresh = () => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
};

export const onNotificationsRefresh = (handler) => {
  if (!handler) return () => {};

  const listener = () => handler();
  window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);

  return () => {
    window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);
  };
};

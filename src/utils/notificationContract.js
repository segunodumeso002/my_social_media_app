const warnedSignatures = new Set();

export const NOTIFICATION_CONTRACT = {
  requiredAnyId: ['notificationId', 'id', 'pk'],
  requiredType: ['type', 'eventType', 'event'],
  requiredCreatedAt: ['createdAt', 'timestamp', 'time', 'date'],
  requiredMessageOrActor: ['message', 'text', 'actorUsername', 'actor', 'username', 'fromUsername']
};

const hasAnyField = (payload, fieldNames) => {
  if (!payload || typeof payload !== 'object') return false;
  return fieldNames.some((field) => payload[field] !== undefined && payload[field] !== null && payload[field] !== '');
};

export const getNotificationContractIssues = (payload) => {
  const issues = [];

  if (!hasAnyField(payload, NOTIFICATION_CONTRACT.requiredAnyId)) {
    issues.push('Missing notification identifier field (notificationId/id/pk)');
  }

  if (!hasAnyField(payload, NOTIFICATION_CONTRACT.requiredType)) {
    issues.push('Missing event type field (type/eventType/event)');
  }

  if (!hasAnyField(payload, NOTIFICATION_CONTRACT.requiredCreatedAt)) {
    issues.push('Missing timestamp field (createdAt/timestamp/time/date)');
  }

  if (!hasAnyField(payload, NOTIFICATION_CONTRACT.requiredMessageOrActor)) {
    issues.push('Missing message/actor field (message/text/actorUsername/actor/username/fromUsername)');
  }

  return issues;
};

export const warnNotificationContractMismatch = (payload, index) => {
  const issues = getNotificationContractIssues(payload);
  if (issues.length === 0) return;

  const signature = `${issues.join('|')}::${index}`;
  if (warnedSignatures.has(signature)) return;
  warnedSignatures.add(signature);

  console.warn('Notification payload contract mismatch', {
    index,
    issues,
    payload
  });
};

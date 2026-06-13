const BASE_URL = '/api/v1/notifications';

export const fetchNotifications = async (params = {}) => {
  let url = BASE_URL;
  const queryParams = [];
  
  if (params.recipientUserId) queryParams.push(`recipientUserId=${encodeURIComponent(params.recipientUserId)}`);
  if (params.recipientRole) queryParams.push(`recipientRole=${encodeURIComponent(params.recipientRole)}`);
  if (params.readStatus !== undefined && params.readStatus !== null) queryParams.push(`readStatus=${params.readStatus}`);
  
  if (queryParams.length > 0) {
    url += `?${queryParams.join('&')}`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch notifications');
  const result = await response.json();
  return result.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}/read`, {
    method: 'PATCH'
  });
  if (!response.ok) throw new Error(`Failed to mark notification ${id} as read`);
  const result = await response.json();
  return result.data;
};

export const broadcastNotificationAlert = async (broadcastData) => {
  const response = await fetch(`${BASE_URL}/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(broadcastData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to dispatch broadcast alert');
  }
  const result = await response.json();
  return result.data;
};

export const createDirectNotificationAlert = async (notificationData) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create direct alert');
  }
  const result = await response.json();
  return result.data;
};

export const apiClient = async (endpoint, options = {}) => {
  const url = `${import.meta.env.VITE_API_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMsg = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
      errorMsg = `${errorMsg}: ${errorData.details[0]}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

const STORAGE_KEY = 'vipdayne_auth';

export function saveAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function requireAuthOrRedirect() {
  const auth = getAuth();
  if (!auth || !auth.accessToken) {
    window.location.href = '/frontend/dang-nhap.html';
    return null;
  }
  return auth;
}

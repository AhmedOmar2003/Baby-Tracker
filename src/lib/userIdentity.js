export function deriveAppUserId(authId) {
  if (!authId) return '';
  let hash = 0;
  for (let i = 0; i < authId.length; i += 1) {
    hash = (hash * 31 + authId.charCodeAt(i)) >>> 0;
  }
  return String(hash & 0x7fffffff);
}

export function normalizeStoredUserIds() {
  const storedId = localStorage.getItem('Id');
  const authId = localStorage.getItem('AuthId');

  if (authId && storedId && /^\d+$/.test(storedId)) {
    return { authId, appUserId: storedId };
  }

  if (storedId && !/^\d+$/.test(storedId)) {
    const appUserId = deriveAppUserId(storedId);
    localStorage.setItem('AuthId', storedId);
    localStorage.setItem('Id', appUserId);
    return { authId: storedId, appUserId };
  }

  if (!authId && storedId && /^\d+$/.test(storedId)) {
    return { authId: '', appUserId: storedId };
  }

  if (authId && !storedId) {
    const appUserId = deriveAppUserId(authId);
    localStorage.setItem('Id', appUserId);
    return { authId, appUserId };
  }

  return { authId: authId || '', appUserId: storedId || '' };
}

export function normalizeRole(role) {
  if (!role) return 'user';
  const normalized = String(role).trim().toLowerCase();

  if (normalized === 'admin') return 'Admin';
  if (normalized === 'superadmin') return 'SuperAdmin';
  if (normalized === 'doctor') return 'Doctor';
  if (normalized === 'user') return 'user';

  return role;
}

export function isAdminRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'admin' || normalized === 'superadmin';
}

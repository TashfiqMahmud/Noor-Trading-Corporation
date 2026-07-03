/**
 * Noor Trading – Admin shared JS
 * Auth guard + logout. Loaded on all admin pages.
 */
async function checkAdminAuth() {
  try {
    const res = await fetch(apiUrl('/api/admin/session'));
    const data = await res.json();
    if (!data.loggedIn) {
      location.href = '/admin/index.html';
      return false;
    }
    sessionStorage.setItem('adminUsername', data.username || 'Admin');
    return true;
  } catch (err) {
    location.href = '/admin/index.html';
    return false;
  }
}

async function adminLogout() {
  await fetch(apiUrl('/api/admin/logout'), { method: 'POST' });
  sessionStorage.removeItem('adminUsername');
  location.href = '/admin/index.html';
}

import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;

async function init() {
  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  // Set default scheduled date/time to now + 1 hour in local time
  const dateInput

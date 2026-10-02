import { requireAuth, signOut } from './auth.js';
import { callApi } from './dataService.js';

let currentProfile = null;

async function init() {
  currentProfile = await requireAuth('admin');
  if (!currentProfile) return;

  document.getElementById('user-display').textContent = currentProfile.full_name || currentProfile.email || 'Admin';
  document.getElementById('btn-logout').addEventListener('click', signOut);

  // Set default scheduled date/time to now + 1 hour in local time
  const dateInput = document.getElementById('wo-scheduled-at');
  if (dateInput) {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const year = nextHour.getFullYear();
    const month = String(nextHour.getMonth() + 1).padStart(2, '0');
    const day = String(nextHour.getDate()).padStart(2, '0');
    const hours = String

import { callApi } from './dataService.js';

export async function sendOtp(email) {
  return await callApi('sendOtpEmail', { email: email });
}

export async function verifyOtp(email, code) {
  const result = await callApi('verifyOtpEmail', { email: email, code: code });
  
  if (result.success && result.token) {
    localStorage.setItem('nityaseva_token', result.token);
    localStorage.setItem('nityaseva_role', result.role);
    localStorage.setItem('nityaseva_user', JSON.stringify(result.profile || {}));
  }
  
  return result;
}

export function getCurrentUserProfile() {
  const userStr = localStorage.getItem('nityaseva_user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  user.role = localStorage.getItem('nityaseva_role') || 'family';
  return user;
}

export async function requireAuth(expectedRole = null) {
  const token = localStorage.getItem('nityaseva_token');
  const role = localStorage.getItem('nityaseva_role');

  if (!token) {
    window.location.href = 'index.html';
    return null;
  }

  const profile = getCurrentUserProfile();

  if (expectedRole && role !== expectedRole && role !== 'admin') {
    alert('Access restricted to ' + expectedRole + ' role.');
    window.location.href = role + '.html';
    return null;
  }

  return profile;
}

export function signOut() {
  localStorage.removeItem('nityaseva_token');
  localStorage.removeItem('nityaseva_role');
  localStorage.removeItem('nityaseva_user');
  window.location.href = 'index.html';
}

import { CONFIG } from './config.js';

export async function callApi(action, params = {}) {
  const token = localStorage.getItem('nityaseva_token');

  const payload = {
    action: action,
    params: params,
    token: token
  };

  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  const resJson = await response.json();

  if (!resJson.success) {
    throw new Error(resJson.error || 'Server error occurred');
  }

  return resJson.data;
}

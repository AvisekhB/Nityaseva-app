import { CONFIG } from './config.js';
import { supabase } from './supabaseClient.js';

export async function callApi(action, params = {}) {
  // Get active Supabase JWT session
  const { data: { session } } = await supabase.auth.getSession();
  const token = session ? session.access_token : null;

  const payload = {
    action: action,
    params: params,
    token: token
  };

  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // Avoids preflight CORS trigger in Apps Script
    },
    body: JSON.stringify(payload)
  });

  const resJson = await response.json();

  if (!resJson.success) {
    throw new Error(resJson.error || 'Server error occurred');
  }

  return resJson.data;
}

import { CONFIG } from './config.js';

// Supabase JS is loaded via CDN in HTML
export const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_ANON_KEY
);

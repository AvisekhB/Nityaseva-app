import { supabase } from './supabaseClient.js';

export async function sendOtp(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true
    }
  });
  if (error) throw error;
  return true;
}

export async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email,
    token: token,
    type: 'email'
  });
  if (error) throw error;
  return data;
}

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { id: user.id, email: user.email, role: 'family' };
  }
  return data;
}

export async function requireAuth(expectedRole = null) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    window.location.href = 'index.html';
    return null;
  }

  if (expectedRole && profile.role !== expectedRole && profile.role !== 'admin') {
    alert('Access restricted to ' + expectedRole + ' role.');
    window.location.href = profile.role + '.html';
    return null;
  }

  return profile;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

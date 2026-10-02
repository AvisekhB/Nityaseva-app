import { supabase } from '../supabaseClient';

export const supabaseAdapter = {
  async request(action, payload = {}) {
    switch (action) {
      case "getSenior": {
        const { data, error } = await supabase.from('seniors').select('*').eq('id', payload.seniorId).single();
        if (error) throw error;
        return data;
      }
      case "getEntitlements": {
        const { data, error } = await supabase.from('entitlements').select('*').eq('senior_id', payload.seniorId).single();
        if (error) throw error;
        return data;
      }
      default:
        throw new Error(`Action '${action}' not implemented in Supabase Adapter.`);
    }
  }
};
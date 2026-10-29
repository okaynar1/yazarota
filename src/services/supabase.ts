import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://rxobuyiyiytiijggozyx.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2J1eWl5aXl0aWlqZ2dvenl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjgzODgsImV4cCI6MjEwODg0NDM4OH0.7nO_76xN5lKLcLcR1z8jf3Eez6VoyhiuqgALCYKxyGs';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Checks connectivity to the Supabase project.
 */
export async function checkSupabaseStatus(): Promise<{
  connected: boolean;
  tablesReady: boolean;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { connected: false, tablesReady: false, error: 'Supabase URL or Key not set.' };
  }

  try {
    const { data, error } = await supabase.from('app_state').select('id').limit(1);
    if (error) {
      // If table does not exist, connection is valid but schema needs to be applied
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('schema cache')) {
        return { connected: true, tablesReady: false, error: 'SQL şeması henüz veritabanına uygulanmamış.' };
      }
      return { connected: false, tablesReady: false, error: error.message };
    }
    return { connected: true, tablesReady: true };
  } catch (err: any) {
    return { connected: false, tablesReady: false, error: err?.message || 'Bilinmeyen bağlantı hatası' };
  }
}


import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for use in Server Components.
 * Fallback values used to prevent "supabaseUrl is required" initialization errors.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createClient(supabaseUrl, supabaseAnonKey);
}


import { createClient } from '@supabase/supabase-js';

// Fallback values prevent the library from throwing an immediate initialization error.
// The app will still attempt to fetch data, but will fail gracefully with 401/404 
// instead of crashing the entire React tree.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

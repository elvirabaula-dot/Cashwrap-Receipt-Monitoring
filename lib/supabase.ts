
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize the Supabase client
// Note: Ensure these variables are set in your Vercel Project Settings > Environment Variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

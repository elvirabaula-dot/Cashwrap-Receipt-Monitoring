
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. Please check your .env.local file. ' +
    'Connectivity to Cloud Tables will be disabled until configured.'
  );
}

// Fallback to placeholders to prevent the createClient call itself from throwing 
// an immediate "Url is required" error, allowing the React app to mount.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

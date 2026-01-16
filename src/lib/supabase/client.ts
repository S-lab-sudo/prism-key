import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '%c⚠️ SUPABASE CONFIG MISSING ⚠️',
      'color: red; font-size: 16px; font-weight: bold;',
      '\n\nYour NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.',
      '\nAuthentication and database sync will NOT work.',
      '\n\nPlease create a .env.local file with your Supabase credentials.',
      '\nSee: https://supabase.com/dashboard/project/_/settings/api'
    );
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

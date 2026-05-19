import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedSupabaseServer = null;

function createMissingSupabaseProxy() {
  const missing = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
  ].filter(Boolean);

  const message = `Missing Supabase environment variables: ${missing.join(
    ', '
  )}. Set them in your deployment environment before using Supabase APIs.`;

  return new Proxy(
    {},
    {
      get() {
        throw new Error(message);
      },
      apply() {
        throw new Error(message);
      },
      construct() {
        throw new Error(message);
      },
    }
  );
}

function createSupabaseServer() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMissingSupabaseProxy();
  }

  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const supabaseServer = cachedSupabaseServer || (cachedSupabaseServer = createSupabaseServer());

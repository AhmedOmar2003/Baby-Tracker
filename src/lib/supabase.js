import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedSupabaseClient = null;

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

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMissingSupabaseProxy();
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = cachedSupabaseClient || (cachedSupabaseClient = createSupabaseClient());

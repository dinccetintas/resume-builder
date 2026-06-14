// Server-side Supabase client using the service role key. Used by pipeline
// steps and API routes; bypasses RLS, so only ever import this on the server.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://supa.portal.seidoranalytics.com';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey || supabaseServiceKey.includes('dxuxklcxqzqihuezmabf') || supabaseServiceKey.length < 50) {
    supabaseServiceKey = DEFAULT_SERVICE_ROLE_KEY;
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: 'portal',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

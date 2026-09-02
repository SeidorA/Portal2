'use server';

import { createClient } from '@/utils/supabase/server';

export async function logSearchEvent(query: string, clicked: boolean, url?: string) {
  if (!query || query.trim().length < 3) return;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  
  await supabase
    .from('search_logs')
    .insert([{ 
      query: query.trim().toLowerCase(),
      user_id: userId,
      clicked, 
      clicked_url: url || null
    }]);
}

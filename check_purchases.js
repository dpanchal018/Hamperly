import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: purchases, error } = await supabase.from('purchases').select('id');
  console.log('Purchases count:', purchases?.length || 0);
  if (error) console.error(error);
}

check();

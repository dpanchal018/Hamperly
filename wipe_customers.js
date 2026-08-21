import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeUnusedCustomers() {
  const { data: purchases } = await supabase.from('purchases').select('customer_id');
  const usedIds = purchases?.map(p => p.customer_id) || [];
  
  let query = supabase.from('customers').delete();
  if (usedIds.length > 0) {
    query = query.not('id', 'in', ());
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000');
  }
  
  const { error } = await query;
  console.log('Unused customers wiped:', error ? error.message : 'Success');
}

wipeUnusedCustomers();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('purchases').select('id, customer_id, total_amount');
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : null);
  console.log("Data:", data);
}
check();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAmountDue() {
  const { data: purchases, error } = await supabase.from('purchases').select('id, final_amount, amount_paid, amount_due');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const p of purchases) {
    const correctDue = Math.max(0, Number(p.final_amount) - Number(p.amount_paid));
    if (Number(p.amount_due) !== correctDue) {
      console.log('Fixing purchase ' + p.id + '. Old due: ' + p.amount_due + ', New due: ' + correctDue);
      await supabase.from('purchases').update({ amount_due: correctDue }).eq('id', p.id);
    }
  }
  console.log('Done fixing amount_due.');
}

fixAmountDue();

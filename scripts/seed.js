const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedOccasions() {
  console.log("Starting occasion seed...");

  const parents = [
    { name: 'Festivals', slug: 'festivals', occasion_type: 'FESTIVAL', display_order: 1, is_active: true },
    { name: 'Corporate Gifting', slug: 'corporate-gifting', occasion_type: 'CORPORATE', display_order: 2, is_active: true },
    { name: 'Birthdays & Anniversaries', slug: 'birthdays-anniversaries', occasion_type: 'MILESTONE', display_order: 3, is_active: true },
    { name: 'Wedding', slug: 'wedding', occasion_type: 'WEDDING', display_order: 4, is_active: true },
    { name: 'Self Care', slug: 'self-care', occasion_type: 'GENERAL', display_order: 5, is_active: true },
  ];

  const parentMap = {};
  for (const p of parents) {
    const { data, error } = await supabase
      .from('occasions')
      .upsert(p, { onConflict: 'slug' })
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting ${p.name}:`, error);
      continue;
    }
    parentMap[p.name] = data.id;
    console.log(`Inserted Parent: ${p.name}`);
  }

  const children = [
    { name: 'Diwali', slug: 'diwali', occasion_type: 'FESTIVAL', display_order: 1, is_active: true, parent_id: parentMap['Festivals'] },
    { name: 'Holi', slug: 'holi', occasion_type: 'FESTIVAL', display_order: 2, is_active: true, parent_id: parentMap['Festivals'] },
    { name: 'Raksha Bandhan', slug: 'raksha-bandhan', occasion_type: 'FESTIVAL', display_order: 3, is_active: true, parent_id: parentMap['Festivals'] },
    { name: 'Eid', slug: 'eid', occasion_type: 'FESTIVAL', display_order: 4, is_active: true, parent_id: parentMap['Festivals'] },
    { name: 'Christmas', slug: 'christmas', occasion_type: 'FESTIVAL', display_order: 5, is_active: true, parent_id: parentMap['Festivals'] },
    
    { name: 'Employee Welcome', slug: 'employee-welcome', occasion_type: 'CORPORATE', display_order: 1, is_active: true, parent_id: parentMap['Corporate Gifting'] },
    { name: 'Client Appreciation', slug: 'client-appreciation', occasion_type: 'CORPORATE', display_order: 2, is_active: true, parent_id: parentMap['Corporate Gifting'] },
    { name: 'Work Anniversary', slug: 'work-anniversary', occasion_type: 'CORPORATE', display_order: 3, is_active: true, parent_id: parentMap['Corporate Gifting'] },

    { name: 'For Him', slug: 'birthday-for-him', occasion_type: 'MILESTONE', display_order: 1, is_active: true, parent_id: parentMap['Birthdays & Anniversaries'] },
    { name: 'For Her', slug: 'birthday-for-her', occasion_type: 'MILESTONE', display_order: 2, is_active: true, parent_id: parentMap['Birthdays & Anniversaries'] },
    { name: 'Kids Birthday', slug: 'kids-birthday', occasion_type: 'MILESTONE', display_order: 3, is_active: true, parent_id: parentMap['Birthdays & Anniversaries'] },
    { name: 'Parents Anniversary', slug: 'parents-anniversary', occasion_type: 'MILESTONE', display_order: 4, is_active: true, parent_id: parentMap['Birthdays & Anniversaries'] },

    { name: 'Engagement', slug: 'engagement', occasion_type: 'WEDDING', display_order: 1, is_active: true, parent_id: parentMap['Wedding'] },
    { name: 'Bridal Shower', slug: 'bridal-shower', occasion_type: 'WEDDING', display_order: 2, is_active: true, parent_id: parentMap['Wedding'] },
    { name: 'Return Gifts', slug: 'return-gifts', occasion_type: 'WEDDING', display_order: 3, is_active: true, parent_id: parentMap['Wedding'] },
  ];

  for (const c of children) {
    if (!c.parent_id) continue;
    const { error } = await supabase
      .from('occasions')
      .upsert(c, { onConflict: 'slug' });
    
    if (error) {
      console.error(`Error inserting child ${c.name}:`, error);
    } else {
      console.log(`Inserted Child: ${c.name}`);
    }
  }

  console.log("Seed completed successfully!");
}

seedOccasions();

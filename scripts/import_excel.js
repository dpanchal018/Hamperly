const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define mappings for Recipient Tags and Genders
// NOTE: values must match the case used by the genders lookup table seed
// (supabase/migrations/0015_phase1_modular_catalog.sql inserts 'MALE'/'FEMALE' uppercase)
const GENDER_MAP = {
  'Male': 'MALE',
  'Female': 'FEMALE',
  'Grooms Personal Hamper': 'MALE',
  'Brides Personal Hamper': 'FEMALE',
  'Bridesmaid Hampers': 'FEMALE',
  'Groomsmen Hampers': 'MALE'
};

const RECIPIENT_TAGS = ['Couple', 'Kids', 'Mom-to-Be', 'Baby', 'Mom + Baby', 'Client Oriented', 'Employee Oriented'];

async function run() {
  console.log("Starting Excel Import...");
  
  // 1. Setup Base Data (Category)
  let { data: cat } = await supabase.from('categories').select('id').eq('slug', 'general').single();
  if (!cat) {
    const res = await supabase.from('categories').insert({ name: 'General', slug: 'general', description: 'General' }).select().single();
    cat = res.data;
  }
  const defaultCategoryId = cat.id;

  // Read CSV
  const fileContent = fs.readFileSync('scripts/raw_data.csv', 'utf-8');
  const records = parse(fileContent, { columns: true, skip_empty_lines: true });
  
  for (const record of records) {
    const productName = record['Product Item'].trim();
    if (!productName) continue;
    
    const occasionsStr = record['Used Across Occasions'] || '';
    const eventsStr = record['Used Across Events'] || '';
    
    // Parse commas, keeping in mind the CSV parser already handles quotes
    const parents = occasionsStr.split(',').map(s => s.trim()).filter(Boolean);
    const events = eventsStr.split(',').map(s => s.trim()).filter(Boolean);

    // Create/Find Product
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let { data: product } = await supabase.from('products').select('id, gender_id').eq('slug', slug).single();
    
    if (!product) {
      const res = await supabase.from('products').insert({
        name: productName,
        slug: slug,
        category_id: defaultCategoryId,
        status: 'active',
        stock_quantity: 100 // Dummy stock
      }).select().single();
      product = res.data;
      console.log(`Created product: ${productName}`);
      
      // Default pricing
      await supabase.from('product_pricing').insert({
        product_id: product.id,
        cost_price: 100,
        target_margin: 0.3
      });
    }
    
    // Arrays to collect IDs
    let occasionIds = [];
    let recipientTagIds = [];
    let targetGenderId = null;

    // Process Parents (Occasions)
    for (const p of parents) {
      const pSlug = p.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let { data: parentOcc } = await supabase.from('occasions').select('id').eq('slug', pSlug).single();
      if (!parentOcc) {
         const res = await supabase.from('occasions').insert({ name: p, slug: pSlug, occasion_type: 'GENERAL' }).select().single();
         parentOcc = res.data;
      }
      occasionIds.push(parentOcc.id);
    }
    
    // Process Events (Children, Tags, Genders)
    for (const e of events) {
      if (GENDER_MAP[e]) {
        // Map to Gender
        let { data: g } = await supabase.from('genders').select('id').eq('name', GENDER_MAP[e]).single();
        if (g) targetGenderId = g.id;
      } 
      
      if (RECIPIENT_TAGS.includes(e) || e.includes('Hamper') || e === 'Couple') {
        // Map to Recipient Tag
        let { data: tag } = await supabase.from('recipient_tags').select('id').eq('name', e).single();
        if (!tag) {
           const res = await supabase.from('recipient_tags').insert({ name: e }).select().single();
           if (res.error) {
              console.error('Error inserting recipient tag:', e, res.error);
              continue;
           }
           tag = res.data;
        }
        if (tag) recipientTagIds.push(tag.id);
      } 
      
      if (!GENDER_MAP[e] && !RECIPIENT_TAGS.includes(e) && !e.includes('Hamper') && e !== 'Couple') {
        // Map to Occasion Child (attach to the first parent for simplicity, or just a standalone occasion)
        const eSlug = e.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        let { data: childOcc } = await supabase.from('occasions').select('id').eq('slug', eSlug).single();
        if (!childOcc) {
           // Find parent id if exists
           const parentId = occasionIds.length > 0 ? occasionIds[0] : null;
           const res = await supabase.from('occasions').insert({ name: e, slug: eSlug, parent_id: parentId, occasion_type: 'GENERAL' }).select().single();
           if (res.error) {
              console.error('Error inserting occasion child:', e, res.error);
              continue;
           }
           childOcc = res.data;
        }
        if (childOcc) occasionIds.push(childOcc.id);
      }
    }

    // Apply Gender if found
    if (targetGenderId && targetGenderId !== product.gender_id) {
       await supabase.from('products').update({ gender_id: targetGenderId }).eq('id', product.id);
    }

    // Link Occasions
    if (occasionIds.length > 0) {
      const uniqueOccIds = [...new Set(occasionIds)];
      for (const oid of uniqueOccIds) {
         await supabase.from('product_occasions').upsert({ product_id: product.id, occasion_id: oid }, { onConflict: 'product_id,occasion_id' });
      }
    }

    // Link Recipient Tags
    if (recipientTagIds.length > 0) {
      const uniqueTagIds = [...new Set(recipientTagIds)];
      for (const tid of uniqueTagIds) {
         await supabase.from('product_recipient_tags').upsert({ product_id: product.id, recipient_tag_id: tid }, { onConflict: 'product_id,recipient_tag_id' });
      }
    }
  }
  
  console.log("Import Complete!");
}

run().catch(console.error);

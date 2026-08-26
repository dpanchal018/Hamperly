const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xgezyhyjfouoqmwcypmr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZXp5aHlqZm91b3Ftd2N5cG1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjYxMjY4MiwiZXhwIjoyMTAyMTg4NjgyfQ.pVYTdh3vPh3npg6QucSkdJKc7NnjKYK1DXl2PU0IPXw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const NUM_CUSTOMERS = 50;
const PASSWORD = 'BulkTest@2026';
const EMAIL_DOMAIN = 'hamperly.test';
const PAYMENT_MODES = ['UPI', 'CASH', 'NET_BANKING', 'CREDIT_CARD', 'DEBIT_CARD'];
const INDIAN_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
const INDIAN_NAMES = [
  'Aarav Sharma', 'Vivaan Patel', 'Aditya Singh', 'Vihaan Gupta', 'Arjun Kumar',
  'Sai Reddy', 'Reyansh Joshi', 'Ayaan Khan', 'Krishna Iyer', 'Ishaan Nair',
  'Ananya Desai', 'Diya Mehta', 'Myra Kapoor', 'Sara Ali', 'Aadhya Rao',
  'Isha Verma', 'Kavya Mishra', 'Anika Choudhury', 'Priya Srivastava', 'Riya Das',
  'Rohan Bhat', 'Kabir Saxena', 'Shaurya Tiwari', 'Dhruv Pandey', 'Arnav Jain',
  'Lakshmi Pillai', 'Neha Agarwal', 'Pooja Bansal', 'Shreya Kulkarni', 'Tanvi Bose',
  'Rahul Malhotra', 'Vikram Chauhan', 'Manish Thakur', 'Suresh Yadav', 'Rajesh Dubey',
  'Meera Sethi', 'Nisha Bhatt', 'Sakshi Goyal', 'Divya Arora', 'Swati Mukherjee',
  'Amit Rastogi', 'Deepak Soni', 'Gaurav Chopra', 'Harsh Sinha', 'Karan Mahajan',
  'Simran Kaur', 'Tanya Luthra', 'Urvashi Kohli', 'Varun Dhawan', 'Zara Sheikh'
];

const report = {
  startTime: null, endTime: null,
  phase1: { customersCreated: 0, errors: [] },
  phase2: { ordersPlaced: 0, totalUnitsOrdered: 0, errors: [] },
  phase3: { ordersCompleted: 0, totalRevenue: 0, errors: [] },
  phase4: { validations: [] },
  originalStock: {}, finalStock: {},
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function genPhone() { return `+91${randomInt(7000000000, 9999999999)}`; }
function genAddress(city) {
  const streets = ['MG Road', 'Station Road', 'Park Street', 'Ring Road', 'Civil Lines', 'Nehru Nagar', 'Gandhi Chowk', 'Lake View Colony'];
  return `Flat ${randomInt(1,500)}, ${randomChoice(streets)}, ${city} - ${randomInt(100000,999999)}`;
}
function genRef() { return `CUS-${Math.random().toString(36).substring(2,8).toUpperCase()}`; }

// PHASE 1
async function phase1(){ 
  console.log('\n' + '='.repeat(60));
  console.log('  PHASE 1: CREATING 50 TEST CUSTOMERS');
  console.log('='.repeat(60));
  const created = [];
  for (let i = 1; i <= NUM_CUSTOMERS; i++) {
    const pad = String(i).padStart(2,'0');
    const email = `bulktest${pad}@${EMAIL_DOMAIN}`;
    const name = INDIAN_NAMES[i-1];
    const city = randomChoice(INDIAN_CITIES);
    try {
      const { data: ud, error: ue } = await supabase.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name: name } });
      if (ue) {
        if (ue.message.includes('already been registered')) {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const eu = users.find(u => u.email === email);
          if (eu) { const { data: ec } = await supabase.from('customers').select('id').eq('user_id', eu.id).single(); if (ec) created.push({ id: ec.id, email, fullName: name }); }
          report.phase1.customersCreated++;
          continue;
        }
        throw ue;
      }
      await supabase.from('user_roles').insert({ user_id: ud.user.id, role: 'CUSTOMER' });
      const { data: cd, error: ce } = await supabase.from('customers').insert({ user_id: ud.user.id, full_name: name, email, mobile_number: genPhone(), city, address: genAddress(city), customer_reference: genRef(), is_active: true }).select('id').single();
      if (ce) throw ce;
      created.push({ id: cd.id, email, fullName: name });
      report.phase1.customersCreated++;
      process.stdout.write(`  [${i}/${NUM_CUSTOMERS}] Created: ${name}\r`);
    } catch (err) {
      report.phase1.errors.push({ customer: email, error: err.message });
      console.error(`  [ERR] ${email}: ${err.message}`);
    }
    if (i % 10 === 0) await sleep(500);
  }
  console.log(`\n  Done: ${report.phase1.customersCreated} customers (${report.phase1.errors.length} errors)`);
  return created;
}

// PHASE 2
async function phase2(customers) {
  console.log('\n' + '='.repeat(60));
  console.log('  PHASE 2: PLACING ORDERS TO EXHAUST INVENTORY');
  console.log('='.repeat(60));
  const { data: hampers } = await supabase.from('hampers').select('id, name, selling_price, actual_cost, stock_quantity, is_active').eq('is_active', true).gt('stock_quantity', 0).order('name');
  if (!hampers || hampers.length === 0) { console.log('No hampers with stock!'); return []; }
  console.log(`  Active hampers: ${hampers.length}, Total stock: ${hampers.reduce((s,h) => s+h.stock_quantity, 0)}`);
  hampers.forEach(h => { report.originalStock[h.name] = h.stock_quantity; });
  
  const stock = {}; hampers.forEach(h => { stock[h.id] = h.stock_quantity; });
  const queue = [];
  let idx = 0;
  while (Object.values(stock).some(s => s > 0)) {
    const avail = hampers.filter(h => stock[h.id] > 0);
    if (avail.length === 0) break;
    const roll = Math.random();
    let items = [];
    if (roll < 0.60 || avail.length === 1) {
      const h = randomChoice(avail); items.push({ hamper: h, qty: 1 }); stock[h.id] -= 1;
    } else if (roll < 0.85) {
      const h = randomChoice(avail); const q = Math.min(2, stock[h.id]); items.push({ hamper: h, qty: q }); stock[h.id] -= q;
    } else {
      const n = Math.min(randomInt(2,3), avail.length);
      const sh = [...avail].sort(() => Math.random()-0.5);
      for (let j = 0; j < n; j++) { if (stock[sh[j].id] >= 1) { items.push({ hamper: sh[j], qty: 1 }); stock[sh[j].id] -= 1; } }
    }
    if (items.length > 0) { queue.push({ customer: customers[idx % customers.length], items }); idx++; }
  }
  console.log(`  Order queue: ${queue.length} orders\n`);
  
  const pIds = [];
  for (let i = 0; i < queue.length; i++) {
    const o = queue[i];
    try {
      const sub = o.items.reduce((s,it) => s + it.hamper.selling_price * it.qty, 0);
      const { data: p, error: pe } = await supabase.from('purchases').insert({
        customer_id: o.customer.id, purchase_date: new Date().toISOString(), sale_source: 'WEBSITE',
        subtotal: sub, discount: 0, final_amount: sub, amount_paid: 0, amount_due: sub,
        status: 'CONFIRMED', payment_status: 'PENDING',
      }).select('id').single();
      if (pe) throw pe;
      const pitems = o.items.map(it => ({
        purchase_id: p.id, product_id: null, product_name_snapshot: it.hamper.name,
        category_snapshot: 'Pre-packaged Hamper', quantity: it.qty,
        catalog_unit_price: it.hamper.actual_cost, actual_unit_price: it.hamper.selling_price,
        line_total: it.hamper.selling_price * it.qty,
      }));
      const { error: ie } = await supabase.from('purchase_items').insert(pitems);
      if (ie) throw ie;
      pIds.push(p.id);
      report.phase2.ordersPlaced++;
      report.phase2.totalUnitsOrdered += o.items.reduce((s,it) => s + it.qty, 0);
      process.stdout.write(`  [${i+1}/${queue.length}] Order: Rs.${sub} for ${o.customer.fullName}\r`);
    } catch (err) {
      report.phase2.errors.push({ customer: o.customer.email, error: err.message });
    }
    if (i % 20 === 0) await sleep(300);
  }
  console.log(`\n  Done: ${report.phase2.ordersPlaced} orders, ${report.phase2.totalUnitsOrdered} units (${report.phase2.errors.length} errors)`);
  return pIds;
}

// PHASE 3
async function phase3(pIds) {
  console.log('\n' + '='.repeat(60));
  console.log('  PHASE 3: PROCESSING PAYMENTS & COMPLETING');
  console.log('='.repeat(60));
  for (let i = 0; i < pIds.length; i++) {
    try {
      const { data: p } = await supabase.from('purchases').select('*, purchase_items(*)').eq('id', pIds[i]).single();
      const pm = randomChoice(PAYMENT_MODES);
      await supabase.from('purchases').update({ amount_paid: p.final_amount, amount_due: 0, payment_status: 'PAID', payment_mode: pm, updated_at: new Date().toISOString() }).eq('id', pIds[i]);
      await supabase.from('payment_logs').insert({ purchase_id: pIds[i], amount: p.final_amount, payment_mode: pm });
      for (const it of p.purchase_items) {
        if (it.product_name_snapshot) {
          const { data: h } = await supabase.from('hampers').select('id, stock_quantity').eq('name', it.product_name_snapshot).single();
          if (h) await supabase.from('hampers').update({ stock_quantity: Math.max(0, h.stock_quantity - (it.quantity||1)) }).eq('id', h.id);
        }
      }
      await supabase.from('purchases').update({ status: 'COMPLETED', updated_at: new Date().toISOString() }).eq('id', pIds[i]);
      report.phase3.ordersCompleted++;
      report.phase3.totalRevenue += Number(p.final_amount);
      process.stdout.write(`  [${i+1}/${pIds.length}] Completed: Rs.${p.final_amount} via ${pm}\r`);
    } catch (err) {
      report.phase3.errors.push({ purchaseId: pIds[i], error: err.message });
    }
    if (i % 15 === 0) await sleep(200);
  }
  console.log(`\n  Done: ${report.phase3.ordersCompleted} completed, Rs.${report.phase3.totalRevenue.toLocaleString('en-IN')} revenue (${report.phase3.errors.length} errors)`);
}

// PHASE 4
async function phase4(customers, pIds) {
  console.log('\n' + '='.repeat(60));
  console.log('  PHASE 4: VALIDATION');
  console.log('='.repeat(60));
  function chk(n, ok, d) { console.log(`  ${ok?'PASS':'FAIL'}: ${n}${d?' -- '+d:''}`); report.phase4.validations.push({name:n,passed:ok,detail:d||''}); }
  
  const { count: cc } = await supabase.from('customers').select('*',{count:'exact',head:true}).like('email','%@hamperly.test');
  chk('50 test customers exist', cc >= NUM_CUSTOMERS, `Found ${cc}`);
  
  const { data: ap } = await supabase.from('purchases').select('id,status,payment_status,final_amount,amount_paid,amount_due,customer_id').in('id', pIds);
  chk('All orders COMPLETED', ap?.filter(p=>p.status==='COMPLETED').length===pIds.length, `${ap?.filter(p=>p.status==='COMPLETED').length}/${pIds.length}`);
  chk('All orders PAID', ap?.filter(p=>p.payment_status==='PAID').length===pIds.length, `${ap?.filter(p=>p.payment_status==='PAID').length}/${pIds.length}`);
  chk('All amount_due = 0', ap?.filter(p=>Number(p.amount_due)===0).length===pIds.length, `${ap?.filter(p=>Number(p.amount_due)===0).length}/${pIds.length}`);
  
  const { data: fh } = await supabase.from('hampers').select('name, stock_quantity, is_active').eq('is_active', true).order('name');
  let allZero = true;
  fh?.forEach(h => { report.finalStock[h.name] = h.stock_quantity; if (h.stock_quantity > 0 && report.originalStock[h.name] > 0) allZero = false; });
  chk('All hamper stock = 0', allZero, fh?.map(h=>`${h.name}:${h.stock_quantity}`).join(', '));
  
  const { count: ic } = await supabase.from('purchase_items').select('*',{count:'exact',head:true}).in('purchase_id', pIds);
  chk('Purchase items exist', ic >= pIds.length, `${ic} items for ${pIds.length} orders`);
  
  const { count: lc } = await supabase.from('payment_logs').select('*',{count:'exact',head:true}).in('purchase_id', pIds);
  chk('Payment logs exist', lc >= pIds.length, `${lc} logs for ${pIds.length} orders`);
  
  const tf = ap?.reduce((s,p)=>s+Number(p.final_amount),0)||0;
  const tp = ap?.reduce((s,p)=>s+Number(p.amount_paid),0)||0;
  chk('Revenue = Amount Paid', Math.abs(tf-tp)<1, `final: Rs.${tf.toLocaleString('en-IN')}, paid: Rs.${tp.toLocaleString('en-IN')}`);
  
  const uniCust = new Set(ap?.map(p=>p.customer_id));
  chk('Orders across multiple customers', uniCust.size > 1, `${uniCust.size} unique customers`);
  
  console.log(`\n  ${report.phase4.validations.filter(v=>v.passed).length}/${report.phase4.validations.length} checks passed`);
}

// MAIN
async function main() {
  report.startTime = new Date();
  console.log('\n  HAMPERLY BULK TEST — STARTED AT ' + report.startTime.toLocaleString('en-IN'));
  
  const customers = await phase1();
  if (!customers.length) { console.error('Aborting.'); return; }
  const pIds = await phase2(customers);
  if (!pIds.length) { console.error('Aborting.'); return; }
  await phase3(pIds);
  await phase4(customers, pIds);
  
  report.endTime = new Date();
  console.log('\n' + '='.repeat(60));
  console.log('  FINAL REPORT');
  console.log('='.repeat(60));
  console.log(`  Duration: ${((report.endTime - report.startTime)/1000).toFixed(1)}s`);
  console.log(`  Customers: ${report.phase1.customersCreated}`);
  console.log(`  Orders: ${report.phase2.ordersPlaced}`);
  console.log(`  Units: ${report.phase2.totalUnitsOrdered}`);
  console.log(`  Completed: ${report.phase3.ordersCompleted}`);
  console.log(`  Revenue: Rs.${report.phase3.totalRevenue.toLocaleString('en-IN')}`);
  console.log('\n  --- Stock: Before -> After ---');
  for (const n of Object.keys(report.originalStock).sort()) console.log(`  ${n}: ${report.originalStock[n]} -> ${report.finalStock[n]??'?'}`);
  
  const errs = report.phase1.errors.length + report.phase2.errors.length + report.phase3.errors.length;
  if (errs) { console.log(`\n  Errors: ${errs}`); [...report.phase1.errors,...report.phase2.errors,...report.phase3.errors].forEach(e=>console.log(`    ${JSON.stringify(e)}`)); }
  
  const pass = report.phase4.validations.filter(v=>v.passed).length;
  console.log(`\n  Validation: ${pass}/${report.phase4.validations.length} passed`);
  console.log(pass === report.phase4.validations.length ? '  ALL PASSED!' : '  SOME FAILED!');
  
  const fs = require('fs');
  fs.writeFileSync('bulk_test_report.json', JSON.stringify({ ...report, purchaseIds: pIds, customerEmails: customers.map(c=>c.email) }, null, 2), 'utf8');
  console.log('  Report saved to bulk_test_report.json\n');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTelegramMessage } from '@/actions/telegram.actions';

// Ensure the cron can run without auth
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Optional security: Verify a bearer token sent by Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role to bypass RLS for cron job
    );

    // Calculate Today's Date boundaries strictly for IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    
    const istStart = new Date(istNow);
    istStart.setUTCHours(0, 0, 0, 0);
    
    const istEnd = new Date(istNow);
    istEnd.setUTCHours(23, 59, 59, 999);
    
    const startISO = new Date(istStart.getTime() - istOffset).toISOString();
    const endISO = new Date(istEnd.getTime() - istOffset).toISOString();

    // 1. Fetch Today's Purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, status, final_amount')
      .gte('purchase_date', startISO)
      .lte('purchase_date', endISO);

    if (purchaseError) throw purchaseError;

    // 2. Fetch Low Stock Items
    const { data: lowHampers } = await supabase.from('hampers').select('name, stock_quantity').lte('stock_quantity', 3).eq('is_active', true);
    const { data: lowProducts } = await supabase.from('products').select('name, stock_quantity').lte('stock_quantity', 3).eq('is_active', true);

    // 3. Calculate Metrics
    let totalCompleted = 0;
    let totalRevenue = 0;
    let totalCancelled = 0;
    let totalPending = 0;

    purchases?.forEach(p => {
      if (p.status === 'COMPLETED') {
        totalCompleted++;
        totalRevenue += Number(p.final_amount || 0);
      } else if (p.status === 'CANCELLED') {
        totalCancelled++;
      } else {
        totalPending++;
      }
    });

    // 4. Format Message
    const dateStr = istNow.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    let message = `📊 <b>End of Day Summary</b> 📊\n📅 ${dateStr}\n\n`;
    message += `<b>💰 Revenue:</b> ₹${totalRevenue.toLocaleString('en-IN')}\n`;
    message += `<b>✅ Completed Orders:</b> ${totalCompleted}\n`;
    message += `<b>⏳ Pending Orders:</b> ${totalPending}\n`;
    message += `<b>❌ Cancelled Orders:</b> ${totalCancelled}\n\n`;

    const allLowStock = [...(lowHampers || []), ...(lowProducts || [])];
    if (allLowStock.length > 0) {
      message += `⚠️ <b>Low Stock Warnings (${allLowStock.length}):</b>\n`;
      allLowStock.slice(0, 5).forEach(item => {
        message += `- ${item.name} (${item.stock_quantity} left)\n`;
      });
      if (allLowStock.length > 5) {
        message += `- ...and ${allLowStock.length - 5} more.\n`;
      }
    } else {
      message += `✅ <b>Inventory:</b> All active items are fully stocked.\n`;
    }

    message += `\n<i>Log into the Admin Portal for full details.</i>`;

    // 5. Send Telegram Message
    const result = await sendTelegramMessage(message, 'SUMMARY');

    if (!result.success) throw new Error(result.error);

    return NextResponse.json({ success: true, message: 'Daily summary sent' });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

'use server';

import { createClient } from '@supabase/supabase-js';

export async function sendTelegramMessage(text: string, type: 'ALERT' | 'SUMMARY' = 'ALERT') {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const fallbackChatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken) {
    console.warn('Telegram bot token not configured. Skipping notification.');
    return { success: false, error: 'Telegram bot token missing' };
  }

  try {
    // Connect as admin to bypass RLS and read all user_roles
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch dynamic chat IDs from database
    let query = supabaseAdmin
      .from('user_roles')
      .select('telegram_chat_id')
      .not('telegram_chat_id', 'is', null);

    if (type === 'SUMMARY') {
      query = query.eq('receives_daily_summary', true);
    }

    const { data: users, error: dbError } = await query;
    
    if (dbError) {
      console.error('Error fetching Telegram IDs from DB:', dbError);
    }

    // Extract non-empty IDs
    const dynamicChatIds = (users || [])
      .map(u => u.telegram_chat_id)
      .filter((id): id is string => Boolean(id && id.trim().length > 0));

    // Determine final list of recipients
    let recipients = [...new Set(dynamicChatIds)];

    // If no one is configured in the DB, fallback to the .env.local ID
    if (recipients.length === 0 && fallbackChatId) {
      recipients = [fallbackChatId];
    }

    if (recipients.length === 0) {
      console.warn('No Telegram chat IDs found in DB or env. Skipping notification.');
      return { success: false, error: 'No Telegram recipients found' };
    }

    // Send messages in parallel
    const promises = recipients.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Telegram API error for chat ${chatId}:`, errorData);
        throw new Error(`Failed to send to ${chatId}`);
      }
      return true;
    });

    const results = await Promise.allSettled(promises);
    const hasSuccess = results.some(r => r.status === 'fulfilled');

    if (!hasSuccess) {
      return { success: false, error: 'Failed to send to any recipients' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendTelegramMessage:', error);
    return { success: false, error: 'Network error sending Telegram message' };
  }
}

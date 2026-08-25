// @ts-nocheck
import { streamText, tool, CoreMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Auth check to ensure this is an admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Vercel AI SDK 4.0 UI messages use `parts` instead of `content`
    // Gemini also strictly requires alternating roles, so we merge consecutive messages of the same role
    const coreMessages: any[] = [];
    let currentRole = null;
    let currentContent = '';

    for (const m of messages) {
      let content = m.content || '';
      if (!content && m.parts) {
        content = m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
      }
      
      if (m.role === currentRole) {
        currentContent += '\n' + content;
      } else {
        if (currentRole) {
          coreMessages.push({ role: currentRole, content: currentContent });
        }
        currentRole = m.role;
        currentContent = content;
      }
    }
    if (currentRole) {
      coreMessages.push({ role: currentRole, content: currentContent });
    }

    const result = await streamText({
      model: google('gemini-3.5-flash-lite'),
      system: `You are the Hamperly Admin Copilot, a highly capable store manager AI assistant. 
Your job is to provide the store owner with clear, data-driven insights and perform management tasks.
Always be professional, concise, and helpful. 
You can dynamically query any core database table (products, hampers, purchases, customers, categories, etc.) to answer ANY question the admin has. When fetching purchases, ALWAYS pass select="*, customers(full_name)" to get the human-readable customer name instead of just the ID.
You can also update stock/prices, check low stock, summarize revenue and profit, fetch recent orders, and update order statuses.
CRITICAL RULE: You are STRICTLY FORBIDDEN from performing bulk updates by iterating and executing multiple update commands (e.g. updating 10 items to 0). If the user asks you to "Update ALL" or perform a bulk action, you MUST refuse and state that you can only update one specific item at a time. Do not try to be helpful by doing it one-by-one.
When asked about revenue or profit, display it in Indian Rupees (₹).
Do NOT use markdown tables. Format multiple records (like recent orders or low stock items) as clean, bulleted lists.`,
      messages: coreMessages,
      stopWhen: (step) => step.stepCount === 5,
      tools: {
        getBusinessSummary: tool({
          description: 'Get a summary of total revenue, total profit, and total orders over a specified time range.',
          parameters: z.object({
            timeRange: z.enum(['today', 'last_7_days', 'last_30_days', 'all_time']).optional().describe('The time period to summarize (defaults to all_time)'),
          }),
          execute: async ({ timeRange = 'all_time' }) => {
            try {
              const supabase = await createClient();
              let query = supabase.from('purchases').select('final_amount, purchase_items(quantity, catalog_unit_price)').eq('status', 'COMPLETED');
              
              if (timeRange !== 'all_time') {
                const date = new Date();
                if (timeRange === 'today') {
                  date.setHours(0, 0, 0, 0);
                } else if (timeRange === 'last_7_days') {
                  date.setDate(date.getDate() - 7);
                } else if (timeRange === 'last_30_days') {
                  date.setDate(date.getDate() - 30);
                }
                query = query.gte('created_at', date.toISOString());
              }

              const { data, error } = await query;
              if (error) return { error: error.message };

              const totalCompletedOrders = data.length;
              let totalRevenue = 0;
              let totalProfit = 0;
              
              for (const order of data) {
                const amount = Number(order.final_amount) || 0;
                totalRevenue += amount;
                
                let orderCost = 0;
                if (order.purchase_items) {
                  for (const item of order.purchase_items) {
                    orderCost += (Number(item.catalog_unit_price) || 0) * (Number(item.quantity) || 0);
                  }
                }
                totalProfit += (amount - orderCost);
              }

              return {
                timeRange,
                totalCompletedOrders,
                totalRevenue,
                totalProfit,
                note: "This reflects ONLY orders with a 'COMPLETED' status."
              };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        getRecentOrders: tool({
          description: 'Fetch the most recent customer orders/purchases, including customer names.',
          parameters: z.object({
            limit: z.number().optional().describe('Number of recent orders to fetch (defaults to 5)'),
          }),
          execute: async ({ limit = 5 }) => {
            try {
              const supabase = await createClient();
              const { data, error } = await supabase
                .from('purchases')
                .select('id, created_at, final_amount, status, payment_mode, customers(full_name, email, mobile_number)')
                .order('created_at', { ascending: false })
                .limit(limit);
                
              if (error) return { error: error.message };
              return { results: data };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        getLowStockAlerts: tool({
          description: 'Check for products or hampers that have low stock quantity.',
          parameters: z.object({
            threshold: z.number().optional().describe('Stock quantity threshold to trigger alert (defaults to 5)'),
          }),
          execute: async ({ threshold = 5 }) => {
            try {
              const supabase = await createClient();
              
              const [productRes, hamperRes] = await Promise.all([
                supabase.from('products').select('name, stock_quantity').lte('stock_quantity', threshold).eq('status', 'active'),
                supabase.from('hampers').select('name, stock_quantity').lte('stock_quantity', threshold).eq('is_active', true)
              ]);
              
              return {
                lowStockProducts: productRes.data || [],
                lowStockHampers: hamperRes.data || [],
                productError: productRes.error ? productRes.error.message : null,
                hamperError: hamperRes.error ? hamperRes.error.message : null
              };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        fetchDatabaseRecords: tool({
          description: 'Fetch records dynamically from any core table (e.g. to find pending orders, use tableName="purchases", filterColumn="status", filterValue="PENDING").',
          parameters: z.object({
            tableName: z.string().describe('The database table to query (e.g., "purchases", "customers", "products")'),
            select: z.string().optional().describe('Columns to select, defaults to "*". Can use joins like "*, customers(full_name)"'),
            filterColumn: z.string().optional().describe('Exact column to filter on (e.g. "status", "payment_mode")'),
            filterValue: z.string().optional().describe('Exact value to filter by (e.g. "PENDING", "COMPLETED")'),
            limit: z.number().optional().describe('Limit the number of rows returned (defaults to 20)'),
            orderBy: z.string().optional().describe('Column to order by')
          }),
          execute: async ({ tableName, select = '*', filterColumn, filterValue, limit = 20, orderBy }) => {
            try {
              // Handle common LLM table name hallucinations
              let actualTable = tableName || 'purchases';
              if (actualTable === 'orders') actualTable = 'purchases';
              if (actualTable === 'users') actualTable = 'customers';
              
              const supabase = await createClient();
              let query = supabase.from(actualTable).select(select);
              
              if (filterColumn && filterValue !== undefined) {
                // If it's status, enforce uppercase to match DB enums
                let val = filterValue;
                if (filterColumn.toLowerCase() === 'status') val = String(val).toUpperCase();
                if (filterColumn.toLowerCase() === 'payment_status') val = String(val).toUpperCase();
                
                query = query.eq(filterColumn, val);
              }
              
              if (orderBy) {
                query = query.order(orderBy, { ascending: false });
              }
              
              const { data, error } = await query.limit(Math.min(limit, 50));
              
              if (error) return { error: error.message };
              return { results: data };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        getStoreSummary: tool({
          description: 'Get high-level summary counts of the store catalog, such as the total number of active products, hampers, and categories.',
          parameters: z.object({}),
          execute: async () => {
            try {
              const supabase = await createClient();
              const [products, hampers, categories] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('hampers').select('*', { count: 'exact', head: true }).eq('is_active', true),
                supabase.from('categories').select('*', { count: 'exact', head: true })
              ]);
              
              return {
                totalActiveProducts: products.count || 0,
                totalActiveHampers: hampers.count || 0,
                totalCategories: categories.count || 0
              };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        checkInventory: tool({
          description: 'Search for a specific product or hamper by name to check its current stock quantity and price.',
          parameters: z.object({
            query: z.string().describe('The name of the product or hamper to search for (e.g. "Glass boys hamper")'),
          }),
          execute: async ({ query }) => {
            try {
              const supabase = await createClient();
              
              const [products, hampers] = await Promise.all([
                supabase.from('products').select('name, stock_quantity, selling_price, status').ilike('name', `%${query}%`),
                supabase.from('hampers').select('name, stock_quantity, selling_price, is_active').ilike('name', `%${query}%`)
              ]);
              
              return {
                products: products.data || [],
                hampers: hampers.data || []
              };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        updateStock: tool({
          description: 'Update the stock quantity of a specific product or hamper by name.',
          parameters: z.object({
            type: z.string().optional().describe('Whether the item is a product or a hamper (optional)'),
            name: z.string().describe('The name of the item to update'),
            newStock: z.number().optional().describe('The new stock quantity to set'),
            quantity: z.number().optional().describe('Fallback for stock quantity')
          }),
          execute: async ({ type, name, newStock, quantity }) => {
            try {
              if (name.includes('%') || name.toLowerCase() === 'all') {
                return { error: "Bulk updates are not permitted. Please specify an exact item name." };
              }
              const stock = newStock !== undefined ? newStock : quantity;
              if (stock === undefined) return { error: "Please provide the new stock quantity." };
              if (stock < 0) return { error: "Invalid operation: Stock quantity cannot be negative. Please ask the user to provide a valid positive number or 0." };
              
              const supabase = await createClient();
              
              // If type isn't specified, try both tables
              let tables = ['hampers', 'products'];
              if (type === 'product') tables = ['products'];
              if (type === 'hamper') tables = ['hampers'];
              
              let lastError = null;
              for (const table of tables) {
                const { data, error } = await supabase
                  .from(table)
                  .update({ stock_quantity: stock })
                  .ilike('name', name)
                  .select('name, stock_quantity');
                  
                if (error) lastError = error.message;
                if (data && data.length > 0) {
                  return { success: true, updatedItem: data[0], table };
                }
              }
              
              if (lastError) return { error: `Database error: ${lastError}` };
              return { error: `No item found matching name "${name}"` };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        updatePrice: tool({
          description: 'Update the selling price of a specific product or hamper by name.',
          parameters: z.object({
            type: z.string().optional().describe('Whether the item is a product or a hamper (optional)'),
            name: z.string().describe('The name of the item to update'),
            newPrice: z.number().optional().describe('The new selling price to set'),
            price: z.number().optional().describe('Fallback for price')
          }),
          execute: async ({ type, name, newPrice, price }) => {
            try {
              if (name.includes('%') || name.toLowerCase() === 'all') {
                return { error: "Bulk updates are not permitted. Please specify an exact item name." };
              }
              const val = newPrice !== undefined ? newPrice : price;
              if (val === undefined) return { error: "Please provide the new price." };
              if (val < 0) return { error: "Invalid operation: Selling price cannot be negative." };
              
              const supabase = await createClient();
              
              let tables = ['hampers', 'products'];
              if (type === 'product') tables = ['products'];
              if (type === 'hamper') tables = ['hampers'];
              
              let lastError = null;
              for (const table of tables) {
                const { data, error } = await supabase
                  .from(table)
                  .update({ selling_price: val })
                  .ilike('name', name)
                  .select('name, selling_price');
                  
                if (error) lastError = error.message;
                if (data && data.length > 0) {
                  return { success: true, updatedItem: data[0], table };
                }
              }
              
              if (lastError) return { error: `Database error: ${lastError}` };
              return { error: `No item found matching name "${name}"` };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        searchCustomers: tool({
          description: 'Search for customers by name, phone, or email to find their details.',
          parameters: z.object({
            query: z.string().describe('The customer name, phone, or email to search for'),
          }),
          execute: async ({ query }) => {
            try {
              const supabase = await createClient();
              const { data, error } = await supabase
                .from('customers')
                .select('full_name, mobile_number, email, customer_reference, city')
                .or(`full_name.ilike.%${query}%,mobile_number.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(5);
                
              if (error) return { error: error.message };
              return { customers: data || [] };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        updatePurchaseStatus: tool({
          description: 'Update the status of a specific purchase/order (e.g., PENDING, COMPLETED, CANCELLED). Automatically handles stock deduction/restoration in the backend.',
          parameters: z.object({
            purchaseId: z.string().describe('The UUID of the purchase/order to update'),
            newStatus: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).describe('The new status for the order')
          }),
          execute: async ({ purchaseId, newStatus }) => {
            try {
              const { updatePurchaseStatus } = await import('@/actions/purchase.actions');
              const result = await updatePurchaseStatus(purchaseId, newStatus as any);
              return { success: !result.error, purchase: result.purchase, error: result.error };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Admin chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// @ts-nocheck
import { streamText, tool, isStepCount, embed, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();
    const supabase = await createClient();

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

    // Phase 2: RAG Memory Bank - Retrieve Past Successful Sessions
    let memoryContext = '';
    try {
      const latestUserMessage = coreMessages[coreMessages.length - 1]?.content;
      if (latestUserMessage) {
        const { embedding } = await embed({
          model: google.textEmbeddingModel('gemini-embedding-2'),
          value: latestUserMessage,
        });
        
        const { data: similarSessions } = await supabase.rpc('match_chat_sessions', {
          query_embedding: `[${embedding.join(',')}]`,
          match_threshold: 0.65,
          match_count: 3
        });
        
        if (similarSessions && similarSessions.length > 0) {
          memoryContext = "\n\nPAST SUCCESSFUL CONVERSATIONS FOR INSPIRATION:\n" + 
            similarSessions.map((s: any) => `- ${s.session_summary}`).join('\n');
        }
      }
    } catch (e) {
      console.error("RAG Embedding retrieval failed (table might not exist yet):", e);
    }

    const systemPrompt = "You are Hamperly's expert shopping concierge. You MUST NOT make up or hallucinate hampers or product categories. You can ONLY recommend hampers that actually exist in the database. When a user asks for hampers, categories, or what you offer, you MUST use the `listAvailableHampers` tool to see the actual database catalogue. When asked to check stock or availability for a specific item, use the `checkInventory` tool. Be concise, luxurious, and highly helpful.\n\nCRITICAL RULES:\n1. All prices are in Indian Rupees (₹). ALWAYS format prices as ₹XXX.\n2. DO NOT ask the user for their payment preference, payment method, or try to process payments.\n3. DO NOT pretend to place an order or generate fake order IDs. If a user wants to buy something, guide them to add the item to their cart on the website and proceed to checkout.\n4. INVENTORY RULES: If an item's `stock_quantity` is `null`, it means we have UNLIMITED stock. If it is `0`, it is OUT OF STOCK. Do not recommend items that are out of stock unless specifically asked." + memoryContext;

    const result = streamText({
      model: google('gemini-3.5-flash-lite'),
      stopWhen: isStepCount(5),
      system: systemPrompt,
      messages: coreMessages,
      tools: {
        listAvailableHampers: tool({
          description: 'Fetch the list of all currently available hampers in the store. Use this whenever the user asks what hampers are available, asks for recommendations, or asks what you offer. This also returns their current stock quantity.',
          parameters: z.object({}),
          execute: async () => {
            try {
              const supabase = await createClient();
              const { data: hampers, error } = await supabase
                .from('hampers')
                .select('name, description, selling_price, stock_quantity')
                .eq('is_active', true)
                .limit(25); // Increased limit to ensure catalog is fully available to AI

              if (error) {
                console.error("Supabase error (listAvailableHampers):", error);
                return { error: "Database error occurred." };
              }

              if (hampers && hampers.length > 0) {
                return { type: 'hampers', results: hampers };
              }
              return { error: 'No active hampers found in the database.' };
            } catch (error: any) {
              return { error: error.message };
            }
          },
        }),
        listOccasions: tool({
          description: 'Get a list of all gifting occasions supported by Hamperly (e.g., Birthday, Diwali, Corporate Gifting).',
          parameters: z.object({}),
          execute: async () => {
            try {
              const supabase = await createClient();
              const { data: occasions, error } = await supabase
                .from('occasions')
                .select('name, slug')
                .eq('is_active', true)
                .order('display_order');
              
              if (error) return { error: "Database error" };
              return { type: 'occasions', results: occasions };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        getProductsForOccasion: tool({
          description: 'Get a list of products recommended for a specific occasion.',
          parameters: z.object({
            occasionSlug: z.string().describe('The slug of the occasion (e.g., birthday, anniversary, diwali)'),
          }),
          execute: async ({ occasionSlug }) => {
            try {
              const supabase = await createClient();
              // First find the occasion
              const { data: occasion } = await supabase.from('occasions').select('id').eq('slug', occasionSlug).single();
              if (!occasion) return { error: "Occasion not found." };

              // Find products linked to this occasion
              const { data: links } = await supabase.from('product_occasions').select('product_id').eq('occasion_id', occasion.id).limit(10);
              if (!links || links.length === 0) return { error: "No products found for this occasion." };

              const productIds = links.map(l => l.product_id);
              const { data: products } = await supabase.from('products').select('name, selling_price').in('id', productIds);
              
              return { type: 'occasion_products', results: products };
            } catch (error: any) {
              return { error: error.message };
            }
          }
        }),
        checkInventory: tool({
          description: 'Search for a specific product or hamper by name. Tip: keep search terms broad (e.g. "evil eye" instead of "evil eye hamper").',
          parameters: z.object({
            productName: z.string().describe('The broad name of the product or hamper to search for'),
          }),
          execute: async ({ productName }) => {
            try {
              const supabase = await createClient();
              
              // Search both products and hampers simultaneously
              const [productRes, hamperRes] = await Promise.all([
                supabase
                  .from('products')
                  .select('name, selling_price, stock_quantity')
                  .ilike('name', `%${productName}%`)
                  .limit(5),
                supabase
                  .from('hampers')
                  .select('name, selling_price, stock_quantity')
                  .ilike('name', `%${productName}%`)
                  .limit(5)
              ]);
              
              const results = {
                products: productRes.data || [],
                hampers: hamperRes.data || []
              };

              if (results.products.length > 0 || results.hampers.length > 0) {
                return { type: 'inventory_results', results };
              }

              return { error: `No products or hampers found matching "${productName}". Try an even broader keyword.` };
            } catch (error: any) {
              return { error: error.message };
            }
          },
        }),
      },
      async onFinish({ text }) {
        if (!sessionId || !text) return;
        
        try {
          const db = await createClient();
          
          // Check if the user is currently logged in via cookies
          const { data: { user } } = await db.auth.getUser();
          
          // 1. Ensure the session exists first to satisfy the foreign key constraint
          // We will update the summary and embedding below
          await db.from('chat_sessions').upsert({ 
            id: sessionId,
            customer_id: user ? user.id : null
          }, { onConflict: 'id' });

          // 2. Insert messages
          const latestUser = coreMessages[coreMessages.length - 1];
          if (latestUser) {
            await db.from('chat_messages').insert({ session_id: sessionId, role: 'user', content: latestUser.content });
          }
          await db.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', content: text });
          
          // 3. Summarize the session
          const allMsgs = coreMessages.map(m => `${m.role}: ${m.content}`).join('\n') + `\nassistant: ${text}`;
          
          const { text: summary } = await generateText({
            model: google('gemini-3.5-flash-lite'),
            prompt: `Summarize this customer interaction in 1-2 concise sentences focusing on their gifting needs, the occasion, and the hampers/products discussed:\n\n${allMsgs}`
          });
          
          // 4. Create embedding for the summary
          const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-2'),
            value: summary,
          });
          
          // 5. Update session with summary and embedding
          await db.from('chat_sessions').upsert({
            id: sessionId,
            customer_id: user ? user.id : null,
            session_summary: summary,
            embedding: `[${embedding.join(',')}]`
          }, { onConflict: 'id' });
          
        } catch (e) {
          console.error("Background memory save failed:", e);
        }
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Chat API Error:", error);
    
    // Forward the 429 Rate Limit status if we receive it from Gemini
    if (error?.statusCode === 429 || String(error).includes('429')) {
      return new Response("High traffic volume. Please wait a few seconds.", { status: 429 });
    }

    return new Response(String(error), { status: 500 });
  }
}
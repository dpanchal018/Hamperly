'use client';

import { useState } from 'react';
import { Megaphone, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export function BroadcastButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('PROMOTION');

  const handleSend = async () => {
    if (!title || !message) return toast.error('Title and message required');
    setIsSending(true);
    
    try {
      const supabase = createClient();
      
      // Get all customer users (who have user_id)
      const { data: customers } = await supabase.from('customers').select('id, user_id').not('user_id', 'is', null);
      
      if (!customers || customers.length === 0) {
        toast.error('No registered customers found');
        return;
      }

      const notifications = customers.map(c => ({
        customer_id: c.id,
        title,
        message,
        type,
        is_read: false
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      
      toast.success(`Broadcast sent to ${customers.length} customers!`);
      setIsOpen(false);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
        <Megaphone className="w-4 h-4 mr-2" />
        Broadcast Message
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center text-lg">
                <Megaphone className="w-5 h-5 mr-2 text-indigo-500" /> New Broadcast
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Broadcast Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 px-4 py-2.5 text-sm"
                >
                  <option value="PROMOTION">Marketing Promotion</option>
                  <option value="NEW_COLLECTION">New Collection Launch</option>
                  <option value="EXHIBITION">Exhibition / Event</option>
                  <option value="SYSTEM_ALERT">System Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Early Diwali Access! \uD83C\uDF89"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  placeholder="Type your message to all customers..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleSend} disabled={isSending} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full">
                {isSending ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send to All</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

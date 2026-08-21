'use client';
import { Check, Loader2 } from 'lucide-react';
import { markAllNotificationsAsRead } from '@/actions/notification.actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  return (
    <button 
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await markAllNotificationsAsRead();
        router.refresh();
      }}
      className="inline-flex items-center justify-center rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 text-indigo-500 animate-spin" />
      ) : (
        <Check className="w-4 h-4 mr-2 text-indigo-500" />
      )}
      Mark all as read
    </button>
  );
}

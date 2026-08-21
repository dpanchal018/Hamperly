'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/actions/notification.actions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    const res = await getUnreadNotificationCount();
    if (res.count !== undefined) {
      setUnreadCount(res.count);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await getMyNotifications();
    if (res.notifications) {
      setNotifications(res.notifications);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnreadCount();
    // Setting up polling for real-time fallback
    const interval = setInterval(fetchUnreadCount, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }

    setOpen(false);

    if (notif.type === 'ACCOUNT_WELCOME') {
      router.push('/account');
    } else if (notif.purchase_id) {
      router.push(`/account/purchases/${notif.purchase_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full" aria-label={`Notifications, ${unreadCount} unread`}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-900 mb-1">No notifications yet</p>
              <p className="text-xs text-slate-500">We'll let you know when there's an update to your Hamperly experience.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(notif => (
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 ml-2"></div>}
                      </div>
                      <p className={`text-xs mb-1.5 line-clamp-2 ${!notif.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-2 border-t border-slate-100 bg-slate-50">
          <button onClick={() => { setOpen(false); router.push('/account/notifications'); }} className="w-full py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors text-center">
            View all notifications
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

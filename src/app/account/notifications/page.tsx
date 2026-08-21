import { getMyNotifications, getUnreadNotificationCount } from '@/actions/notification.actions';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MarkAllReadButton } from '@/components/customer/MarkAllReadButton';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const { notifications, error } = await getMyNotifications();
  const { count } = await getUnreadNotificationCount();

  if (error === 'Unauthorized') {
    redirect('/login');
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-indigo-600" />
            Notifications
          </h1>
          <p className="text-slate-500 mt-2">View all your updates, order statuses, and alerts.</p>
        </div>
        
        {count > 0 && <MarkAllReadButton />}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <ul className="divide-y divide-slate-100">
            {notifications.map((notif: any) => {
              const content = (
                <div className="flex p-6 gap-4">
                  <div className="mt-1">
                    {!notif.is_read ? (
                      <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"></div>
                    ) : (
                      <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-base ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notif.title}
                    </h3>
                    <p className={`mt-1 ${!notif.is_read ? 'text-slate-700' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={notif.id} className={`transition-colors ${!notif.is_read ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                  {notif.purchase_id ? (
                    <Link href={`/account/purchases/${notif.purchase_id}`}>
                      {content}
                    </Link>
                  ) : (
                    <div>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications yet</h3>
          <p className="text-slate-500 max-w-sm">
            We'll let you know when there's an update to your Hamperly experience.
          </p>
        </div>
      )}
    </div>
  );
}

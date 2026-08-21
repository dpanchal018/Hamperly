import { logout } from '@/actions/auth.actions';

export async function POST() {
  await logout();
}

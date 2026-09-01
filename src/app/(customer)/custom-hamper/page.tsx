import { redirect } from 'next/navigation';

export default function CustomHamperRedirect() {
  redirect('/build');
}

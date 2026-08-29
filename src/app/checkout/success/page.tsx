import { redirect } from 'next/navigation';

export default async function CheckoutSuccessFallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  if (params.id) {
    redirect(`/checkout/success/${params.id}`);
  }
  redirect('/');
}

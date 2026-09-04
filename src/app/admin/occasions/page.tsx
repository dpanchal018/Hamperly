import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteOccasionButton } from '@/components/admin/DeleteOccasionButton';

export default async function OccasionsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: occasions, error } = await supabase
    .from('occasions')
    .select('*')
    // We want parent-less items first, then ordered by display order
    .order('parent_id', { ascending: true, nullsFirst: true })
    .order('display_order', { ascending: true });

  if (error) {
    return <div>Error loading occasions: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Occasions</h1>
        <Link href="/admin/occasions/new">
          <Button>Add Occasion</Button>
        </Link>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occasions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  No occasions found.
                </TableCell>
              </TableRow>
            ) : occasions.map((occasion) => (
              <TableRow key={occasion.id}>
                <TableCell className="font-medium">
                  {occasion.parent_id ? <span className="text-slate-400 mr-2">↳</span> : null}
                  {occasion.name}
                  {occasion.slug && <span className="text-xs text-slate-400 block">{occasion.slug}</span>}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    {occasion.occasion_type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${occasion.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {occasion.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>{occasion.display_order}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/admin/occasions/${occasion.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <DeleteOccasionButton id={occasion.id} name={occasion.name} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

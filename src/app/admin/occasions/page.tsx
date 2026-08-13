import { supabase } from '@/lib/supabase';
import { requireAdmin } from '@/services/auth.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function OccasionsPage() {
  await requireAdmin();

  const { data: occasions, error } = await supabase
    .from('occasions')
    .select('*')
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
              <TableHead>Slug</TableHead>
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
                <TableCell className="font-medium">{occasion.name}</TableCell>
                <TableCell>{occasion.slug}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${occasion.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {occasion.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>{occasion.display_order}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/occasions/${occasion.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

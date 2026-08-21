import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/services/auth.service';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInventoryStatus, getInventoryStatusColor, InventoryStatus } from '@/lib/inventory';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string }> }) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      *,
      categories ( name )
    `)
    .order('created_at', { ascending: false });

  // Apply authoritative stock filtering
  const resolvedParams = await searchParams;
  const stockFilter = resolvedParams.stock;
  if (stockFilter === 'IN STOCK') {
    query = query.gte('stock_quantity', 6);
  } else if (stockFilter === 'LOW STOCK') {
    query = query.gte('stock_quantity', 3).lte('stock_quantity', 5);
  } else if (stockFilter === 'CRITICAL') {
    query = query.gte('stock_quantity', 1).lte('stock_quantity', 2);
  } else if (stockFilter === 'OUT OF STOCK') {
    query = query.lte('stock_quantity', 0);
  }

  const { data: products, error } = await query;

  if (error) {
    return <div>Error loading products: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Link href="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">Stock Filter:</span>
        <form className="flex space-x-2">
          <select 
            name="stock" 
            className="border rounded px-3 py-1 text-sm bg-white" 
            defaultValue={stockFilter || ''}
          >
            <option value="">All</option>
            <option value="IN STOCK">In Stock</option>
            <option value="LOW STOCK">Low Stock</option>
            <option value="CRITICAL">Critical</option>
            <option value="OUT OF STOCK">Out of Stock</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Filter</Button>
        </form>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!products || products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : products.map((product: any) => {
              const invStatus = getInventoryStatus(product.stock_quantity);
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.categories?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={product.stock_quantity < 3 ? 'text-red-500 font-bold' : ''}>
                      {product.stock_quantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getInventoryStatusColor(invStatus)}`}>
                      {invStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 
                      product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

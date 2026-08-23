import { getHampers } from '@/actions/hamper.actions';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Gift } from 'lucide-react';
import Link from 'next/link';
import { HamperImportButton } from '@/components/admin/HamperImportButton';

export default async function HampersPage() {
  const hampers = await getHampers();

  // Calculate totals
  const totalHampers = hampers.length;
  const totalInventory = hampers.reduce((acc, h) => acc + h.stock_quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hampers</h1>
          <p className="text-slate-500 mt-1">Manage pre-made hamper bundles.</p>
        </div>
        <div className="flex items-center space-x-3">
          <HamperImportButton />
          <Link href="/admin/hampers/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Hamper
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Hampers</p>
            <p className="text-2xl font-bold text-slate-900">{totalHampers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Inventory</p>
            <p className="text-2xl font-bold text-slate-900">{totalInventory}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hamper Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Quantity</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (₹)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Selling Price (₹)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Margin (%)</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hampers.map((hamper) => {
                const profit = hamper.selling_price - hamper.actual_cost;
                const marginPercent = hamper.selling_price > 0 ? ((profit / hamper.selling_price) * 100).toFixed(1) : 0;
                
                return (
                  <tr key={hamper.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{hamper.name}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-900">
                      {hamper.stock_quantity}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-600">
                      ₹{hamper.actual_cost.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-900">
                      ₹{hamper.selling_price.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(marginPercent) >= 40 ? 'bg-emerald-100 text-emerald-800' : Number(marginPercent) >= 20 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {marginPercent}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${hamper.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                        {hamper.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/admin/hampers/${hamper.id}`}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-indigo-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {hampers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No hampers found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

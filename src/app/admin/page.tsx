import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, Folder, AlertTriangle, TrendingUp } from 'lucide-react';
import { StaggerContainer, StaggerItem, HoverCard } from '@/components/ui/AnimatedWrapper';

async function getDashboardStats() {
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: inStock },
    { count: lowStock },
    { count: critical },
    { count: outOfStock },
    { count: activeOccasions },
    { count: activeCategories }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 6),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 3).lte('stock_quantity', 5),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 1).lte('stock_quantity', 2),
    supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 0),
    supabase.from('occasions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalProducts: totalProducts || 0,
    activeProducts: activeProducts || 0,
    inStock: inStock || 0,
    lowStock: lowStock || 0,
    critical: critical || 0,
    outOfStock: outOfStock || 0,
    activeOccasions: activeOccasions || 0,
    activeCategories: activeCategories || 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <StaggerContainer className="space-y-8">
      <StaggerItem>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your Hamperly catalog operations.</p>
        </div>
      </StaggerItem>

      <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        
        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Total Products</CardTitle>
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Package className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-slate-900">{stats.totalProducts}</div>
                <p className="text-xs text-indigo-600 font-medium mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> {stats.activeProducts} active in catalog
                </p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem className="col-span-1 md:col-span-2 lg:col-span-1">
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Inventory Status</CardTitle>
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-2.5 text-sm mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-600 font-medium flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"/> In Stock</span>
                    <span className="font-semibold text-slate-700">{stats.inStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 font-medium flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2"/> Low Stock</span>
                    <span className="font-semibold text-slate-700">{stats.lowStock}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-500 font-medium flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"/> Critical</span>
                    <span className="font-semibold text-slate-700">{stats.critical}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                    <span className="text-rose-600 font-bold flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-2"/> Out of Stock</span>
                    <span className="font-bold text-rose-600">{stats.outOfStock}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Active Occasions</CardTitle>
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-slate-900">{stats.activeOccasions}</div>
                <p className="text-xs text-slate-500 mt-1">Festivals & Events</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Categories</CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Folder className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-slate-900">{stats.activeCategories}</div>
                <p className="text-xs text-slate-500 mt-1">Product groupings</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>
      </StaggerContainer>
    </StaggerContainer>
  );
}

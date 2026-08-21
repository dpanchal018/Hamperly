import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, Folder, AlertTriangle, TrendingUp, Users, DollarSign, Wallet } from 'lucide-react';
import { StaggerContainer, StaggerItem, HoverCard } from '@/components/ui/AnimatedWrapper';
import { getDashboardStats as getFinancialStats } from '@/actions/dashboard.actions';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getDashboardStats() {
  const supabase = await createClient();
  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: inStock },
    { count: lowStock },
    { count: critical },
    { count: outOfStock },
    { count: activeOccasions },
    { count: activeCategories },
    { count: totalHampers },
    { count: hamperInStock },
    { count: hamperLowStock },
    { count: hamperCritical },
    { count: hamperOutOfStock }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 6),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 3).lte('stock_quantity', 5),
    supabase.from('products').select('*', { count: 'exact', head: true }).gte('stock_quantity', 1).lte('stock_quantity', 2),
    supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock_quantity', 0),
    supabase.from('occasions').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('hampers').select('*', { count: 'exact', head: true }),
    supabase.from('hampers').select('*', { count: 'exact', head: true }).gte('stock_quantity', 6),
    supabase.from('hampers').select('*', { count: 'exact', head: true }).gte('stock_quantity', 3).lte('stock_quantity', 5),
    supabase.from('hampers').select('*', { count: 'exact', head: true }).gte('stock_quantity', 1).lte('stock_quantity', 2),
    supabase.from('hampers').select('*', { count: 'exact', head: true }).lte('stock_quantity', 0),
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
    totalHampers: totalHampers || 0,
    hamperInStock: hamperInStock || 0,
    hamperLowStock: hamperLowStock || 0,
    hamperCritical: hamperCritical || 0,
    hamperOutOfStock: hamperOutOfStock || 0
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const finStats = await getFinancialStats() || { totalCustomers: 0, totalPurchases: 0, totalCollected: 0, totalSales: 0, grossProfit: 0 };


  return (
    <StaggerContainer className="space-y-8">
      <StaggerItem>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your Hamperly catalog operations.</p>
        </div>
      </StaggerItem>

      {/* SECTION 1: FINANCIALS */}
      <StaggerItem>
        <div className="mt-8 mb-4 border-b border-slate-200 pb-2">
          <h2 className="text-xl font-bold text-slate-800">Financials</h2>
        </div>
      </StaggerItem>
      <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Total Sales (Completed)</CardTitle>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900">₹{finStats.totalSales.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Gross total of all sales</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Total Collected</CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Wallet className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900">₹{finStats.totalCollected.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">Payments received</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Gross Profit/Loss</CardTitle>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className={`text-2xl font-bold ${finStats.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {finStats.grossProfit >= 0 ? '+' : '-'}₹{Math.abs(finStats.grossProfit).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">Based on catalog vs actual price</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Total Customers</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Users className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-slate-900">{finStats.totalCustomers}</div>
                <p className="text-xs text-slate-500 mt-1">{finStats.totalPurchases} completed purchases</p>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>
      </StaggerContainer>

      {/* SECTION 2: INVENTORY MANAGEMENT */}
      <StaggerItem>
        <div className="mt-8 mb-4 border-b border-slate-200 pb-2">
          <h2 className="text-xl font-bold text-slate-800">Inventory Management</h2>
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

        <StaggerItem>
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Curated Hampers</CardTitle>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <Package className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-slate-900">{stats.totalHampers}</div>
                <p className="text-xs text-slate-500 mt-1">Pre-made bundled products</p>
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

        <StaggerItem className="col-span-1 md:col-span-2 lg:col-span-4">
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Product Inventory Alert Status</CardTitle>
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-emerald-600 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"/> In Stock</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.inStock}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-amber-500 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-amber-400 mr-2"/> Low Stock</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.lowStock}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-orange-200 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-orange-500 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-orange-500 mr-2"/> Critical</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.critical}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-rose-200 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-rose-600 font-bold flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-rose-600 mr-2"/> Out of Stock</span>
                    <span className="text-2xl font-bold text-rose-600">{stats.outOfStock}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>

        <StaggerItem className="col-span-1 md:col-span-2 lg:col-span-4">
          <HoverCard>
            <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group h-full">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <CardTitle className="text-sm font-semibold text-slate-600">Hamper Inventory Alert Status</CardTitle>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-2">
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-emerald-600 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"/> In Stock</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.hamperInStock}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-amber-500 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-amber-400 mr-2"/> Low Stock</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.hamperLowStock}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-orange-200 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-orange-500 font-medium flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-orange-500 mr-2"/> Critical</span>
                    <span className="text-2xl font-bold text-slate-800">{stats.hamperCritical}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-rose-200 flex flex-col justify-center items-center text-center shadow-sm">
                    <span className="text-rose-600 font-bold flex items-center mb-1"><div className="w-2 h-2 rounded-full bg-rose-600 mr-2"/> Out of Stock</span>
                    <span className="text-2xl font-bold text-rose-600">{stats.hamperOutOfStock}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </HoverCard>
        </StaggerItem>
      </StaggerContainer>
    </StaggerContainer>
  );
}

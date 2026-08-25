import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, Users, DollarSign, Activity, ShoppingCart, RefreshCcw, Box, AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { StaggerContainer, StaggerItem, HoverCard } from '@/components/ui/AnimatedWrapper';
import { 
  getRevenueMetrics, 
  getCustomerMetrics, 
  getOrderMetrics, 
  getProfitMetrics, 
  getProductMetrics 
} from '@/actions/analytics.actions';
import Link from 'next/link';
import { LiveClock } from '@/components/ui/LiveClock';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export default async function AdminDashboardPage() {
  const [
    revenue,
    customers,
    orders,
    profit,
    products
  ] = await Promise.all([
    getRevenueMetrics(),
    getCustomerMetrics(),
    getOrderMetrics(),
    getProfitMetrics(),
    getProductMetrics()
  ]);

  return (
    <StaggerContainer className="space-y-10 pb-10">
      <StaggerItem>
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-serif">Business Intelligence</h1>
              <p className="text-slate-500 mt-1">Real-time metrics and operational analytics for Hamperly.</p>
            </div>
            <LiveClock />
          </div>
        </div>
      </StaggerItem>

      {/* SECTION: REVENUE */}
      <section>
        <StaggerItem>
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">Revenue</h2>
          </div>
        </StaggerItem>
        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Today's Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(revenue.today)}</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(revenue.week)}</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(revenue.month)}</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">YTD Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{formatCurrency(revenue.ytd)}</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* SECTION: PROFIT & ORDERS */}
      <section className="grid gap-6 lg:grid-cols-2">
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-bold text-slate-800">Gross Profit</h2>
            </div>
            <HoverCard>
              <Card className="border-none shadow-md bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp className="w-32 h-32" />
                </div>
                <CardContent className="p-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <p className="text-indigo-200 font-medium text-sm uppercase tracking-wider mb-1">Total Gross Profit</p>
                      <h3 className="text-5xl font-extrabold">{formatCurrency(profit.grossProfit)}</h3>
                      <p className="text-sm text-emerald-400 font-medium mt-2 flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        {profit.revenue > 0 ? ((profit.grossProfit / profit.revenue) * 100).toFixed(1) : 0}% Margin
                      </p>
                    </div>
                    
                    <div className="pt-6 border-t border-indigo-500/30 flex justify-between">
                      <div>
                        <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">Revenue</p>
                        <p className="font-semibold text-lg">{formatCurrency(profit.revenue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">- Cost of Goods</p>
                        <p className="font-semibold text-lg">{formatCurrency(profit.cost)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>

        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-sky-500" />
              <h2 className="text-lg font-bold text-slate-800">Orders</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <HoverCard>
                <Card className="border-none shadow-sm bg-white h-full">
                  <CardContent className="p-6">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Orders Today</p>
                    <div className="text-2xl font-bold text-slate-900">{orders.ordersToday}</div>
                  </CardContent>
                </Card>
              </HoverCard>
              <HoverCard>
                <Card className="border-none shadow-sm bg-white h-full">
                  <CardContent className="p-6">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg Order Value</p>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(orders.averageOrderValue)}</div>
                  </CardContent>
                </Card>
              </HoverCard>
              <HoverCard>
                <Card className="border-none shadow-sm bg-white h-full">
                  <CardContent className="p-6">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Cancellation Rate</p>
                    <div className="text-2xl font-bold text-slate-900">{orders.cancellationRate.toFixed(1)}%</div>
                  </CardContent>
                </Card>
              </HoverCard>
              <HoverCard>
                <Card className="border-none shadow-sm bg-white h-full">
                  <CardContent className="p-6">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg Fulfillment</p>
                    <div className="text-2xl font-bold text-slate-900">
                      {orders.avgFulfillmentTime.toFixed(1)} <span className="text-sm font-normal text-slate-500">hrs</span>
                    </div>
                  </CardContent>
                </Card>
              </HoverCard>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* SECTION: CUSTOMERS */}
      <section>
        <StaggerItem>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-800">Customers</h2>
          </div>
        </StaggerItem>
        <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">New (This Month)</p>
                    <div className="text-2xl font-bold text-slate-900">{customers.newCustomers}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                    <Users className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Returning</p>
                    <div className="text-2xl font-bold text-slate-900">{customers.returningCustomers}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <RefreshCcw className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Repeat Rate</p>
                  <div className="text-2xl font-bold text-slate-900">{customers.repeatPurchaseRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard>
              <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-6">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Avg Customer Value</p>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(customers.averageCustomerValue)}</div>
                </CardContent>
              </Card>
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* SECTION: PRODUCT INTELLIGENCE */}
      <section>
        <StaggerItem>
          <div className="flex items-center space-x-2 mb-4">
            <Package className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-800">Product Intelligence</h2>
          </div>
        </StaggerItem>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Best-Selling Hampers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <ul className="divide-y divide-slate-50">
                  {products.bestHampers.map((item, i) => (
                    <li key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-medium text-slate-700 truncate mr-4">{item.name}</span>
                      <span className="text-sm font-bold text-slate-900">{item.qty}</span>
                    </li>
                  ))}
                  {products.bestHampers.length === 0 && <li className="px-6 py-4 text-sm text-slate-500">No data yet</li>}
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                  <Box className="w-4 h-4 text-sky-500 mr-2" /> Best-Selling Products
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <ul className="divide-y divide-slate-50">
                  {products.bestProducts.map((item, i) => (
                    <li key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-medium text-slate-700 truncate mr-4">{item.name}</span>
                      <span className="text-sm font-bold text-slate-900">{item.qty}</span>
                    </li>
                  ))}
                  {products.bestProducts.length === 0 && <li className="px-6 py-4 text-sm text-slate-500">No data yet</li>}
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                  <Activity className="w-4 h-4 text-slate-400 mr-2" /> Slow-Moving Products
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <ul className="divide-y divide-slate-50">
                  {products.slowProducts.map((item, i) => (
                    <li key={i} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-medium text-slate-700 truncate mr-4">{item.name}</span>
                      <span className="text-sm font-bold text-slate-900">{item.qty}</span>
                    </li>
                  ))}
                  {products.slowProducts.length === 0 && <li className="px-6 py-4 text-sm text-slate-500">No data yet</li>}
                </ul>
              </CardContent>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card className="border-none shadow-sm bg-rose-50/50 h-full border border-rose-100">
              <CardHeader className="pb-4 border-b border-rose-100">
                <CardTitle className="text-sm font-bold text-rose-800 flex items-center">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mr-2" /> Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 p-0">
                <ul className="divide-y divide-rose-100/50">
                  {products.lowStockHampers.map((item: any, i: number) => (
                    <li key={i} className="px-6 py-3 flex justify-between items-center hover:bg-rose-50 transition-colors">
                      <span className="text-sm font-medium text-slate-700 truncate mr-4">{item.name}</span>
                      <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${item.stock_quantity <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.stock_quantity} left
                      </span>
                    </li>
                  ))}
                  {products.lowStockHampers.length === 0 && <li className="px-6 py-4 text-sm text-slate-500">Inventory healthy</li>}
                </ul>
                <div className="p-4 border-t border-rose-100">
                  <Link href="/admin/hampers" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center">
                    Manage Inventory <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </section>
    </StaggerContainer>
  );
}

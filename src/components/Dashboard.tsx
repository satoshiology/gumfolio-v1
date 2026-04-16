import * as React from "react";
import { TrendingUp, ShoppingBag, Eye, BarChart3, Rocket, BookOpen, Brush, AlertCircle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { gumroadService } from "../services/gumroadService";
import { Product, Sale } from "../types";

export default function Dashboard() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, salesRes] = await Promise.all([
          gumroadService.getProducts(),
          gumroadService.getSales()
        ]);
        setProducts(productsRes.products);
        setSales(salesRes.sales);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.response?.data?.error || "Failed to connect to Gumroad API. Please check your Access Token.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalRevenue = products.reduce((acc, p) => acc + (p.sales_usd_cents / 100), 0);
  const totalSales = products.reduce((acc, p) => acc + parseInt(p.sales_count as any || 0), 0);

  // Group sales by day for the chart
  const salesByDay = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    const now = new Date();
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      grouped[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
    }

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (grouped[key] !== undefined) {
        grouped[key] += (sale.price / 100);
      }
    });

    return Object.entries(grouped).map(([name, revenue]) => ({ name, revenue }));
  }, [sales]);

  const todaySalesCount = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs">Synchronizing Neural Core...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Hero Section: Total Revenue */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 mesh-gradient-bg shadow-[0_0_50px_rgba(0,255,65,0.2)]">
        <div className="absolute inset-0 noise-overlay pointer-events-none"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col items-start gap-1">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-black/60 font-bold">
              Total Lifetime Revenue
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-5xl md:text-7xl font-extrabold text-black tracking-tighter neon-text-glow">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-black/10 backdrop-blur-md flex items-center justify-center border border-black/5">
            <img 
              src="https://subpagebucket.s3.eu-north-1.amazonaws.com/library/934/7f7e89a4-95ff-4e7f-b5d8-82325118dded.png" 
              alt="Gumfolio Logo" 
              className="w-10 h-10 object-contain brightness-0 invert"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard 
          label="Total Sales" 
          value={totalSales.toLocaleString()} 
          subValue={`+${todaySalesCount} today`} 
          icon={ShoppingBag} 
          color="text-secondary" 
        />
        <MetricCard 
          label="Active Products" 
          value={products.filter(p => p.published).length.toString()} 
          subValue="Published" 
          icon={BookOpen} 
          color="text-primary" 
        />
        <div className="bg-surface-container-lowest rounded-xl p-6 flex flex-col justify-between min-h-[160px] border border-outline-variant/10 shadow-inner">
          <div className="flex justify-between items-start">
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
              Avg. Order Value
            </span>
            <BarChart3 className="w-6 h-6 text-tertiary" />
          </div>
          <div className="mt-4">
            <h3 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              ${totalSales > 0 ? (totalRevenue / totalSales).toFixed(2) : "0.00"}
            </h3>
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <section className="glass-card rounded-xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">Revenue Velocity</h2>
            <p className="text-on-surface-variant text-sm">Last 7 days performance</p>
          </div>
        </div>
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesByDay}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#888888", fontSize: 10, fontWeight: "bold" }}
                dy={10}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                itemStyle={{ color: "#00ff41" }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#00ff41" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Transactions Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-headline text-lg font-bold mb-4">Top Performing Products</h3>
          <div className="space-y-4">
            {products.sort((a, b) => b.sales_usd_cents - a.sales_usd_cents).slice(0, 3).map((product) => (
              <ProductItem 
                key={product.id}
                title={product.name} 
                sales={`${product.sales_count} Sales`} 
                revenue={`$${(product.sales_usd_cents / 100).toLocaleString()}`} 
                icon={product.name.toLowerCase().includes('book') ? BookOpen : Brush} 
                iconColor="text-primary" 
                bgColor="bg-primary/20" 
              />
            ))}
            {products.length === 0 && (
              <p className="text-on-surface-variant text-sm italic">No products found.</p>
            )}
          </div>
        </div>
        <div className="glass-card rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
          <div className="absolute inset-0 noise-overlay pointer-events-none"></div>
          <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center mb-2">
            <Rocket className="w-8 h-8 text-tertiary" />
          </div>
          <h3 className="font-headline text-xl font-bold">Ready to scale?</h3>
          <p className="text-on-surface-variant text-sm px-6">
            Your top product is performing well. Try setting up an upsell to increase your average order value.
          </p>
          <button className="mt-4 px-6 py-3 bg-primary text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:scale-105 active:scale-95 transition-all">
            Create Upsell
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, color }: any) {
  return (
    <div className="glass-card rounded-xl p-6 flex flex-col justify-between min-h-[160px]">
      <div className="flex justify-between items-start">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
          {label}
        </span>
        <Icon className={cn("w-6 h-6", color)} />
      </div>
      <div className="mt-4">
        <h3 className="font-headline text-4xl font-bold text-on-surface tracking-tight">{value}</h3>
        <p className={cn(color, "text-xs mt-1 font-medium")}>{subValue}</p>
      </div>
    </div>
  );
}

function ProductItem({ title, sales, revenue, icon: Icon, iconColor, bgColor }: any) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high/40 hover:bg-surface-container-high transition-colors">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", bgColor)}>
        <Icon className={cn("w-6 h-6", iconColor)} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[10px] text-on-surface-variant">{sales}</p>
      </div>
      <p className="text-sm font-bold text-secondary">{revenue}</p>
    </div>
  );
}

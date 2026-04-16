import * as React from "react";
import { ShoppingBag, Sparkles, Palette, ArrowDown, Loader2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { gumroadService } from "../services/gumroadService";
import { Sale } from "../types";

export default function SalesFeed() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchSales() {
      try {
        const res = await gumroadService.getSales();
        setSales(res.sales);
      } catch (err: any) {
        console.error("Sales Fetch Error:", err);
        setError(err.response?.data?.error || "Failed to fetch sales feed.");
      } finally {
        setLoading(false);
      }
    }
    fetchSales();
  }, []);

  const todayRevenue = sales
    .filter(s => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + s.price / 100, 0);

  const lastHourSales = sales.filter(s => {
    const saleDate = new Date(s.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 1;
  }).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs">Accessing Transaction Ledger...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <section>
        <p className="font-label text-xs uppercase tracking-[0.2em] text-primary mb-2">Live Activity</p>
        <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight mb-8">Sales Feed</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Today's Revenue" value={`$${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subValue="Real-time tracking active" color="text-secondary" />
          <StatCard label="Total Transactions" value={sales.length.toLocaleString()} subValue="Lifetime sales" color="text-white" />
          <div className="mesh-gradient-bg p-6 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(132,85,239,0.2)]">
            <div className="absolute inset-0 noise-overlay pointer-events-none"></div>
            <div className="relative z-10">
              <span className="font-label text-[10px] uppercase tracking-widest text-black/70">Performance</span>
              <div className="text-3xl font-headline font-bold text-black mt-1">Velocity</div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-black/80 font-bold">{lastHourSales} sales in the last hour</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-end mb-4 px-2">
          <h3 className="font-label text-sm font-semibold text-on-surface-variant">Recent Transactions</h3>
          <span className="text-[10px] font-label text-zinc-500 uppercase tracking-widest">Auto-updating</span>
        </div>
        
        {sales.map((sale) => (
          <TransactionItem 
            key={sale.id}
            title={sale.product_name} 
            email={sale.email} 
            time={new Date(sale.created_at).toLocaleString()} 
            price={`${sale.currency_symbol || '$'}${(sale.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={ShoppingBag} 
            iconColor="text-violet-400" 
            bgColor="bg-violet-500/10" 
            refunded={sale.refunded}
            partiallyRefunded={sale.partially_refunded}
          />
        ))}

        {sales.length === 0 && !error && (
          <p className="text-on-surface-variant text-center py-12 italic">No transactions recorded yet.</p>
        )}
      </section>

      <div className="mt-12 flex justify-center">
        <button className="text-xs font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant hover:text-white transition-colors flex items-center gap-2">
          View All History
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, subValue, color }: any) {
  return (
    <div className="bg-surface-container/40 backdrop-blur-xl p-6 rounded-xl border border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 noise-overlay pointer-events-none"></div>
      <div className="relative z-10">
        <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{label}</span>
        <div className={cn("text-3xl font-headline font-bold mt-1", color)}>{value}</div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-on-surface-variant/80">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ title, email, time, price, icon: Icon, iconColor, bgColor, refunded, partiallyRefunded }: any) {
  return (
    <div className={cn(
      "bg-surface-container/40 backdrop-blur-xl p-6 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:bg-zinc-800/20 group",
      refunded && "opacity-50 grayscale"
    )}>
      <div className="flex items-center gap-5">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform", bgColor, iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className={cn("font-headline font-bold text-lg", refunded ? "text-on-surface-variant line-through" : "text-white")}>{title}</h4>
          <p className="text-sm font-body text-on-surface-variant">{email}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] font-label text-zinc-600 uppercase tracking-widest">{time}</p>
            {refunded && <span className="text-[10px] font-label text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded">Refunded</span>}
            {partiallyRefunded && !refunded && <span className="text-[10px] font-label text-orange-400 uppercase tracking-widest bg-orange-400/10 px-2 py-0.5 rounded">Partial Refund</span>}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:items-end gap-4">
        <div className={cn("text-2xl font-headline font-bold", refunded ? "text-on-surface-variant" : "text-secondary")}>{price}</div>
        <div className="flex items-center gap-3">
          {!refunded && (
            <button className="px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-wider text-red-400 hover:bg-red-400/10 transition-colors border border-red-400/20">
              Refund
            </button>
          )}
          <button className="px-4 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors border border-primary/20">
            Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

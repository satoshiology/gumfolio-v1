import * as React from "react";
import { TrendingUp, MoreVertical, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { gumroadService } from "../services/gumroadService";
import { Product } from "../types";

export default function Inventory() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  React.useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await gumroadService.getProducts();
        setProducts(res.products);
      } catch (err: any) {
        console.error("Products Fetch Error:", err);
        setError(err.response?.data?.error || "Failed to fetch inventory.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    setActionLoading(`toggle-${id}`);
    try {
      if (currentlyPublished) {
        const res = await gumroadService.disableProduct(id);
        setProducts(products.map(p => p.id === id ? res.product : p));
        showToast("Product disabled", "success");
      } else {
        const res = await gumroadService.enableProduct(id);
        setProducts(products.map(p => p.id === id ? res.product : p));
        showToast("Product enabled", "success");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update product status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const totalRevenue = products.reduce((acc, p) => acc + (p.sales_usd_cents / 100), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs">Scanning Product Database...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-12 pb-24 relative"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-md border",
              toast.type === 'success' ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-red-500/20 border-red-500/30 text-red-400"
            )}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <header>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary mb-2 block">Commerce Portfolio</span>
            <h2 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-on-surface">Inventory</h2>
          </div>
          <div className="flex items-center gap-3 bg-surface-container-high/50 px-4 py-2 rounded-2xl border border-outline-variant/10 backdrop-blur-md">
            <TrendingUp className="w-5 h-5 text-primary-fixed-dim" />
            <span className="font-label text-sm text-on-surface-variant">
              Active Revenue Stream: <span className="text-on-surface font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard 
            key={product.id}
            product={product}
            actionLoading={actionLoading}
            onTogglePublish={() => handleTogglePublish(product.id, product.published)}
          />
        ))}

        {products.length === 0 && !error && (
          <p className="text-on-surface-variant text-center py-12 italic col-span-full">No products found in your account.</p>
        )}
      </div>
    </motion.div>
  );
}

function ProductCard({ product, actionLoading, onTogglePublish }: any) {
  const { id, name: title, price: priceCents, sales_count: sales, published, file_type, thumbnail_url, short_url: url } = product;
  const price = `$${(priceCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const tag = file_type || "Digital Asset";
  const image = thumbnail_url || `https://picsum.photos/seed/${id}/800/600`;
  const isToggling = actionLoading === `toggle-${id}`;
  const [showModal, setShowModal] = React.useState(false);

  return (
    <>
      <div className={cn(
        "group relative bg-surface-container-low/40 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/5 p-6 hover:shadow-[0_0_30px_rgba(132,85,239,0.1)] transition-all duration-500",
        !published && "opacity-80"
      )}>
        <div className={cn(
          "relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6",
          !published && "grayscale"
        )}>
          <img 
            src={image} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            referrerPolicy="no-referrer"
            alt={title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute top-4 left-4">
            <span className="bg-primary/20 backdrop-blur-md text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-label font-bold uppercase tracking-wider">
              {tag}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="font-headline text-xl font-bold text-on-surface leading-tight">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="font-label text-xs text-on-surface-variant">{published ? "Published" : "Unpublished"}</span>
              <button 
                onClick={onTogglePublish}
                disabled={isToggling}
                className={cn(
                  "w-8 h-4 rounded-full relative p-0.5 cursor-pointer transition-colors disabled:opacity-50",
                  published ? "bg-primary/40" : "bg-zinc-800"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full absolute top-0.5 transition-all flex items-center justify-center",
                  published ? "bg-primary right-0.5 shadow-[0_0_10px_rgba(132,85,239,1)]" : "bg-zinc-600 left-0.5"
                )}>
                  {isToggling && <Loader2 className="w-2 h-2 animate-spin text-black" />}
                </div>
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Price</p>
              <p className={cn("font-headline text-2xl font-bold", published ? "text-secondary" : "text-zinc-500")}>{price}</p>
            </div>
            <div className="text-right">
              <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Total Sales</p>
              <p className={cn("font-headline text-2xl font-bold", published ? "text-on-surface" : "text-zinc-500")}>{sales}</p>
            </div>
          </div>
          <div className="pt-4 flex gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl bg-surface-bright/20 border border-outline-variant/15 text-on-surface font-label text-sm font-semibold hover:bg-zinc-800/60 transition-colors text-center block"
            >
              View Product
            </a>
            <button 
              onClick={() => setShowModal(true)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface-bright/20 border border-outline-variant/15 text-on-surface hover:text-primary transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showModal && <ProductInfoModal product={product} onClose={() => setShowModal(false)} />}
    </>
  );
}

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

function ProductInfoModal({ product, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-surface-container-highest h-full md:h-[90vh] w-full md:max-w-2xl md:rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-surface-container-highest">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Product Details</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">Close</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-headline font-bold text-on-surface">{product.name}</h3>
            <p className="text-2xl font-headline font-bold text-secondary">${(product.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          {product.description && (
            <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{product.description}</ReactMarkdown>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <span className="font-label uppercase tracking-widest text-xs text-on-surface-variant">Sales Count</span>
              <p className="font-mono text-on-surface">{product.sales_count}</p>
            </div>
            <div className="space-y-1">
              <span className="font-label uppercase tracking-widest text-xs text-on-surface-variant">Status</span>
              <p className="font-mono text-on-surface">{product.published ? "Published" : "Unpublished"}</p>
            </div>
            <div className="space-y-1">
              <span className="font-label uppercase tracking-widest text-xs text-on-surface-variant">File Type</span>
              <p className="font-mono text-on-surface">{product.file_type || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <span className="font-label uppercase tracking-widest text-xs text-on-surface-variant">License</span>
              <p className="font-mono text-on-surface">{product.license || 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

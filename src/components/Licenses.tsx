import * as React from "react";
import { Verified, CheckCircle, Loader2, AlertCircle, ShieldAlert, Search, Mail, User as UserIcon, Key as KeyIcon, X, Copy, Settings, RefreshCcw, Power, PowerOff, Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { gumroadService } from "../services/gumroadService";
import { LicenseVerificationResponse, Sale } from "../types";

function HoldButton({ onComplete, children, className, actionText, disabled }: any) {
  const [progress, setProgress] = React.useState(0);
  const [isHolding, setIsHolding] = React.useState(false);
  const requestRef = React.useRef<number | undefined>(undefined);
  const startTimeRef = React.useRef<number | undefined>(undefined);

  const duration = 3000; // 3 seconds

  const animate = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;
    const currentProgress = Math.min((elapsed / duration) * 100, 100);
    setProgress(currentProgress);

    if (currentProgress < 100) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setIsHolding(false);
      onComplete();
    }
  };

  const startHold = () => {
    if (disabled) return;
    setIsHolding(true);
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);
  };

  const stopHold = () => {
    if (disabled) return;
    setIsHolding(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setProgress(0);
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchStart={startHold}
      onTouchEnd={stopHold}
      disabled={disabled}
      className={cn("relative overflow-hidden select-none disabled:opacity-50", className)}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 bg-black/20 z-0" 
        style={{ width: `${progress}%`, transition: isHolding ? 'none' : 'width 0.2s' }} 
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isHolding && progress < 100 ? `Hold to ${actionText}...` : children}
      </span>
    </button>
  );
}

export default function Licenses() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [salesLoading, setSalesLoading] = React.useState(false);

  const [selectedSaleForVerify, setSelectedSaleForVerify] = React.useState<Sale | null>(null);
  const [selectedSaleForManage, setSelectedSaleForManage] = React.useState<Sale | null>(null);

  React.useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await gumroadService.getSales();
      setSales(res.sales.filter(s => s.license_key));
    } catch (err) {
      console.error("Failed to fetch sales for search", err);
    } finally {
      setSalesLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.license_key && (
      sale.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.license_key.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-lg mx-auto flex flex-col items-center pb-24"
    >
      <div className="w-full mb-8 text-center">
        <span className="font-label text-[0.6875rem] uppercase tracking-[0.2em] text-secondary mb-2 block">Security Protocol</span>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight leading-none mb-4">Licenses</h1>
        <p className="text-on-surface-variant max-w-xs mx-auto">Search and manage existing license keys.</p>
      </div>

      <div className="w-full space-y-6">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/15 rounded-xl py-4 pl-12 pr-12 text-on-surface placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all font-label"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {salesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-on-surface-variant font-label uppercase tracking-widest text-[10px]">Accessing Secure Database...</p>
            </div>
          ) : filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <motion.div 
                key={sale.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-container/40 backdrop-blur-xl p-5 rounded-2xl border border-white/5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-on-surface">{sale.email}</h4>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs font-body">
                        <Mail className="w-3 h-3" />
                        {sale.email}
                      </div>
                    </div>
                  </div>
                  {sale.refunded && (
                    <span className="text-[10px] font-label text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-0.5 rounded">Refunded</span>
                  )}
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex items-center justify-between group/key">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">License Key</span>
                      <KeyIcon className="w-3 h-3 text-secondary" />
                    </div>
                    <code className="text-secondary font-mono text-sm break-all select-all">
                      {sale.license_key}
                    </code>
                  </div>
                  <CopyButton text={sale.license_key || ""} />
                </div>

                <div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest text-zinc-600">
                  <span>{sale.product_name}</span>
                  <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <button 
                    onClick={() => setSelectedSaleForVerify(sale)}
                    className="flex-1 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-wider text-secondary hover:bg-secondary/10 transition-colors border border-secondary/20 flex items-center justify-center gap-2"
                  >
                    <Verified className="w-4 h-4" />
                    Verify
                  </button>
                  <button 
                    onClick={() => setSelectedSaleForManage(sale)}
                    className="flex-1 py-2 rounded-lg text-xs font-label font-bold uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors border border-primary/20 flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-[1.5rem]">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
                <KeyIcon className="w-8 h-8 text-on-surface-variant opacity-20" />
              </div>
              <div>
                <p className="text-on-surface font-headline text-xl font-bold">No licenses found</p>
                <p className="text-on-surface-variant text-sm font-label mt-1">Try searching with different criteria.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 font-label text-[10px] text-zinc-600 uppercase tracking-widest">Powered by Gumroad API v2.0</p>

      <AnimatePresence>
        {selectedSaleForVerify && (
          <VerifyModal 
            sale={selectedSaleForVerify} 
            onClose={() => setSelectedSaleForVerify(null)} 
          />
        )}
        {selectedSaleForManage && (
          <ManageModal 
            sale={selectedSaleForManage} 
            onClose={() => setSelectedSaleForManage(null)} 
            onRefresh={fetchSales}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VerifyModal({ sale, onClose }: any) {
  const [loading, setLoading] = React.useState(true);
  const [result, setResult] = React.useState<LicenseVerificationResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const verify = async () => {
      try {
        const res = await gumroadService.verifyLicense(sale.product_id, sale.license_key, false);
        setResult(res);
      } catch (err: any) {
        setError(err.response?.data?.message || "Verification failed.");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [sale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface-container-low border border-white/10 rounded-3xl p-6 relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-surface-bright/20 hover:bg-surface-bright/40 text-on-surface transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="font-headline text-2xl font-bold mb-6">Verification</h3>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            <p className="text-sm text-on-surface-variant">Checking license status...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "font-label text-xs tracking-wide uppercase",
                  result.success ? "text-secondary" : "text-red-400"
                )}>
                  {result.success ? "Valid License" : "Invalid License"}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl bg-secondary-container/30",
                result.success ? "text-secondary" : "text-red-400"
              )}>
                {result.success ? <Verified className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-lowest/50 rounded-2xl p-5 border border-white/5">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Uses</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-3xl font-extrabold">{result.uses.toString().padStart(2, '0')}</span>
                  <span className="text-on-surface-variant text-sm">/ ∞</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest/50 rounded-2xl p-5 border border-white/5">
                <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">Refunded</span>
                <div className={cn(
                  "font-headline text-3xl font-extrabold",
                  result.purchase.refunded ? "text-red-400" : "text-zinc-500"
                )}>
                  {result.purchase.refunded ? "YES" : "NO"}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <DetailRow label="Licensee Email" value={result.purchase.email} />
              <DetailRow label="Purchase Date" value={new Date(result.purchase.created_at).toLocaleDateString()} />
              <DetailRow label="Transaction ID" value={result.purchase.id} isHighlight />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ManageModal({ sale, onClose, onRefresh }: any) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  
  const [confirmAction, setConfirmAction] = React.useState<{name: string, fn: () => Promise<any>} | null>(null);

  const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
    setConfirmAction(null);
    setLoadingAction(actionName);
    setError(null);
    setSuccessMsg(null);
    try {
      await actionFn();
      setSuccessMsg(`Successfully performed: ${actionName}`);
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to perform ${actionName}.`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface-container-low border border-white/10 rounded-3xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-surface-bright/20 hover:bg-surface-bright/40 text-on-surface transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <h3 className="font-headline text-2xl font-bold mb-2">Manage License</h3>
        <p className="text-sm text-on-surface-variant mb-6 break-all">{sale.license_key}</p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-surface-container/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Usage Control</h4>
            <div className="flex gap-3">
              <button 
                disabled={loadingAction !== null}
                onClick={() => setConfirmAction({ name: 'Increase Usages', fn: () => gumroadService.verifyLicense(sale.product_id, sale.license_key, true) })}
                className="flex-1 py-3 rounded-xl bg-surface-bright/20 border border-outline-variant/15 text-on-surface font-label text-xs font-semibold hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingAction === 'Increase Usages' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Increase
              </button>
              <button 
                disabled={loadingAction !== null}
                onClick={() => setConfirmAction({ name: 'Decrease Usages', fn: () => gumroadService.decrementLicenseUses(sale.product_id, sale.license_key) })}
                className="flex-1 py-3 rounded-xl bg-surface-bright/20 border border-outline-variant/15 text-on-surface font-label text-xs font-semibold hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingAction === 'Decrease Usages' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                Decrease
              </button>
            </div>
          </div>

          <div className="bg-surface-container/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Security</h4>
            <button 
              disabled={loadingAction !== null}
              onClick={() => setConfirmAction({ name: 'Rotate License', fn: () => gumroadService.rotateLicense(sale.product_id, sale.license_key) })}
              className="w-full py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-label text-xs font-semibold hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingAction === 'Rotate License' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              Rotate Key
            </button>
          </div>

          <div className="bg-surface-container/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">Access State</h4>
            <div className="flex gap-3">
              <button 
                disabled={loadingAction !== null}
                onClick={() => setConfirmAction({ name: 'Enable License', fn: () => gumroadService.enableLicense(sale.product_id, sale.license_key) })}
                className="flex-1 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-label text-xs font-semibold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingAction === 'Enable License' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                Enable
              </button>
              <button 
                disabled={loadingAction !== null}
                onClick={() => setConfirmAction({ name: 'Revoke License', fn: () => gumroadService.disableLicense(sale.product_id, sale.license_key) })}
                className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-label text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingAction === 'Revoke License' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                Revoke
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-surface-container border border-white/10 rounded-3xl p-6 text-center"
            >
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="font-headline text-xl font-bold mb-2">Confirm Action</h3>
              <p className="text-sm text-on-surface-variant mb-8">
                You are about to perform: <strong className="text-white">{confirmAction.name}</strong>. This action may affect the user's access.
              </p>
              
              <HoldButton 
                actionText="confirm"
                onComplete={() => handleAction(confirmAction.name, confirmAction.fn)}
                className="w-full py-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-headline font-bold text-lg hover:bg-red-500/30 transition-colors"
              >
                Hold 3s to Confirm
              </HoldButton>

              <button 
                onClick={() => setConfirmAction(null)}
                className="mt-4 text-sm font-label uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, isHighlight }: any) {
  return (
    <div className={cn("flex justify-between items-center py-3", !isHighlight && "border-b border-white/5")}>
      <span className="font-label text-xs text-on-surface-variant">{label}</span>
      <span className={cn("font-body text-sm font-medium", isHighlight ? "text-secondary" : "text-on-surface")}>{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn(
        "ml-4 p-2 rounded-lg transition-colors flex-shrink-0 relative overflow-hidden",
        copied ? "bg-green-500/20 text-green-400" : "bg-surface-bright/20 hover:bg-surface-bright/40 text-on-surface-variant hover:text-white"
      )}
      title="Copy to clipboard"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CheckCircle className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

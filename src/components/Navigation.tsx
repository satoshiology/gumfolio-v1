import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Bell, LayoutDashboard, Package, CreditCard, Key, User, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { gumroadService } from "../services/gumroadService";
import { User as UserType } from "../types";

export function TopAppBar() {
  const [user, setUser] = React.useState<UserType | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await gumroadService.getUser();
        setUser(res.user);
      } catch (err) {
        console.error("Failed to fetch user for nav", err);
      }
    }
    fetchUser();
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-zinc-950/60 backdrop-blur-xl shadow-[0_0_40px_-5px_rgba(0,255,65,0.15)] flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
            <img 
              src="https://subpagebucket.s3.eu-north-1.amazonaws.com/library/934/7f7e89a4-95ff-4e7f-b5d8-82325118dded.png" 
              alt="Gumfolio Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-bold text-primary font-headline tracking-tight neon-text-glow">
            Gumfolio
          </h1>
        </div>
        <div className="h-6 w-px bg-white/10 mx-1" />
        <Link to="/profile" className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-white/10 hover:border-primary transition-colors">
          <img
            alt="User Profile"
            className="w-full h-full object-cover"
            src={user?.profile_picture_url || "https://ui-avatars.com/api/?name=User&background=random"}
            referrerPolicy="no-referrer"
          />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl hover:bg-zinc-800/40 transition-colors text-zinc-500 hover:text-violet-400">
          <Bell className="w-6 h-6" />
        </button>
        <Link to="/settings" className="p-2 rounded-xl hover:bg-zinc-800/40 transition-colors text-zinc-500 hover:text-violet-400">
          <SettingsIcon className="w-6 h-6" />
        </Link>
      </div>
    </header>
  );
}

export function BottomNavBar() {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dash", path: "/" },
    { icon: Package, label: "Products", path: "/inventory" },
    { icon: Sparkles, label: "AI", path: "/ai", isSpecial: true },
    { icon: CreditCard, label: "Sales", path: "/sales" },
    { icon: Key, label: "Licenses", path: "/licenses" },
  ];

  return (
    <nav className="fixed bottom-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-zinc-950/60 backdrop-blur-2xl rounded-t-[1.5rem] z-50 border-t border-white/5 shadow-[0_-10px_40px_rgba(0,255,65,0.1)]">
      {navItems.map((item: any) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center p-3 transition-all duration-300 ease-out relative",
              isActive 
                ? "text-primary scale-110" 
                : "text-zinc-500 hover:text-primary/60",
              item.isSpecial && "mx-2"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="absolute inset-0 bg-primary/10 rounded-2xl shadow-[0_0_15px_rgba(0,255,65,0.3)] -z-10"
              />
            )}
            {item.isSpecial ? (
              <div className="ai-space-btn">
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWJvdC1tZXNzYWdlLXNxdWFyZS1pY29uIGx1Y2lkZS1ib3QtbWVzc2FnZS1zcXVhcmUiPjxwYXRoIGQ9Ik0xMiA2VjJIOCIvPjxwYXRoIGQ9Ik0xNSAxMXYyIi8+PHBhdGggZD0iTTIgMTJoMiIvPjxwYXRoIGQ9Ik0yMCAxMmgyIi8+PHBhdGggZD0iTTIwIDE2YTIgMiAwIDAgMS0yIDJIOC44MjhhMiAyIDAgMCAwLTEuNDE0LjU4NmwtMi4yMDIgMi4yMDJBLjcxLjcxIDAgMCAxIDQgMjAuMjg2VjhhMiAyIDAgMCAxIDItMmgxMmEyIDIgMCAwIDEgMiAyeiIvPjxwYXRoIGQ9Ik05IDExdjIiLz48L3N2Zz4=" 
                  alt="Bot Icon" 
                  className="btn-icon" 
                />
                <div className="container-stars">
                  <div className="stars"></div>
                </div>
                <div className="glow">
                  <div className="circle"></div>
                  <div className="circle"></div>
                </div>
              </div>
            ) : (
              <item.icon className="w-6 h-6" />
            )}
            <span className="font-label text-[10px] uppercase tracking-widest mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

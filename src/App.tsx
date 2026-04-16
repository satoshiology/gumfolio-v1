import * as React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { TopAppBar, BottomNavBar } from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import SalesFeed from "./components/SalesFeed";
import Inventory from "./components/Inventory";
import Licenses from "./components/Licenses";
import Profile from "./components/Profile";
import AIAgent from "./components/AIAgent";
import Splash from "./components/Splash";
import LandingPage from "./components/LandingPage";
import Settings from "./components/Settings";
import { gumroadService } from "./services/gumroadService";
import { Smartphone } from "lucide-react";

function MobileOnlyMessage() {
  return (
    <div className="fixed inset-0 bg-surface-dim flex items-center justify-center p-6 text-center z-[9999]">
      <div className="max-w-sm space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">Mobile Only</h1>
        <p className="text-on-surface-variant text-lg">This platform is designed exclusively for mobile use. Please visit this app on your mobile device for the best experience.</p>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <div key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales" element={<SalesFeed />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ai" element={<AIAgent />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(!!gumroadService.getToken());
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) {
    return <MobileOnlyMessage />;
  }

  if (!isAuthenticated) {
    return <LandingPage onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-surface-dim text-on-surface font-body selection:bg-primary/30">
        <TopAppBar />
        <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
          <AnimatedRoutes />
        </main>
        <BottomNavBar />
      </div>
    </Router>
  );
}

import React from 'react';
import { 
  Terminal, Sparkles, Plus, Layers, Package, 
  ShoppingCart, Code2, Cpu, Wrench
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'tickets' | 'procurement' | 'inventory' | 'architecture';
  setActiveTab: (tab: 'tickets' | 'procurement' | 'inventory' | 'architecture') => void;
  onOpenNewIntake: () => void;
  openTicketsCount: number;
  missingStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIntake,
  openTicketsCount,
  missingStockCount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">TechIntake</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                  AI Engineering MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Computer & Network Work Orders • Technical Translation Engine
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tickets'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Work Orders</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-700/80 text-[10px] font-mono text-slate-200">
                {openTicketsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'procurement'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
              <span>Missing Stock</span>
              {missingStockCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-[10px] font-mono text-amber-300 border border-amber-800">
                  {missingStockCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'bg-indigo-950 text-indigo-200 border border-indigo-700 shadow-sm'
                  : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Blueprint & Schemas</span>
            </button>
          </nav>

          {/* Quick Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenNewIntake}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New AI Intake</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Home, List, PieChart, Plus, Target } from 'lucide-react';
import { motion } from 'motion/react';

export type TabType = 'dashboard' | 'transactions' | 'analytics' | 'planning';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, setActiveTab, onAddClick }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-safe flex justify-between items-center z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
      <button 
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Home size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Home</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('transactions')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'transactions' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <List size={24} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">History</span>
      </button>

      <div className="relative -top-6">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddClick}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center border-4 border-white"
        >
          <Plus size={28} strokeWidth={3} />
        </motion.button>
      </div>

      <button 
        onClick={() => setActiveTab('analytics')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'analytics' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <PieChart size={24} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Analytics</span>
      </button>
      
      <button 
        onClick={() => setActiveTab('planning')}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'planning' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <Target size={24} strokeWidth={activeTab === 'planning' ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Planning</span>
      </button>
    </div>
  );
};

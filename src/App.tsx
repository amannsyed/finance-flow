/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './store/FinanceContext';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Analytics } from './components/Analytics';
import { Planning } from './components/Planning';
import { BottomNav, TabType } from './components/BottomNav';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ProfileModal } from './components/ProfileModal';

import { Moon, Sun } from 'lucide-react';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { profile, theme, toggleTheme } = useFinance();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'FF';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      <div className="max-w-md mx-auto min-h-screen relative bg-slate-50 dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden flex flex-col transition-colors duration-200">
        
        {/* Header */}
        <header className="px-6 pt-12 pb-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 transition-colors duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                {activeTab === 'dashboard' && 'Overview'}
                {activeTab === 'transactions' && 'History'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'planning' && 'Planning'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold shadow-sm hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
              >
                {getInitials(profile.name)}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 overflow-y-auto pb-32 scrollbar-hide">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'transactions' && <Transactions />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'planning' && <Planning />}
        </main>

        {/* Navigation */}
        <BottomNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onAddClick={() => setIsAddModalOpen(true)} 
        />

        {/* Modals */}
        <AddTransactionModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

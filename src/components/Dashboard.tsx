import React, { useMemo, useState } from 'react';
import { useFinance, Transaction } from '../store/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { motion } from 'motion/react';
import { getCategoryColor } from '../utils/colors';
import { getCurrencySymbol } from '../utils/currency';

export const Dashboard: React.FC = () => {
  const { transactions, profile, refreshFromSheet } = useFinance();
  const currencySymbol = getCurrencySymbol(profile.currency || 'GBP');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      await refreshFromSheet();
      alert('Dashboard synced with Google Sheets!');
    } catch (error: any) {
      console.error('Sync Error:', error);
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const { balance, income, expense, recentTransactions } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const recent = transactions.slice(0, 5);

    transactions.forEach(t => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });

    return {
      balance: inc - exp,
      income: inc,
      expense: exp,
      recentTransactions: recent
    };
  }, [transactions]);

  const { thisMonthIncome, thisMonthExpense } = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let inc = 0;
    let exp = 0;

    transactions.forEach(t => {
      if (isAfter(new Date(t.date), startOfMonth)) {
        if (t.type === 'income') inc += t.amount;
        else exp += t.amount;
      }
    });

    return { thisMonthIncome: inc, thisMonthExpense: exp };
  }, [transactions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-8"
    >
      <div className="md:col-span-5 lg:col-span-4 space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-indigo-100">
              <Wallet size={20} />
              <span className="font-medium">Total Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSync}
                disabled={isSyncing || !profile.sheetId}
                className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isSyncing ? 'animate-spin' : ''}`}
                title={profile.sheetId ? "Sync with Google Sheets" : "Setup Google Sync first"}
              >
                <RefreshCw size={18} className="text-indigo-100" />
              </button>
              <TrendingUp size={20} className="text-indigo-200" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-4 tracking-tight">
            {currencySymbol}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          {!profile.sheetId && (
            <div className="mb-6 p-4 bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md">
              <p className="text-xs text-indigo-100 mb-3 leading-relaxed">
                Sync your data with Google Sheets to use it as a backend and access it from anywhere.
              </p>
              <button 
                onClick={() => alert('Click your profile icon (top right) to link or create a Google Sheet!')}
                className="w-full py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Database size={14} />
                Setup Google Sync
              </button>
            </div>
          )}
          
          {syncError && (
            <div className="mb-6 p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-100">
              <AlertCircle size={14} className="shrink-0" />
              <span className="truncate">{syncError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-100 mb-1 text-sm">
                <ArrowDownRight size={16} className="text-emerald-400" />
                Income
              </div>
              <div className="font-semibold text-lg">
                {currencySymbol}{thisMonthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-100 mb-1 text-sm">
                <ArrowUpRight size={16} className="text-rose-400" />
                Expense
              </div>
              <div className="font-semibold text-lg">
                {currencySymbol}{thisMonthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-7 lg:col-span-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">See all</span>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentTransactions.map((t) => {
                const color = getCategoryColor(t.category);
                return (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${color.bg} ${color.text}`}>
                      {t.type === 'income' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{t.category}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span>{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                        {t.bank && (
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">{t.bank}</span>
                          </div>
                        )}
                        {t.merchant && (
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t.merchant}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold shrink-0 ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

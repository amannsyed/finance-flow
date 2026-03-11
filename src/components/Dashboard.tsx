import React, { useMemo } from 'react';
import { useFinance, Transaction } from '../store/FinanceContext';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { motion } from 'motion/react';
import { getCategoryColor } from '../utils/colors';

export const Dashboard: React.FC = () => {
  const { transactions } = useFinance();

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
      className="space-y-6"
    >
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-indigo-100">
            <Wallet size={20} />
            <span className="font-medium">Total Balance</span>
          </div>
          <TrendingUp size={20} className="text-indigo-200" />
        </div>
        <div className="text-4xl font-bold mb-8 tracking-tight">
          £{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-100 mb-1 text-sm">
              <ArrowDownRight size={16} className="text-emerald-400" />
              Income
            </div>
            <div className="font-semibold text-lg">
              £{thisMonthIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-100 mb-1 text-sm">
              <ArrowUpRight size={16} className="text-rose-400" />
              Expense
            </div>
            <div className="font-semibold text-lg">
              £{thisMonthExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div>
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
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.bg} ${color.text}`}>
                      {t.type === 'income' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{t.category}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {format(new Date(t.date), 'MMM dd, yyyy')}
                        {t.bank && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-medium text-indigo-600 dark:text-indigo-400">{t.bank}</span>
                          </>
                        )}
                        {t.merchant && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t.merchant}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {t.type === 'income' ? '+' : '-'}£{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

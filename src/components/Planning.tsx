import React, { useState, useMemo } from 'react';
import { useFinance, Subscription } from '../store/FinanceContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, Check, X, Calendar, CreditCard, Target } from 'lucide-react';
import { getCategoryColor } from '../utils/colors';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const Planning: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'subscriptions'>('budgets');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6 transition-colors">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'budgets' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'subscriptions' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Subscriptions
        </button>
      </div>

      {activeTab === 'budgets' ? <BudgetsTab /> : <SubscriptionsTab />}
    </motion.div>
  );
};

const BudgetsTab: React.FC = () => {
  const { transactions, categories, budgets, setBudget, removeBudget } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categories.expense[0] || '');
  const [amount, setAmount] = useState('');

  const currentMonthExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const expenses: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })) {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      }
    });
    return expenses;
  }, [transactions]);

  const handleSaveBudget = () => {
    const numAmount = parseFloat(amount);
    if (selectedCategory && !isNaN(numAmount) && numAmount > 0) {
      setBudget(selectedCategory, numAmount);
      setIsAdding(false);
      setAmount('');
    }
  };

  const budgetItems = Object.entries(budgets).map(([cat, limitVal]) => {
    const limit = Number(limitVal);
    const spent = currentMonthExpenses[cat] || 0;
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const isOver = spent > limit;
    const color = getCategoryColor(cat);

    return { cat, limit, spent, percentage, isOver, color };
  }).sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Monthly Budgets</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories.expense.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Monthly Limit (£)</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleSaveBudget}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                  Save Budget
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {budgetItems.length === 0 && !isAdding ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 transition-colors">
          <Target size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p>No budgets set yet.</p>
          <p className="text-sm mt-1">Set limits for your categories to track your spending.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgetItems.map(({ cat, limit, spent, percentage, isOver, color }) => (
            <div key={cat} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.bg} ${color.text} dark:bg-opacity-20`}>
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">{cat}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      £{spent.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} of £{limit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeBudget(cat)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="relative h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden transition-colors">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`absolute top-0 left-0 h-full rounded-full ${isOver ? 'bg-rose-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                />
              </div>
              {isOver && (
                <p className="text-xs text-rose-500 dark:text-rose-400 mt-2 font-medium">
                  Over budget by £{(spent - limit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SubscriptionsTab: React.FC = () => {
  const { subscriptions, addSubscription, deleteSubscription, updateSubscription, categories, banks } = useFinance();
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories.expense[0] || '');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bank, setBank] = useState('');

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (name.trim() && !isNaN(numAmount) && numAmount > 0) {
      addSubscription({
        name: name.trim(),
        amount: numAmount,
        category,
        billingCycle,
        nextBillingDate: new Date(nextBillingDate).toISOString(),
        bank: bank || undefined,
        active: true
      });
      setIsAdding(false);
      setName('');
      setAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recurring Bills</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name (e.g. Netflix)</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Amount (£)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Cycle</label>
                  <select 
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Next Billing Date</label>
                  <input 
                    type="date" 
                    value={nextBillingDate}
                    onChange={(e) => setNextBillingDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categories.expense.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Bank (Optional)</label>
                  <select 
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">None</option>
                    {banks.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleSave}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                >
                  Save Subscription
                </button>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {subscriptions.length === 0 && !isAdding ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 transition-colors">
          <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p>No subscriptions added.</p>
          <p className="text-sm mt-1">Track your recurring bills to automatically log them.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const color = getCategoryColor(sub.category);
            return (
              <div key={sub.id} className={`bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors ${!sub.active ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.bg} ${color.text} dark:bg-opacity-20`}>
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">{sub.name}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        {sub.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        Next: {format(new Date(sub.nextBillingDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        £{sub.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <button 
                        onClick={() => updateSubscription(sub.id, { active: !sub.active })}
                        className={`text-xs font-medium ${sub.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}
                      >
                        {sub.active ? 'Active' : 'Paused'}
                      </button>
                    </div>
                    <button 
                      onClick={() => deleteSubscription(sub.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

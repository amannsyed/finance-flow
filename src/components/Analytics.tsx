import React, { useMemo } from 'react';
import { useFinance, Transaction } from '../store/FinanceContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, subDays, eachDayOfInterval } from 'date-fns';
import { motion } from 'motion/react';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

export const Analytics: React.FC = () => {
  const { transactions } = useFinance();

  // 1. Income vs Expense over last 6 months
  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      let income = 0;
      let expense = 0;
      
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (isWithinInterval(tDate, { start, end })) {
          if (t.type === 'income') income += t.amount;
          else expense += t.amount;
        }
      });
      
      data.push({
        name: format(date, 'MMM'),
        Income: income,
        Expense: expense,
        Savings: income - expense
      });
    }
    return data;
  }, [transactions]);

  // 2. Spending by Category (Current Month)
  const categoryData = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const categories: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense' && isWithinInterval(new Date(t.date), { start, end })) {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 3. Daily Spending Trend (Last 30 days)
  const dailyData = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 29);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      let expense = 0;
      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (t.type === 'expense' && tDate.getDate() === day.getDate() && tDate.getMonth() === day.getMonth()) {
          expense += t.amount;
        }
      });
      return {
        date: format(day, 'MMM dd'),
        amount: expense
      };
    });
  }, [transactions]);

  // 4. Spending by Bank (All time)
  const bankData = useMemo(() => {
    const banks: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'expense' && t.bank) {
        banks[t.bank] = (banks[t.bank] || 0) + t.amount;
      }
    });
    
    return Object.entries(banks)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // 5. Income by Category (Current Month)
  const incomeCategoryData = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const categories: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'income' && isWithinInterval(new Date(t.date), { start, end })) {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm">
          <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">£{entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Net Savings (6 Months)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `£${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Savings" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Income vs Expense</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `£${value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', className: 'dark:fill-slate-700/50' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Spending by Category</h3>
        {categoryData.length > 0 ? (
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                £{categoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">No expenses this month</div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {categoryData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{entry.name}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">£{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Income by Category</h3>
        {incomeCategoryData.length > 0 ? (
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {incomeCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                £{incomeCategoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">No income this month</div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {incomeCategoryData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{entry.name}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">£{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Spending by Bank (All Time)</h3>
        {bankData.length > 0 ? (
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bankData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {bankData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total</div>
              <div className="font-bold text-slate-800 dark:text-slate-100">
                £{bankData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500 dark:text-slate-400">No bank data available</div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {bankData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{entry.name}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">£{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-200">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">Daily Spending (30 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} minTickGap={30} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `£${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="amount" name="Expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

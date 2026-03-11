import React, { useState, useRef } from 'react';
import { useFinance, TransactionType, Transaction } from '../store/FinanceContext';
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Trash2, Download, Upload, Edit2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryColor } from '../utils/colors';
import { AddTransactionModal } from './AddTransactionModal';

export const Transactions: React.FC = () => {
  const { transactions, deleteTransaction, bulkAddTransactions } = useFinance();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'last_week' | 'last_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Bank', 'Merchant', 'Note'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        return [
          format(new Date(t.date), 'yyyy-MM-dd'),
          t.type,
          `"${t.category.replace(/"/g, '""')}"`,
          t.amount,
          `"${(t.bank || '').replace(/"/g, '""')}"`,
          `"${(t.merchant || '').replace(/"/g, '""')}"`,
          `"${(t.note || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) return;

      const parseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i+1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      };

      const newTransactions = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parsed = parseLine(line);
        if (parsed.length >= 4) {
          const [date, type, category, amount, bank, merchant, note] = parsed;
          const cleanType = type.toLowerCase().trim();
          if (cleanType === 'income' || cleanType === 'expense') {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              newTransactions.push({
                type: cleanType as TransactionType,
                category: category.replace(/^"|"$/g, '').trim(),
                amount: parseFloat(amount),
                date: parsedDate.toISOString(),
                bank: bank ? bank.replace(/^"|"$/g, '').trim() : undefined,
                merchant: merchant ? merchant.replace(/^"|"$/g, '').trim() : undefined,
                note: note ? note.replace(/^"|"$/g, '').trim() : ''
              });
            }
          }
        }
      }

      if (newTransactions.length > 0) {
        bulkAddTransactions(newTransactions);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (search && !t.category.toLowerCase().includes(search.toLowerCase()) && !t.note.toLowerCase().includes(search.toLowerCase()) && !t.merchant?.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (dateFilter !== 'all') {
      const tDate = new Date(t.date);
      const now = new Date();
      if (dateFilter === 'last_week') {
        if (isBefore(tDate, startOfDay(subDays(now, 7)))) return false;
      } else if (dateFilter === 'last_month') {
        if (isBefore(tDate, startOfDay(subMonths(now, 1)))) return false;
      } else if (dateFilter === 'custom') {
        if (startDate && isBefore(tDate, startOfDay(new Date(startDate)))) return false;
        if (endDate && isAfter(tDate, endOfDay(new Date(endDate)))) return false;
      }
    }
    
    return true;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md z-10 py-4 -mx-4 px-4 space-y-4 transition-colors duration-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-800 dark:text-slate-100"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center justify-between">
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('income')}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'income' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Income
            </button>
            <button 
              onClick={() => setFilter('expense')}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'expense' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              Expense
            </button>
          </div>
          
          <div className="flex gap-2 ml-auto">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none pl-10 pr-8 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">All Time</option>
                <option value="last_week">Last 7 Days</option>
                <option value="last_month">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Import CSV"
            >
              <Upload size={18} />
            </button>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImportCSV}
            />
            <button 
              onClick={handleExportCSV}
              className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Export CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {dateFilter === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-hidden pt-2"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Search size={24} className="text-slate-400 dark:text-slate-500" />
            </div>
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredTransactions.map((t) => {
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
                    {t.note && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{t.note}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {t.type === 'income' ? '+' : '-'}£{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <button 
                    onClick={() => setEditingTransaction(t)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                    title="Edit transaction"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => deleteTransaction(t.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                    title="Delete transaction"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <AddTransactionModal 
        isOpen={!!editingTransaction} 
        onClose={() => setEditingTransaction(null)} 
        initialData={editingTransaction} 
      />
    </motion.div>
  );
};

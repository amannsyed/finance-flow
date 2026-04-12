import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFinance, TransactionType, Transaction } from '../store/FinanceContext';
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Search, Filter, Trash2, Download, Upload, Edit2, Calendar, Database, Loader2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryColor } from '../utils/colors';
import { getCurrencySymbol } from '../utils/currency';
import { AddTransactionModal } from './AddTransactionModal';
import { ConfirmModal } from './ConfirmModal';

export const Transactions: React.FC = () => {
  const { transactions, deleteTransaction, bulkDeleteTransactions, bulkAddTransactions, banks, categories, profile, uploadAllToSheet, isSyncing } = useFinance();
  const currencySymbol = getCurrencySymbol(profile.currency || 'GBP');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'last_week' | 'last_month' | 'custom'>('all');
  const [bankFilters, setBankFilters] = useState<string[]>([]);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef<HTMLDivElement>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCategories = useMemo(() => {
    const cats = new Set<string>([...categories.income, ...categories.expense]);
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      cats.add(t.category);
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Array.from(cats).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  }, [categories, transactions]);

  const allBanks = useMemo(() => {
    const bSet = new Set<string>(banks);
    const counts: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.bank) {
        bSet.add(t.bank);
        counts[t.bank] = (counts[t.bank] || 0) + 1;
      }
    });
    return Array.from(bSet).sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
  }, [banks, transactions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCategoryDropdownOpen) {
          setIsCategoryDropdownOpen(false);
          categoryDropdownRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
        }
        if (isBankDropdownOpen) {
          setIsBankDropdownOpen(false);
          bankDropdownRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
        }
        if (isDateDropdownOpen) {
          setIsDateDropdownOpen(false);
          dateDropdownRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
        }
        if (isExportDropdownOpen) {
          setIsExportDropdownOpen(false);
          exportDropdownRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCategoryDropdownOpen, isBankDropdownOpen, isDateDropdownOpen, isExportDropdownOpen]);

  useEffect(() => {
    if (isBankDropdownOpen) {
      const timer = setTimeout(() => {
        bankDropdownRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isBankDropdownOpen]);

  useEffect(() => {
    if (isCategoryDropdownOpen) {
      const timer = setTimeout(() => {
        categoryDropdownRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    if (isDateDropdownOpen) {
      const timer = setTimeout(() => {
        dateDropdownRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isDateDropdownOpen]);

  useEffect(() => {
    if (isExportDropdownOpen) {
      const timer = setTimeout(() => {
        exportDropdownRef.current?.querySelector<HTMLButtonElement>('[role="option"]')?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExportDropdownOpen]);

  const handleListboxKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const options = Array.from(container.querySelectorAll('[role="option"]')) as HTMLButtonElement[];
    if (!options.length) return;
    
    const currentIndex = options.findIndex(opt => opt === document.activeElement);

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex !== -1) {
          options[currentIndex].click();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        const nextIdx = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        options[nextIdx].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIdx = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        options[prevIdx].focus();
        break;
      case 'Home':
        e.preventDefault();
        options[0].focus();
        break;
      case 'End':
        e.preventDefault();
        options[options.length - 1].focus();
        break;
    }
  };

  const handleSyncToSheet = async () => {
    if (!profile.sheetId) {
      alert('Click your profile icon (top right) to link or create a Google Sheet!');
      return;
    }
 
    try {
      // Upload all current transactions to the sheet
      await uploadAllToSheet();
      alert('All transactions have been synced to your Google Sheet!');
    } catch (error: any) {
      console.error('Sync to Sheet Error:', error);
      alert('Failed to sync to Google Sheets: ' + error.message);
    }
  };

  const handleExportCSV = (exportTransactions: Transaction[], filename: string) => {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Bank', 'Merchant', 'Note', 'ID'];
    const csvContent = [
      headers.join(','),
      ...exportTransactions.map(t => {
        return [
          format(new Date(t.date), 'yyyy-MM-dd'),
          t.type,
          `"${t.category.replace(/"/g, '""')}"`,
          t.amount,
          `"${(t.bank || '').replace(/"/g, '""')}"`,
          `"${(t.merchant || '').replace(/"/g, '""')}"`,
          `"${(t.note || '').replace(/"/g, '""')}"`,
          t.id
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://convert-transaction.onrender.com/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert file');
      }

      const { data } = await response.json();

      const newTransactions = data.map((apiT: any) => ({
        id: apiT.ID || apiT.id || undefined,
        type: (apiT.Type || 'expense').toLowerCase() as TransactionType,
        category: apiT.Category || (apiT.Type === 'income' ? categories.income[0] : categories.expense[0]) || 'Other',
        amount: parseFloat(apiT.Amount) || 0,
        date: apiT.Date ? new Date(apiT.Date).toISOString() : new Date().toISOString(),
        bank: apiT.Bank || undefined,
        merchant: apiT.Merchant || undefined,
        note: apiT.Note || ''
      }));

      if (newTransactions.length > 0) {
        bulkAddTransactions(newTransactions);
        alert(`Successfully imported ${newTransactions.length} transactions.`);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      alert(`Error importing transactions: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (bankFilters.length > 0 && (!t.bank || !bankFilters.includes(t.bank))) return false;
      if (categoryFilters.length > 0 && !categoryFilters.includes(t.category)) return false;
      
      if (search) {
        const q = search.toLowerCase();
        const inCategory = t.category?.toLowerCase().includes(q) ?? false;
        const inNote = t.note?.toLowerCase().includes(q) ?? false;
        const inMerchant = t.merchant?.toLowerCase().includes(q) ?? false;
        const inBank = t.bank?.toLowerCase().includes(q) ?? false;
        const inAmount = t.amount.toString().includes(q);
        
        if (!inCategory && !inNote && !inMerchant && !inBank && !inAmount) {
          return false;
        }
      }

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
  }, [transactions, filter, bankFilters, categoryFilters, search, dateFilter, startDate, endDate]);

  const { filteredIncome, filteredExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return { filteredIncome: inc, filteredExpense: exp };
  }, [filteredTransactions]);

  const hasFilters = filter !== 'all' || bankFilters.length > 0 || categoryFilters.length > 0 || search !== '' || dateFilter !== 'all';

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

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 shrink-0">
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

          <div className="flex gap-2 shrink-0 ml-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Import CSV"
            >
              {isUploading ? (
                <Loader2 size={18} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Upload size={18} />
              )}
            </button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImportCSV}
            />
            <div className="relative" ref={exportDropdownRef}>
              <button
                aria-haspopup="listbox"
                aria-expanded={isExportDropdownOpen}
                onClick={() => {
                  setIsExportDropdownOpen(prev => !prev);
                  setIsBankDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                  setIsDateDropdownOpen(false);
                }}
                className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                title="Export CSV"
              >
                <Download size={18} />
              </button>

              <AnimatePresence>
                {isExportDropdownOpen && (
                  <motion.div
                    role="listbox"
                    aria-label="Export options"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute top-full right-0 z-50 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2"
                  >
                    <button
                      type="button"
                      role="option"
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                      onClick={() => handleExportCSV(transactions, 'all_transactions.csv')}
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Export All Data</span>
                    </button>
                    {hasFilters && (
                      <button
                        type="button"
                        role="option"
                        className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                        onClick={() => handleExportCSV(filteredTransactions, 'filtered_transactions.csv')}
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Export Filtered Data</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {filteredTransactions.length > 0 && (
              <button
                onClick={() => setIsBulkDeleting(true)}
                className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shadow-sm"
                title={hasFilters ? `Delete ${filteredTransactions.length} filtered transactions` : `Delete all ${filteredTransactions.length} transactions`}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button 
                onClick={handleSyncToSheet}
                disabled={isSyncing}
                className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sync All to Google Sheets"
              >
                {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-2">
            <div className="relative shrink-0" ref={bankDropdownRef}>
              <button
                aria-haspopup="listbox"
                aria-expanded={isBankDropdownOpen}
                onClick={() => {
                  setIsBankDropdownOpen(prev => !prev);
                  setIsCategoryDropdownOpen(false);
                  setIsDateDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
                className="appearance-none pl-4 pr-8 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 whitespace-nowrap"
              >
                {bankFilters.length === 0 ? 'All Banks' : `${bankFilters.length} Banks`}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>

              <AnimatePresence>
                {isBankDropdownOpen && (
                  <motion.div
                    role="listbox"
                    aria-label="Filter by bank"
                    aria-multiselectable="true"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute top-full right-0 sm:left-0 sm:right-auto z-50 mt-2 w-56 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 scrollbar-hide"
                  >
                    <button 
                      type="button"
                      role="option"
                      aria-selected={bankFilters.length === 0}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                      onClick={() => setBankFilters([])}
                    >
                      <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${bankFilters.length === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                        {bankFilters.length === 0 ? <Check size={12} /> : (bankFilters.length > 0 ? <X size={12} className="text-slate-400" /> : null)}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{bankFilters.length === 0 ? 'All Banks' : 'Clear Filters'}</span>
                    </button>
                    
                    {allBanks.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 px-2 pointer-events-none" />}

                    {allBanks.map(b => {
                      const isSelected = bankFilters.includes(b);
                      return (
                        <button 
                          key={b}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                          onClick={() => {
                            if (isSelected) {
                              setBankFilters(prev => prev.filter(bank => bank !== b));
                            } else {
                              setBankFilters(prev => [...prev, b]);
                            }
                          }}
                        >
                          <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{b}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0" ref={categoryDropdownRef}>
              <button
                aria-haspopup="listbox"
                aria-expanded={isCategoryDropdownOpen}
                onClick={() => {
                  setIsCategoryDropdownOpen(prev => !prev);
                  setIsBankDropdownOpen(false);
                  setIsDateDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
                className="appearance-none pl-4 pr-8 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 whitespace-nowrap"
              >
                {categoryFilters.length === 0 ? 'All Categories' : `${categoryFilters.length} Categories`}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    role="listbox"
                    aria-label="Filter by category"
                    aria-multiselectable="true"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute top-full right-0 sm:left-0 sm:right-auto z-50 mt-2 w-56 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2 scrollbar-hide"
                  >
                    <button 
                      type="button"
                      role="option"
                      aria-selected={categoryFilters.length === 0}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                      onClick={() => setCategoryFilters([])}
                    >
                      <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${categoryFilters.length === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}`}>
                        {categoryFilters.length === 0 ? <Check size={12} /> : (categoryFilters.length > 0 ? <X size={12} className="text-slate-400" /> : null)}
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{categoryFilters.length === 0 ? 'All Categories' : 'Clear Filters'}</span>
                    </button>
                    
                    {allCategories.length > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 px-2 pointer-events-none" />}

                    {allCategories.map(c => {
                      const isSelected = categoryFilters.includes(c);
                      return (
                        <button 
                          key={c}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                          onClick={() => {
                            if (isSelected) {
                              setCategoryFilters(prev => prev.filter(cat => cat !== c));
                            } else {
                              setCategoryFilters(prev => [...prev, c]);
                            }
                          }}
                        >
                          <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                            {isSelected && <Check size={12} />}
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{c}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative shrink-0" ref={dateDropdownRef}>
              <button
                aria-haspopup="listbox"
                aria-expanded={isDateDropdownOpen}
                onClick={() => {
                  setIsDateDropdownOpen(prev => !prev);
                  setIsBankDropdownOpen(false);
                  setIsCategoryDropdownOpen(false);
                  setIsExportDropdownOpen(false);
                }}
                className="appearance-none pl-10 pr-8 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 whitespace-nowrap"
              >
                {dateFilter === 'all' ? 'All Time' : dateFilter === 'last_week' ? 'Last 7 Days' : dateFilter === 'last_month' ? 'Last 30 Days' : 'Custom Range'}
              </button>
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>

              <AnimatePresence>
                {isDateDropdownOpen && (
                  <motion.div
                    role="listbox"
                    aria-label="Filter by date"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute top-full right-0 sm:left-auto sm:right-0 z-50 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-2"
                  >
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: 'last_week', label: 'Last 7 Days' },
                      { value: 'last_month', label: 'Last 30 Days' },
                      { value: 'custom', label: 'Custom Range' }
                    ].map(option => {
                      const isSelected = dateFilter === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer transition-colors focus:outline-none focus:bg-slate-50 dark:focus:bg-slate-700/50"
                          onClick={() => {
                            setDateFilter(option.value as any);
                            setIsDateDropdownOpen(false);
                          }}
                        >
                          <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600' : 'border-transparent'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-center">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Total Income</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {currencySymbol}{filteredIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-800/30 flex flex-col justify-center">
          <p className="text-sm text-rose-600 dark:text-rose-400 font-medium mb-1">Total Expense</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {currencySymbol}{filteredExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
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
                      {t.note && <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{t.note}</div>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                    <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {t.type === 'income' ? '+' : '-'}{currencySymbol}{t.amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setEditingTransaction(t)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                      title="Edit transaction"
                    >
                      <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => setDeletingTransactionId(t.id)}
                      className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        initialData={editingTransaction}
      />
      <ConfirmModal
        isOpen={!!deletingTransactionId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={() => {
          if (deletingTransactionId) {
            deleteTransaction(deletingTransactionId);
            setDeletingTransactionId(null);
          }
        }}
        onCancel={() => setDeletingTransactionId(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleting}
        title={hasFilters ? "Delete Filtered Transactions" : "Delete All Transactions"}
        message={`Are you sure you want to delete ${filteredTransactions.length} transaction(s)? This action cannot be undone.`}
        onConfirm={() => {
          bulkDeleteTransactions(filteredTransactions.map(t => t.id));
          setIsBulkDeleting(false);
        }}
        onCancel={() => setIsBulkDeleting(false)}
      />
    </motion.div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance, TransactionType, Transaction } from '../store/FinanceContext';
import { X, Check, Plus, Calculator, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryColor } from '../utils/colors';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
}

const evaluateMath = (expr: string): number | null => {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/.()]/g, '');
    if (!sanitized) return null;
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Number(result.toFixed(2));
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, initialData }) => {
  const { transactions, addTransaction, editTransaction, categories, addCategory, removeCategory, banks, addBank } = useFinance();
  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [bank, setBank] = useState('');
  const [merchant, setMerchant] = useState('');

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  const recentMerchants = useMemo(() => {
    const merchants = new Set<string>();
    for (const t of transactions) {
      if (t.merchant && t.merchant.trim() !== '') {
        merchants.add(t.merchant.trim());
      }
      if (merchants.size >= 10) break;
    }
    return Array.from(merchants);
  }, [transactions]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmountInput(initialData.amount.toString());
        setCalculatedAmount(initialData.amount);
        setCategory(initialData.category);
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
        setNote(initialData.note || '');
        setBank(initialData.bank || '');
        setMerchant(initialData.merchant || '');
        setShowCalculator(false);
      } else {
        setAmountInput('');
        setCalculatedAmount(null);
        setNote('');
        setBank('');
        setMerchant('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('expense');
        setCategory(categories.expense[0] || '');
        setShowCalculator(true); // Show calculator by default when opening new
      }
      setIsEditingCategories(false);
      setIsAddingCategory(false);
      setNewCategoryName('');
      setIsAddingBank(false);
      setNewBankName('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  useEffect(() => {
    setCalculatedAmount(evaluateMath(amountInput));
  }, [amountInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = evaluateMath(amountInput);
    if (finalAmount === null || finalAmount <= 0 || !category) return;

    const transactionData = {
      type,
      amount: finalAmount,
      category,
      date: new Date(date).toISOString(),
      note,
      bank: bank.trim() || undefined,
      merchant: merchant.trim() || undefined
    };

    if (initialData) {
      editTransaction(initialData.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(categories[newType][0] || '');
    setIsEditingCategories(false);
    setIsAddingCategory(false);
    setNewCategoryName('');
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_NEW') {
      setIsAddingBank(true);
      setBank('');
    } else {
      setBank(e.target.value);
    }
  };

  const handleCalcInput = (val: string) => {
    if (val === 'C') {
      setAmountInput('');
      return;
    }
    if (val === 'DEL') {
      setAmountInput(prev => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      if (calculatedAmount !== null) {
        setAmountInput(calculatedAmount.toString());
      }
      setShowCalculator(false);
      return;
    }
    
    const isOperator = ['+', '-', '*', '/'].includes(val);
    const lastChar = amountInput.slice(-1);
    
    // Prevent multiple operators
    if (isOperator && ['+', '-', '*', '/'].includes(lastChar)) {
      setAmountInput(prev => prev.slice(0, -1) + val);
      return;
    }
    
    setAmountInput(prev => prev + val);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide transition-colors duration-200"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl transition-colors">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    type === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    type === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Amount</label>
                <div 
                  onClick={() => setShowCalculator(true)}
                  className={`relative w-full bg-slate-50 dark:bg-slate-800 border ${showCalculator ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-2xl py-4 pl-10 pr-4 text-2xl font-semibold text-slate-800 dark:text-slate-100 cursor-pointer transition-all flex items-center justify-between min-h-[64px]`}
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-slate-400 dark:text-slate-500">£</span>
                  <span className={amountInput ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}>
                    {amountInput || '0.00'}
                  </span>
                  <Calculator size={20} className={showCalculator ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                </div>
                
                {amountInput && /[+\-*/]/.test(amountInput) && calculatedAmount !== null && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 mt-2 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg">
                    = £{calculatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}

                <AnimatePresence>
                  {showCalculator && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {['C', '/', '*', 'DEL'].map(btn => (
                          <button 
                            key={btn} 
                            type="button" 
                            onClick={() => handleCalcInput(btn)} 
                            className={`p-3 rounded-xl font-semibold text-lg ${btn === 'C' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : btn === 'DEL' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'}`}
                          >
                            {btn === 'DEL' ? <Delete size={20} className="mx-auto" /> : btn}
                          </button>
                        ))}
                        {['7', '8', '9', '-'].map(btn => (
                          <button key={btn} type="button" onClick={() => handleCalcInput(btn)} className={`p-3 rounded-xl font-semibold text-lg ${['-', '+'].includes(btn) ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{btn}</button>
                        ))}
                        {['4', '5', '6', '+'].map(btn => (
                          <button key={btn} type="button" onClick={() => handleCalcInput(btn)} className={`p-3 rounded-xl font-semibold text-lg ${['-', '+'].includes(btn) ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{btn}</button>
                        ))}
                        <div className="col-span-4 grid grid-cols-4 gap-2">
                          <div className="col-span-3 grid grid-cols-3 gap-2">
                            {['1', '2', '3', '.', '0', '='].map(btn => (
                              <button 
                                key={btn} 
                                type="button" 
                                onClick={() => handleCalcInput(btn)} 
                                className={`p-3 rounded-xl font-semibold text-lg ${btn === '=' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              >
                                {btn}
                              </button>
                            ))}
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setShowCalculator(false)} 
                            className="col-span-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-500/30 flex items-center justify-center"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!showCalculator && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Category</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsEditingCategories(!isEditingCategories);
                          setIsAddingCategory(false);
                        }} 
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        {isEditingCategories ? 'Done' : 'Edit Categories'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories[type].map(cat => {
                        const color = getCategoryColor(cat);
                        const isSelected = category === cat && !isEditingCategories;
                        return (
                        <div key={cat} className="relative">
                          <button
                            type="button"
                            onClick={() => !isEditingCategories && setCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                              isSelected
                                ? `${color.bg} ${color.text} border-transparent shadow-sm`
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            } ${isEditingCategories ? 'pr-8 opacity-80' : ''}`}
                          >
                            {cat}
                          </button>
                          {isEditingCategories && (
                            <button
                              type="button"
                              onClick={() => {
                                removeCategory(type, cat);
                                if (category === cat) setCategory(categories[type].find(c => c !== cat) || '');
                              }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      )})}
                      
                      {isEditingCategories && !isAddingCategory && (
                        <button
                          type="button"
                          onClick={() => setIsAddingCategory(true)}
                          className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-1"
                        >
                          <Plus size={16} /> Add
                        </button>
                      )}

                      {isAddingCategory && (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            autoFocus
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newCategoryName.trim()) {
                                  addCategory(type, newCategoryName);
                                  setCategory(newCategoryName.trim());
                                }
                                setNewCategoryName('');
                                setIsAddingCategory(false);
                              } else if (e.key === 'Escape') {
                                setIsAddingCategory(false);
                                setNewCategoryName('');
                              }
                            }}
                            className="w-28 px-3 py-2 text-sm rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="Name..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newCategoryName.trim()) {
                                addCategory(type, newCategoryName);
                                setCategory(newCategoryName.trim());
                              }
                              setNewCategoryName('');
                              setIsAddingCategory(false);
                            }}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName('');
                            }}
                            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Date</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Note (Optional)</label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Lunch"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Company / Brand (Optional)</label>
                      <input
                        type="text"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        list="recent-merchants"
                        placeholder="e.g. Amazon, Starbucks"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <datalist id="recent-merchants">
                        {recentMerchants.map(m => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Bank (Optional)</label>
                      {isAddingBank ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newBankName}
                            onChange={(e) => setNewBankName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newBankName.trim()) {
                                  addBank(newBankName);
                                  setBank(newBankName.trim());
                                }
                                setIsAddingBank(false);
                                setNewBankName('');
                              } else if (e.key === 'Escape') {
                                setIsAddingBank(false);
                                setNewBankName('');
                              }
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="Bank name..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newBankName.trim()) {
                                addBank(newBankName);
                                setBank(newBankName.trim());
                              }
                              setIsAddingBank(false);
                              setNewBankName('');
                            }}
                            className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 rounded-xl transition-colors"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingBank(false);
                              setNewBankName('');
                            }}
                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={bank}
                            onChange={handleBankChange}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 pr-10 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all appearance-none"
                          >
                            <option value="">None</option>
                            {banks.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                            <option value="ADD_NEW">+ Add more bank</option>
                          </select>
                          <div className="absolute right-4 top-[14px] pointer-events-none text-slate-400 dark:text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </div>
                        </div>
                      )}
                    </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={24} />
                    Save Transaction
                  </button>
                </motion.div>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO string
  note: string;
  bank?: string;
  merchant?: string;
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface Categories {
  income: string[];
  expense: string[];
}

export interface Budgets {
  [category: string]: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  category: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string; // ISO string
  bank?: string;
  active: boolean;
}

export type Theme = 'light' | 'dark';

interface FinanceContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  categories: Categories;
  addCategory: (type: TransactionType, category: string) => void;
  removeCategory: (type: TransactionType, category: string) => void;
  banks: string[];
  addBank: (bank: string) => void;
  removeBank: (bank: string) => void;
  bulkAddTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  
  budgets: Budgets;
  setBudget: (category: string, amount: number) => void;
  removeBudget: (category: string) => void;
  
  subscriptions: Subscription[];
  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, s: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  
  theme: Theme;
  toggleTheme: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_flow_transactions_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse transactions', e);
      }
    }
    return [];
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finance_flow_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
    return { name: 'Finance Flow', email: '' };
  });

  const [categories, setCategories] = useState<Categories>(() => {
    const saved = localStorage.getItem('finance_flow_categories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse categories', e);
      }
    }
    return {
      expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'],
      income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Other']
    };
  });

  const [banks, setBanks] = useState<string[]>(() => {
    const saved = localStorage.getItem('finance_flow_banks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse banks', e);
      }
    }
    return [
      'Amex Credit Card',
      'Monzo Credit Card',
      'Monzo',
      'Bank of Scotland',
      'Revolut'
    ];
  });

  const [budgets, setBudgets] = useState<Budgets>(() => {
    const saved = localStorage.getItem('finance_flow_budgets');
    return saved ? JSON.parse(saved) : {};
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('finance_flow_subscriptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('finance_flow_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('finance_flow_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_flow_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('finance_flow_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance_flow_banks', JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem('finance_flow_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('finance_flow_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('finance_flow_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: Math.random().toString(36).substring(7),
    };
    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const editTransaction = (id: string, updatedT: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updatedT, id } : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const bulkAddTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const withIds = newTransactions.map(t => ({
      ...t,
      id: Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7)
    }));
    setTransactions(prev => [...withIds, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateProfile = (p: UserProfile) => {
    setProfile(p);
  };

  const addCategory = (type: TransactionType, category: string) => {
    if (!category.trim()) return;
    setCategories(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], category.trim()])]
    }));
  };

  const removeCategory = (type: TransactionType, category: string) => {
    setCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(c => c !== category)
    }));
  };

  const addBank = (bank: string) => {
    if (!bank.trim()) return;
    setBanks(prev => [...new Set([...prev, bank.trim()])]);
  };

  const removeBank = (bank: string) => {
    setBanks(prev => prev.filter(b => b !== bank));
  };

  const setBudget = (category: string, amount: number) => {
    setBudgets(prev => ({ ...prev, [category]: amount }));
  };

  const removeBudget = (category: string) => {
    setBudgets(prev => {
      const newBudgets = { ...prev };
      delete newBudgets[category];
      return newBudgets;
    });
  };

  const addSubscription = (s: Omit<Subscription, 'id'>) => {
    setSubscriptions(prev => [...prev, { ...s, id: Math.random().toString(36).substring(7) }]);
  };

  const updateSubscription = (id: string, s: Partial<Subscription>) => {
    setSubscriptions(prev => prev.map(sub => sub.id === id ? { ...sub, ...s } : sub));
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  // Auto-log subscriptions
  useEffect(() => {
    const checkSubscriptions = () => {
      const today = new Date();
      let updatedSubs = false;
      let newTransactions: Omit<Transaction, 'id'>[] = [];

      const processedSubs = subscriptions.map(sub => {
        if (!sub.active) return sub;

        let nextDate = new Date(sub.nextBillingDate);
        let subUpdated = false;

        while (nextDate <= today) {
          newTransactions.push({
            type: 'expense',
            amount: sub.amount,
            category: sub.category,
            date: nextDate.toISOString(),
            note: `Subscription: ${sub.name}`,
            bank: sub.bank,
            merchant: sub.name
          });

          if (sub.billingCycle === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1);
          } else if (sub.billingCycle === 'yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }
          subUpdated = true;
        }

        if (subUpdated) {
          updatedSubs = true;
          return { ...sub, nextBillingDate: nextDate.toISOString() };
        }
        return sub;
      });

      if (newTransactions.length > 0) {
        const withIds = newTransactions.map(t => ({
          ...t,
          id: Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7)
        }));
        setTransactions(prev => [...withIds, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
      if (updatedSubs) {
        setSubscriptions(processedSubs);
      }
    };

    checkSubscriptions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FinanceContext.Provider value={{ 
      transactions, addTransaction, editTransaction, deleteTransaction, 
      profile, updateProfile,
      categories, addCategory, removeCategory,
      banks, addBank, removeBank, bulkAddTransactions,
      budgets, setBudget, removeBudget,
      subscriptions, addSubscription, updateSubscription, deleteSubscription,
      theme, toggleTheme
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

import React, { useState, useEffect } from 'react';
import { useFinance } from '../store/FinanceContext';
import { X, Check, AlertTriangle, Loader2, Database, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CURRENCIES } from '../utils/currency';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, updateCurrency, resetData, serviceAccountEmail } = useFinance();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currency, setCurrency] = useState(profile.currency || 'GBP');
  const [sheetId, setSheetId] = useState(profile.sheetId || '');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setEmail(profile.email);
      setCurrency(profile.currency || 'GBP');
      setSheetId(profile.sheetId || '');
      setShowResetConfirm(false);
      setError('');
    }
  }, [isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const updatedProfile = { name, email, currency, sheetId };

    if (currency !== profile.currency) {
      setIsConverting(true);
      try {
        const res = await fetch(`/api/rates?from=${profile.currency || 'GBP'}&to=${currency}`).catch(e => {
          throw new Error(`Network error while fetching exchange rates: ${e.message}`);
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errorData.error || `Exchange rate API returned ${res.status}`);
        }
        const data = await res.json();
        const rate = data.rates[currency];
        
        if (rate) {
          updateCurrency(currency, rate);
          updateProfile(updatedProfile);
          onClose();
        } else {
          throw new Error('Invalid rate received');
        }
      } catch (err: any) {
        console.error(err);
        setError(`Failed to convert currency: ${err.message || 'Unknown error'}. Please check your connection or try again later.`);
      } finally {
        setIsConverting(false);
      }
    } else {
      updateProfile(updatedProfile);
      onClose();
    }
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
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 shadow-2xl transition-colors duration-200 max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Edit Profile</h2>
              <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                {currency !== profile.currency && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                    Note: Changing currency will automatically convert all your existing transactions and budgets using live exchange rates.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Database size={16} />
                    Google Sheet Sync
                  </label>
                  {sheetId && (
                    <a 
                      href={`https://drive.google.com/open?id=${sheetId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      Open File <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={sheetId}
                    onChange={(e) => setSheetId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Enter Google Sheet or CSV File ID"
                  />
                  
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Account Email</span>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(serviceAccountEmail);
                        alert('Service Account Email copied to clipboard!');
                      }}
                      className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Copy Email
                    </button>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 mb-3">
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono break-all leading-relaxed">
                      {serviceAccountEmail || 'loading...'}
                    </p>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mb-3">
                    Create a new Google Sheet manually by downloading CSV and upload it in Google and share it with the email above as an <b>Editor</b>.
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-1">Manual Setup (Recommended):</p>
                    <ol className="text-[9px] text-slate-500 dark:text-slate-400 space-y-1 list-decimal ml-3">
                      <li>Create a new Google Sheet or upload a CSV file manually.</li>
                      <li>Click "Share" and add the email above as an <b>Editor</b>.</li>
                      <li>Copy the ID from the URL and paste it in the field above.</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isConverting}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Converting Data...
                  </>
                ) : (
                  <>
                    <Check size={24} />
                    Save Profile
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-3 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={20} />
                  Reset All Data
                </button>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800/50">
                  <p className="text-sm text-rose-800 dark:text-rose-200 font-medium mb-4 text-center">
                    Are you sure? This will delete all your transactions, budgets, and custom settings permanently.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetData();
                        onClose();
                      }}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      Yes, Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

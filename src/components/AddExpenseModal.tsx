"use client";

import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { addExpense } from "@/lib/db";
import { format } from "date-fns";
import { CURRENCIES } from "@/lib/currencies";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  baseCurrency: string;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, tripId, baseCurrency, onExpenseAdded }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    currency: baseCurrency,
    category: "Food",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let convertedAmount = parseFloat(formData.amount);
    if (formData.currency !== baseCurrency) {
      const rates: Record<string, number> = {
        "USD_EUR": 0.92, "EUR_USD": 1.09,
        "USD_BRL": 5.10, "BRL_USD": 0.20,
        "EUR_BRL": 5.50, "BRL_EUR": 0.18,
      };
      const key = `${formData.currency}_${baseCurrency}`;
      const rate = rates[key] || 1;
      convertedAmount = convertedAmount * rate;
    }

    try {
      await addExpense({
        tripId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        convertedAmount: convertedAmount,
        category: formData.category as any,
        date: new Date(formData.date),
        notes: formData.notes,
      });
      
      // Notify parent and close immediately for reliability
      onExpenseAdded();
      onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
          <h2 className="text-xl font-bold text-stone-800">Add Expense</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Amount</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-300">
                  <DollarSign className="h-4 w-4" />
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Currency</label>
              <select
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Category</label>
            <select
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Activities">Activities</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Date</label>
            <input
              type="date"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Notes</label>
            <input
              type="text"
              placeholder="What was this for?"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            disabled={loading || isSuccess}
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:bg-stone-300 ${
              isSuccess ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Recording..." : isSuccess ? "Expense Added!" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}

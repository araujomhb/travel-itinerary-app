"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addExpense } from "@/lib/db";
import { format } from "date-fns";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  baseCurrency: string;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, tripId, baseCurrency, onExpenseAdded }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
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
    
    // Simple mock conversion for now (1.0 ratio if same, otherwise dummy rates)
    // In a real app, we'd fetch from an API
    let convertedAmount = parseFloat(formData.amount);
    if (formData.currency !== baseCurrency) {
      const rates: Record<string, number> = {
        "USD_EUR": 0.92, "EUR_USD": 1.09,
        "USD_BRL": 5.10, "BRL_USD": 0.20,
        "EUR_BRL": 5.50, "BRL_EUR": 0.18,
        // Add more or default to 1
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
      onExpenseAdded();
      onClose();
      setFormData({ ...formData, amount: "", notes: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BRL">BRL</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Dinner at hotel"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-md"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}

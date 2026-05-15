"use client";

import { useState } from "react";
import { X, Calendar, Globe } from "lucide-react";
import { createTrip } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currencies";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onTripCreated?: (tripId: string) => void;
}

export default function NewTripModal({ isOpen, onClose, destination, onTripCreated }: NewTripModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city: "",
    startDate: "",
    endDate: "",
    baseCurrency: "USD",
    status: "planned" as "planned" | "visited",
    averageDailyExpense: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const docRef = await createTrip({
        userId: user.uid,
        destination: destination,
        city: formData.city,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        baseCurrency: formData.baseCurrency,
        status: formData.status,
        averageDailyExpense: formData.averageDailyExpense ? parseFloat(formData.averageDailyExpense) : undefined,
      });
      
      if (onTripCreated && docRef.id) {
        onTripCreated(docRef.id);
      } else {
        onClose();
        router.push(`/trip/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-stone-800">Plan your trip</h2>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              Destination
            </label>
            <div className="flex items-center gap-3 p-4 bg-stone-100 rounded-2xl border border-stone-200">
              <Globe className="h-5 w-5 text-stone-400" />
              <span className="font-bold text-stone-700">{destination}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              City
            </label>
            <input
              type="text"
              placeholder="e.g. Paris"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
                Start Date
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
                End Date
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
                Base Currency
              </label>
              <select
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium"
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
                Avg. Daily Expense
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium"
                value={formData.averageDailyExpense}
                onChange={(e) => setFormData({ ...formData, averageDailyExpense: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              Trip Status
            </label>
            <select
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "visited" })}
            >
              <option value="planned">Planned (Want to Visit)</option>
              <option value="visited">Visited</option>
            </select>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:bg-stone-300"
          >
            {loading ? "Preparing..." : "Create Itinerary"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Globe, Trash2, Save } from "lucide-react";
import { updateTrip, deleteTrip, Trip } from "@/lib/db";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CURRENCIES } from "@/lib/currencies";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export default function EditTripModal({ isOpen, onClose, trip }: EditTripModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    destination: trip.destination,
    city: trip.city || "",
    startDate: trip.startDate ? format(trip.startDate, "yyyy-MM-dd") : "",
    endDate: trip.endDate ? format(trip.endDate, "yyyy-MM-dd") : "",
    baseCurrency: trip.baseCurrency,
    status: trip.status || "planned",
    averageDailyExpense: trip.averageDailyExpense?.toString() || "",
  });

  useEffect(() => {
    setFormData({
      destination: trip.destination,
      city: trip.city || "",
      startDate: trip.startDate ? format(trip.startDate, "yyyy-MM-dd") : "",
      endDate: trip.endDate ? format(trip.endDate, "yyyy-MM-dd") : "",
      baseCurrency: trip.baseCurrency,
      status: trip.status || "planned",
      averageDailyExpense: trip.averageDailyExpense?.toString() || "",
    });
  }, [trip]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip.id) return;

    setLoading(true);
    try {
      const updateData: any = {
        destination: formData.destination,
        city: formData.city,
        baseCurrency: formData.baseCurrency,
        status: formData.status as "planned" | "visited",
      };
      
      if (formData.startDate) updateData.startDate = new Date(formData.startDate);
      if (formData.endDate) updateData.endDate = new Date(formData.endDate);
      
      await updateTrip(trip.id, updateData);
      onClose();
    } catch (error) {
      console.error("Error updating trip:", error);
      alert("Failed to update trip.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!trip.id) return;
    if (confirm("Are you sure you want to delete this entire itinerary? This cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteTrip(trip.id);
        onClose();
        // Since it's likely open in a new tab, we redirect to home
        // The user might just close the tab manually too
        router.push("/");
      } catch (error) {
        console.error("Error deleting trip:", error);
        alert("Failed to delete trip.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 font-sans">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-stone-800">Edit Itinerary</h2>
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-300">
                <Globe className="h-5 w-5" />
              </div>
              <input
                required
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              City
            </label>
            <input
              type="text"
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

          <div className="pt-4 flex flex-col gap-3">
            <button
              disabled={loading || isDeleting}
              type="submit"
              className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg active:scale-[0.98] disabled:bg-stone-300"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
            
            <button
              type="button"
              disabled={loading || isDeleting}
              onClick={handleDelete}
              className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Itinerary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

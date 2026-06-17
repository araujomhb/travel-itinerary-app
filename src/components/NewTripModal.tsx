"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Globe, Plus, Trash2, MapPin, Info } from "lucide-react";
import { createTrip } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currencies";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onTripCreated?: (tripId: string) => void;
  initialStatus?: "planned" | "visited";
  initialName?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialNotes?: string;
}

export default function NewTripModal({ 
  isOpen, 
  onClose, 
  destination, 
  onTripCreated, 
  initialStatus = "planned",
  initialName = "",
  initialStartDate = "",
  initialEndDate = "",
  initialNotes = ""
}: NewTripModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialName,
    cities: [] as string[],
    newCity: "",
    startDate: initialStartDate,
    endDate: initialEndDate,
    baseCurrency: "USD",
    status: initialStatus,
    totalTripCost: "",
    notes: initialNotes,
    categoryBudgets: {
      Food: "",
      Transport: "",
      Accommodation: "",
      Activities: "",
      Other: ""
    }
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        status: initialStatus,
        name: initialName || `${destination} Trip`,
        startDate: initialStartDate,
        endDate: initialEndDate,
        notes: initialNotes
      }));
    }
  }, [initialStatus, isOpen, destination, initialName, initialStartDate, initialEndDate, initialNotes]);

  if (!isOpen) return null;

  const addCity = () => {
    if (formData.newCity.trim()) {
      setFormData({
        ...formData,
        cities: [...formData.cities, formData.newCity.trim()],
        newCity: ""
      });
    }
  };

  const removeCity = (index: number) => {
    const updatedCities = [...formData.cities];
    updatedCities.splice(index, 1);
    setFormData({ ...formData, cities: updatedCities });
  };

  const handleBudgetChange = (category: string, value: string) => {
    setFormData({
      ...formData,
      categoryBudgets: {
        ...formData.categoryBudgets,
        [category]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create a trip.");
      return;
    }

    setLoading(true);
    try {
      const parseNumber = (val: string) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      };

      const parseDate = (val: string) => {
        if (!val) return undefined;
        const d = new Date(val + "T12:00:00");
        return isNaN(d.getTime()) ? undefined : d;
      };

      // Construct category budgets
      const budgets: any = {};
      Object.entries(formData.categoryBudgets).forEach(([cat, val]) => {
        const num = parseNumber(val);
        if (num !== undefined) budgets[cat] = num;
      });

      const tripData: any = {
        userId: user.uid,
        name: formData.name || `${destination} Trip`,
        destination: destination,
        cities: formData.cities,
        baseCurrency: formData.baseCurrency,
        status: formData.status as "planned" | "visited",
        notes: formData.notes,
        categoryBudgets: budgets,
      };

      const startDate = parseDate(formData.startDate);
      if (startDate) tripData.startDate = startDate;

      const endDate = parseDate(formData.endDate);
      if (endDate) tripData.endDate = endDate;

      const total = parseNumber(formData.totalTripCost);
      if (total !== undefined) tripData.totalTripCost = total;

      const docRef = await createTrip(tripData);
      
      onClose();
      if (onTripCreated && docRef.id) {
        onTripCreated(docRef.id);
      }
    } catch (error: any) {
      console.error("Detailed creation error:", error);
      alert(error.message || "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-2xl bg-stone-50 rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-8 border-b border-stone-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-2xl">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Plan New Journey</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">To {destination}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Trip Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Summer Vacation 2026"
                  className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Cities to Visit</label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input
                      type="text"
                      placeholder="Add a city..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium text-sm"
                      value={formData.newCity}
                      onChange={(e) => setFormData({ ...formData, newCity: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCity}
                    className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.cities.map((city, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-tight">
                      {city}
                      <button onClick={() => removeCity(idx)} className="hover:text-emerald-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {formData.cities.length === 0 && (
                    <p className="text-[10px] text-stone-400 italic font-bold uppercase tracking-widest">No cities added yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Currency</label>
                  <select
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                    value={formData.baseCurrency}
                    onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>{curr.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Total Budget</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                    value={formData.totalTripCost}
                    onChange={(e) => setFormData({ ...formData, totalTripCost: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Journey Status</label>
                <select
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "visited" })}
                >
                  <option value="planned">Planned (Wish to Go)</option>
                  <option value="visited">Completed Adventure</option>
                </select>
              </div>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="bg-stone-100/50 p-8 rounded-[2rem] border border-stone-200 space-y-6">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-500">Budget Breakdown</h3>
              <div className="group relative">
                <Info className="h-3.5 w-3.5 text-stone-300" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-stone-900 text-stone-50 text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Define how much you plan to spend per category.
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.keys(formData.categoryBudgets).map((cat) => (
                <div key={cat}>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">{cat}</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 text-xs font-bold"
                    value={(formData.categoryBudgets as any)[cat]}
                    onChange={(e) => handleBudgetChange(cat, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Journey Notes</label>
            <textarea
              placeholder="What are you most excited about? Any specific places to visit?"
              rows={4}
              className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium text-sm resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-[0.98] disabled:bg-stone-300"
            >
              {loading ? "Preparing Journey..." : "Begin Adventure"}
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

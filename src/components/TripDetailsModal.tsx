"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Globe, Trash2, Save, Plus, MapPin, Loader2 } from "lucide-react";
import { getTrip, updateTrip, deleteTrip, Trip } from "@/lib/db";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CURRENCIES } from "@/lib/currencies";

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export default function TripDetailsModal({ isOpen, onClose, tripId }: TripDetailsModalProps) {
  const router = useRouter();
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    destination: "",
    cities: [] as string[],
    newCity: "",
    startDate: "",
    endDate: "",
    baseCurrency: "USD",
    status: "planned",
    totalTripCost: "",
    notes: "",
    categoryBudgets: {
      Food: "",
      Transport: "",
      Accommodation: "",
      Activities: "",
      Other: ""
    }
  });

  useEffect(() => {
    if (!isOpen || !tripId) return;
    
    setLoadingTrip(true);
    const fetchTrip = async () => {
      try {
        const tripData = await getTrip(tripId);
        if (tripData) {
          setTrip(tripData);
          setFormData({
            name: tripData.name || "",
            destination: tripData.destination,
            cities: tripData.cities || [],
            newCity: "",
            startDate: tripData.startDate ? format(tripData.startDate, "yyyy-MM-dd") : "",
            endDate: tripData.endDate ? format(tripData.endDate, "yyyy-MM-dd") : "",
            baseCurrency: tripData.baseCurrency,
            status: tripData.status || "planned",
            totalTripCost: tripData.totalTripCost?.toString() || "",
            notes: tripData.notes || "",
            categoryBudgets: {
              Food: tripData.categoryBudgets?.Food?.toString() || "",
              Transport: tripData.categoryBudgets?.Transport?.toString() || "",
              Accommodation: tripData.categoryBudgets?.Accommodation?.toString() || "",
              Activities: tripData.categoryBudgets?.Activities?.toString() || "",
              Other: tripData.categoryBudgets?.Other?.toString() || ""
            }
          });
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [tripId, isOpen]);

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
    if (!trip || !trip.id) return;

    setLoading(true);
    try {
      const parseNumber = (val: string) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? undefined : parsed;
      };

      const budgets: any = {};
      Object.entries(formData.categoryBudgets).forEach(([cat, val]) => {
        const num = parseNumber(val);
        if (num !== undefined) budgets[cat] = num;
      });

      const updateData: any = {
        name: formData.name,
        destination: formData.destination,
        cities: formData.cities,
        baseCurrency: formData.baseCurrency,
        status: formData.status as "planned" | "visited",
        totalTripCost: parseNumber(formData.totalTripCost) || null,
        notes: formData.notes,
        categoryBudgets: budgets,
        startDate: formData.startDate ? new Date(formData.startDate + "T12:00:00") : null,
        endDate: formData.endDate ? new Date(formData.endDate + "T12:00:00") : null,
      };
      
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
    if (!trip || !trip.id) return;
    if (confirm("Are you sure you want to delete this entire itinerary? This cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteTrip(trip.id);
        onClose();
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
      <div className="w-full max-w-2xl bg-stone-50 rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
        {loadingTrip ? (
          <div className="flex-1 flex items-center justify-center py-20 text-emerald-600">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : !trip ? (
          <div className="flex-1 flex items-center justify-center py-20 text-stone-400 font-bold uppercase tracking-widest">
            Trip not found
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-8 border-b border-stone-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2.5 rounded-2xl">
                  <Save className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Edit Adventure</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{trip.destination}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Trip Name</label>
                    <input
                      required
                      type="text"
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
                      <button type="button" onClick={addCity} className="p-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.cities.map((city, idx) => (
                        <span key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase tracking-tight">
                          {city}
                          <button type="button" onClick={() => removeCity(idx)} className="hover:text-emerald-900">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
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
                        className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                        value={formData.totalTripCost}
                        onChange={(e) => setFormData({ ...formData, totalTripCost: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Status</label>
                    <select
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 text-sm font-bold"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "planned" | "visited" })}
                    >
                      <option value="planned">Planned</option>
                      <option value="visited">Visited</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-stone-100/50 p-8 rounded-[2rem] border border-stone-200 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-stone-500 flex items-center gap-2">
                  Budget Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {["Food", "Transport", "Accommodation", "Activities", "Other"].map((cat) => (
                    <div key={cat}>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5">{cat}</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 text-xs font-bold"
                        value={(formData.categoryBudgets as any)[cat]}
                        onChange={(e) => handleBudgetChange(cat, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Journey Notes</label>
                <textarea
                  rows={4}
                  className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none text-stone-700 font-medium text-sm resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  disabled={loading || isDeleting}
                  type="submit"
                  className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-[0.98] disabled:bg-stone-300"
                >
                  <Save className="h-4 w-4" />
                  {loading ? "Saving Changes..." : "Update Adventure"}
                </button>
                <button
                  type="button"
                  disabled={loading || isDeleting}
                  onClick={handleDelete}
                  className="w-full bg-white text-orange-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border border-orange-100 hover:bg-orange-50 transition-all active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Journey"}
                </button>
              </div>
            </form>
          </>
        )}
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

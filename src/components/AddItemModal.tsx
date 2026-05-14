"use client";

import { useState } from "react";
import { X, Clock, MapPin } from "lucide-react";
import { addItineraryItem } from "@/lib/db";
import { format } from "date-fns";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripDays: Date[];
  onItemAdded: () => void;
}

export default function AddItemModal({ isOpen, onClose, tripId, tripDays, onItemAdded }: AddItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: tripDays.length > 0 ? format(tripDays[0], "yyyy-MM-dd") : "",
    time: "10:00",
    description: "",
    location: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addItineraryItem({
        tripId,
        date: new Date(formData.date),
        time: formData.time,
        description: formData.description,
        location: formData.location,
      });
      onItemAdded();
      onClose();
      setFormData({ ...formData, description: "", location: "" });
    } catch (error) {
      console.error("Error adding itinerary item:", error);
      alert("Failed to add activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
          <h2 className="text-xl font-bold text-stone-800">Add Activity</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Date</label>
              <select
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              >
                {tripDays.map((day) => (
                  <option key={day.toISOString()} value={format(day, "yyyy-MM-dd")}>
                    {format(day, "MMM d")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Time</label>
              <div className="relative">
                <input
                  type="time"
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Description</label>
            <input
              required
              type="text"
              placeholder="e.g. Visit local museum"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Location</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-300">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Where is it?"
                className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98] disabled:bg-stone-300"
          >
            {loading ? "Adding..." : "Add to Itinerary"}
          </button>
        </form>
      </div>
    </div>
  );
}

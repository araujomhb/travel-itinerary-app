"use client";

import { useState, useEffect } from "react";
import { X, Clock, MapPin } from "lucide-react";
import { addItineraryItem, updateItineraryItem, ItineraryItem } from "@/lib/db";
import { format } from "date-fns";

interface ItineraryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripDays: Date[];
  onItemSaved: () => void;
  itemToEdit?: ItineraryItem | null;
}

export default function ItineraryItemModal({ 
  isOpen, 
  onClose, 
  tripId, 
  tripDays, 
  onItemSaved,
  itemToEdit 
}: ItineraryItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: tripDays.length > 0 ? format(tripDays[0], "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    description: "",
    location: "",
  });

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        date: format(itemToEdit.date, "yyyy-MM-dd"),
        description: itemToEdit.description,
        location: itemToEdit.location || "",
      });
    } else {
      setFormData({
        date: tripDays.length > 0 ? format(tripDays[0], "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        description: "",
        location: "",
      });
    }
  }, [itemToEdit, tripDays, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submissionDate = new Date(formData.date + "T12:00:00"); // Use noon to avoid timezone shifts
      
      if (itemToEdit && itemToEdit.id) {
        await updateItineraryItem(tripId, itemToEdit.id, {
          date: submissionDate,
          description: formData.description,
          location: formData.location,
        });
      } else {
        await addItineraryItem({
          tripId,
          date: submissionDate,
          time: "", // Time is no longer required
          description: formData.description,
          location: formData.location,
        });
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        onItemSaved();
        onClose();
        setIsSuccess(false);
      }, 500);
    } catch (error) {
      console.error("Error saving itinerary item:", error);
      alert("Failed to save activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-stone-50 rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
          <h2 className="text-xl font-bold text-stone-800">{itemToEdit ? "Edit Activity" : "Add Activity"}</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Date</label>
            <input
              required
              type="date"
              className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-stone-700 font-medium"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
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
            disabled={loading || isSuccess}
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.98] disabled:bg-stone-300 ${
              isSuccess ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Saving..." : isSuccess ? "Saved Successfully!" : itemToEdit ? "Update Activity" : "Add to Itinerary"}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
    date: format(tripDays[0], "yyyy-MM-dd"),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add Activity</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              required
              type="text"
              placeholder="e.g. Visit Eiffel Tower"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Champ de Mars, Paris"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-md"
          >
            {loading ? "Adding..." : "Add to Itinerary"}
          </button>
        </form>
      </div>
    </div>
  );
}

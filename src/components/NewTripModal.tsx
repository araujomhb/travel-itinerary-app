"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createTrip } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

export default function NewTripModal({ isOpen, onClose, onTripCreated }: NewTripModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    baseCurrency: "USD",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await createTrip({
        userId: user.uid,
        destination: formData.destination,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        baseCurrency: formData.baseCurrency,
      });
      
      // We await the refresh to ensure the dashboard has the new data
      // before we close the modal and reveal it.
      await onTripCreated();
      onClose();
      setFormData({ destination: "", startDate: "", endDate: "", baseCurrency: "USD" });
    } catch (error) {
      console.error("Error creating trip:", error);
      alert("Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Plan New Trip</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Destination (City or Country)
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Paris, France"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Currency
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={formData.baseCurrency}
              onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-300"
          >
            {loading ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}

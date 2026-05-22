"use client";

import { X, Heart, Globe, ChevronRight, Trash2 } from "lucide-react";
import { Trip, deleteTrip } from "@/lib/db";
import CountryFlag from "./CountryFlag";

interface WishListModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  onViewTrip: (tripId: string) => void;
}

export default function WishListModal({ isOpen, onClose, trips, onViewTrip }: WishListModalProps) {
  if (!isOpen) return null;

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirm("Remove this from your wish list?")) {
      try {
        await deleteTrip(tripId);
      } catch (error) {
        console.error("Error deleting trip:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-8 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-xl">
              <Heart className="h-6 w-6 text-yellow-600 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">Wish List</h2>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Countries you plan to explore</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all active:scale-95">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {trips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => {
                    onViewTrip(trip.id || "");
                    onClose();
                  }}
                  className="group flex items-center justify-between p-5 bg-stone-50 border border-stone-100 rounded-3xl hover:border-yellow-500 hover:bg-white transition-all text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <CountryFlag countryName={trip.destination} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-stone-900 truncate">
                        {trip.destination}
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tight">
                        {trip.city || "Adventure Planned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 text-stone-300 group-hover:text-yellow-600 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, trip.id || "")}
                      className="p-2 text-stone-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                      title="Remove from list"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="bg-stone-50 p-8 rounded-full mb-6">
                <Globe className="h-12 w-12 text-stone-200" />
              </div>
              <p className="text-stone-400 font-bold uppercase tracking-widest text-xs italic">Your wish list is empty.</p>
              <p className="text-stone-300 text-[10px] uppercase font-black mt-2">Start exploring the map to find your next journey!</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}

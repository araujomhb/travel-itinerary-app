"use client";

import { useState } from "react";
import { X, CheckCircle, Heart, Info, ArrowRight, Plus } from "lucide-react";

interface MarkCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onSave: (status: "planned" | "visited", addDetails: boolean, details?: { name?: string; startDate?: string; endDate?: string; notes?: string }) => void;
}

export default function MarkCountryModal({ isOpen, onClose, destination, onSave }: MarkCountryModalProps) {
  const [status, setStatus] = useState<"planned" | "visited">("visited");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [name, setName] = useState(`${destination} Trip`);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleQuickSave = async () => {
    try {
      setIsSuccess(true);
      await onSave(status, false, { name, startDate, endDate, notes });
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 1000);
    } catch (e) {
      console.error("Save error:", e);
      setIsSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-lg font-black text-stone-900">Mark Destination</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="text-center space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Selected Country</p>
            <h3 className="text-2xl font-black text-stone-900">{destination}</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStatus("visited")}
              className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all ${
                status === "visited" 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-100" 
                  : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
              }`}
            >
              <CheckCircle className={`h-8 w-8 ${status === "visited" ? "text-emerald-500" : "text-stone-300"}`} />
              <span className="text-xs font-black uppercase tracking-widest">Visited</span>
            </button>

            <button
              onClick={() => setStatus("planned")}
              className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all ${
                status === "planned" 
                  ? "bg-yellow-50 border-yellow-500 text-yellow-700 shadow-lg shadow-yellow-100" 
                  : "bg-stone-50 border-stone-100 text-stone-400 hover:border-stone-200"
              }`}
            >
              <Heart className={`h-8 w-8 ${status === "planned" ? "text-yellow-500" : "text-stone-300"}`} />
              <span className="text-xs font-black uppercase tracking-widest">Wish to Go</span>
            </button>
          </div>

          {/* Quick Details Toggle */}
          <div className="pt-2">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <Plus className={`h-3 w-3 transition-transform ${showDetails ? 'rotate-45' : ''}`} />
              {showDetails ? 'Hide Details' : 'Add Trip Details'}
            </button>

            {showDetails && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Trip Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Summer Vacation 2026"
                    className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">End Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Notes</label>
                  <textarea 
                    placeholder="Briefly describe your experience..."
                    rows={2}
                    className="w-full p-3 bg-stone-50 border border-stone-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <button
              disabled={isSuccess}
              onClick={handleQuickSave}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                isSuccess ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-stone-200"
              }`}
            >
              {isSuccess ? "Saved Successfully!" : "Save Destination"}
            </button>
            <button
              disabled={isSuccess}
              onClick={() => onSave(status, true, { name, startDate, endDate, notes })}
              className="w-full bg-white text-stone-900 border-2 border-stone-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Add Full Itinerary
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-stone-50 p-6 border-t border-stone-100">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-stone-400 shrink-0" />
            <p className="text-[10px] font-bold text-stone-400 leading-relaxed uppercase tracking-tight">
              {status === "visited" 
                ? "Marking as visited will add this country to your world map as a completed adventure." 
                : "Marking as wish to go will pin this country on your map for future exploration."}
            </p>
          </div>
        </div>
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

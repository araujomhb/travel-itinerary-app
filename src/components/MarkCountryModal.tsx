"use client";

import { useState } from "react";
import { X, CheckCircle, Heart, Info, ArrowRight } from "lucide-react";

interface MarkCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  onSave: (status: "planned" | "visited", addDetails: boolean) => void;
}

export default function MarkCountryModal({ isOpen, onClose, destination, onSave }: MarkCountryModalProps) {
  const [status, setStatus] = useState<"planned" | "visited">("visited");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleQuickSave = async () => {
    try {
      await onSave(status, false);
      setIsSuccess(true);
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

        <div className="p-8 space-y-8">
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

          <div className="space-y-3">
            <button
              disabled={isSuccess}
              onClick={handleQuickSave}
              className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] ${
                isSuccess ? "bg-emerald-500 text-white shadow-emerald-100" : "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-stone-200"
              }`}
            >
              {isSuccess ? "Saved Successfully!" : "Save Now"}
            </button>
            <button
              disabled={isSuccess}
              onClick={() => onSave(status, true)}
              className="w-full bg-white text-stone-900 border-2 border-stone-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              Add Itinerary Details
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
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { Clock, MoreHorizontal, MapPin, Compass } from "lucide-react";
import { ItineraryItem } from "@/lib/db";

interface ItineraryViewProps {
  days: Date[];
  items: ItineraryItem[];
  onAddClick: () => void;
}

export default function ItineraryView({ days, items, onAddClick }: ItineraryViewProps) {
  return (
    <div className="space-y-16">
      {days.map((day, idx) => {
        const dayItems = items.filter(item => 
          format(item.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
        );

        return (
          <div key={idx} className="relative">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-stone-900 text-stone-50 h-12 w-12 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-xl shadow-stone-200">
                {idx + 1}
              </div>
              <h3 className="text-2xl font-black text-stone-900 tracking-tight">
                {format(day, "EEEE, MMM d")}
              </h3>
            </div>

            <div className="ml-6 border-l-2 border-dashed border-stone-200 pl-12 space-y-8">
              {dayItems.length > 0 ? (
                dayItems.map((item) => (
                  <div key={item.id} className="bg-white p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-stone-100 relative group transition-all hover:shadow-lg">
                    <div className="absolute -left-[58px] top-9 h-4 w-4 rounded-full bg-emerald-500 border-[3px] border-stone-50 shadow-sm transition-transform group-hover:scale-125"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{item.time}</span>
                      </div>
                      <MoreHorizontal className="h-6 w-6 text-stone-300" />
                    </div>
                    <h4 className="text-xl font-black text-stone-900 leading-snug">{item.description}</h4>
                    {item.location && (
                      <div className="flex items-center gap-2 text-stone-400 font-bold text-sm mt-3">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                  <Compass className="h-10 w-10 mb-4 text-stone-300" />
                  <p className="text-stone-400 font-bold">Nothing planned for this day.</p>
                  <button onClick={onAddClick} className="mt-4 text-emerald-600 font-black text-sm hover:underline tracking-widest uppercase">
                    + Add activity
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  X,
  Calendar, 
  CreditCard, 
  Plus, 
  Loader2,
  Settings
} from "lucide-react";
import { getTrip, subscribeToTrip, Trip, ItineraryItem, Expense } from "@/lib/db";
import { format, eachDayOfInterval } from "date-fns";
import AddItemModal from "@/components/AddItemModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import CountryFlag from "@/components/CountryFlag";
import EditTripModal from "@/components/EditTripModal";
import ItineraryView from "@/components/ItineraryView";
import ExpensesView from "@/components/ExpensesView";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Tab = "itinerary" | "expenses";

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export default function TripDetailsModal({ isOpen, onClose, tripId }: TripDetailsModalProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !tripId) return;
    
    setLoadingTrip(true);
    const unsubscribe = subscribeToTrip(tripId, (tripData) => {
      setTrip(tripData);
      setLoadingTrip(false);
    });

    return () => unsubscribe();
  }, [tripId, isOpen]);

  useEffect(() => {
    if (!isOpen || !tripId) return;

    const itineraryQuery = query(
      collection(db, "trips", tripId, "itinerary"),
      orderBy("date", "asc"),
      orderBy("time", "asc")
    );

    const expensesQuery = query(
      collection(db, "trips", tripId, "expenses"),
      orderBy("date", "desc")
    );

    const unsubItinerary = onSnapshot(itineraryQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as ItineraryItem[];
      setItinerary(data);
      setLoadingContent(false);
    }, (error) => {
      console.error("Itinerary sync error:", error);
      setLoadingContent(false);
    });

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Expense[];
      setExpenses(data);
      setLoadingContent(false);
    }, (error) => {
      console.error("Expenses sync error:", error);
      setLoadingContent(false);
    });

    return () => {
      unsubItinerary();
      unsubExpenses();
    };
  }, [tripId, isOpen]);

  if (!isOpen) return null;

  const tripDays = (trip && trip.startDate && trip.endDate) ? eachDayOfInterval({
    start: trip.startDate,
    end: trip.endDate
  }) : [];

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 text-stone-800">
      <div className="w-full max-w-5xl h-[90vh] bg-stone-50 rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col relative">
        
        {loadingTrip ? (
          <div className="flex-1 flex items-center justify-center text-emerald-600">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : !trip ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 font-bold uppercase tracking-widest">
            Trip not found
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <CountryFlag countryName={trip.destination} size="lg" />
                  <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                      {trip.city ? `${trip.city}, ` : ""}{trip.destination}
                    </h1>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                      {trip.startDate && trip.endDate ? (
                        `${format(trip.startDate, "MMM d")} — ${format(trip.endDate, "MMM d, yyyy")}`
                      ) : (
                        "Quickly Marked"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-stone-900 px-4 py-2 rounded-xl shadow-lg shadow-stone-200">
                    <span className="text-xs font-black text-stone-50 uppercase tracking-widest">{trip.baseCurrency}</span>
                  </div>
                  <button
                    onClick={() => setIsEditTripOpen(true)}
                    className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all active:scale-95"
                    title="Trip Settings"
                  >
                    <Settings className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={onClose}
                    className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all active:scale-95"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-10 mt-6">
                <button
                  onClick={() => setActiveTab("itinerary")}
                  className={`flex items-center gap-2.5 py-4 border-b-4 transition-all ${
                    activeTab === "itinerary" 
                      ? "border-emerald-600 text-stone-900 font-black" 
                      : "border-transparent text-stone-400 hover:text-stone-600 font-bold"
                  }`}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Itinerary</span>
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`flex items-center gap-2.5 py-4 border-b-4 transition-all ${
                    activeTab === "expenses" 
                      ? "border-emerald-600 text-stone-900 font-black" 
                      : "border-transparent text-stone-400 hover:text-stone-600 font-bold"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Expenses</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-12 custom-scrollbar">
              {loadingContent && itinerary.length === 0 && expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Loader2 className="h-10 w-10 animate-spin text-stone-300 mb-4" />
                  <p className="text-stone-400 font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Adventure Data</p>
                </div>
              ) : (
                <>
                  {activeTab === "itinerary" ? (
                    <ItineraryView 
                      days={tripDays} 
                      items={itinerary} 
                      onAddClick={() => setIsAddItemOpen(true)}
                    />
                  ) : (
                    <ExpensesView 
                      expenses={expenses} 
                      baseCurrency={trip.baseCurrency} 
                      total={totalExpenses}
                      onAddClick={() => setIsAddExpenseOpen(true)}
                      averageDailyExpense={trip.averageDailyExpense}
                      totalTripCost={trip.totalTripCost}
                      startDate={trip.startDate}
                      endDate={trip.endDate}
                    />
                  )}
                </>
              )}
            </div>

            {/* Floating Action Button - Internal to Modal */}
            <button 
              onClick={() => activeTab === "itinerary" ? setIsAddItemOpen(true) : setIsAddExpenseOpen(true)}
              className="absolute bottom-10 right-10 h-16 w-16 bg-orange-500 text-white rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 z-[110]"
            >
              <Plus className="h-8 w-8 stroke-[3]" />
            </button>

            {isAddItemOpen && (
              <AddItemModal 
                isOpen={isAddItemOpen} 
                onClose={() => setIsAddItemOpen(false)} 
                tripId={tripId} 
                tripDays={tripDays}
                onItemAdded={() => {
                  setIsAddItemOpen(false);
                  onClose();
                }} 
              />
            )}

            {isAddExpenseOpen && (
              <AddExpenseModal 
                isOpen={isAddExpenseOpen} 
                onClose={() => setIsAddExpenseOpen(false)} 
                tripId={tripId} 
                baseCurrency={trip.baseCurrency}
                onExpenseAdded={() => {
                  setIsAddExpenseOpen(false);
                  onClose();
                }} 
              />
            )}

            {isEditTripOpen && (
              <EditTripModal
                isOpen={isEditTripOpen}
                onClose={() => setIsEditTripOpen(false)}
                trip={trip}
              />
            )}
          </>
        )}
      </div>

      <style jsx global>{`
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

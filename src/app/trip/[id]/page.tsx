"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { 
  ChevronLeft, 
  Calendar, 
  CreditCard, 
  Plus, 
  MapPin, 
  Clock, 
  DollarSign,
  TrendingUp,
  Utensils,
  Car,
  Home as HomeIcon,
  Activity,
  MoreHorizontal,
  Loader2,
  Compass
} from "lucide-react";
import { getTrip, Trip, ItineraryItem, Expense } from "@/lib/db";
import { format, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import AddItemModal from "@/components/AddItemModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFlagEmoji } from "@/lib/flags";

type Tab = "itinerary" | "expenses";

export default function TripDetails() {
  const params = useParams();
  const tripId = params.id as string;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("itinerary");
  
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    
    const fetchTrip = async () => {
      try {
        const tripData = await getTrip(tripId);
        if (!tripData) {
          router.push("/");
          return;
        }
        setTrip(tripData);
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoadingTrip(false);
      }
    };

    fetchTrip();
  }, [tripId, router]);

  useEffect(() => {
    if (!tripId) return;

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
    });

    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Expense[];
      setExpenses(data);
      setLoadingContent(false);
    });

    return () => {
      unsubItinerary();
      unsubExpenses();
    };
  }, [tripId]);

  if (loadingTrip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-emerald-600">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!trip) return null;

  const tripDays = eachDayOfInterval({
    start: trip.startDate,
    end: trip.endDate
  });

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);
  const countryFlag = getFlagEmoji(trip.destination);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-stone-50 text-stone-800 pb-20 font-sans">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl transition-all active:scale-95">
                  <ChevronLeft className="h-6 w-6" />
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{countryFlag}</span>
                  <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                      {trip.destination}
                    </h1>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                      {format(trip.startDate, "MMM d")} — {format(trip.endDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-stone-900 px-4 py-2 rounded-xl shadow-lg shadow-stone-200">
                <span className="text-xs font-black text-stone-50 uppercase tracking-widest">{trip.baseCurrency}</span>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-10 mt-2">
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
        </div>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
              ) : (activeTab === "expenses" && (
                <ExpensesView 
                  expenses={expenses} 
                  baseCurrency={trip.baseCurrency} 
                  total={totalExpenses}
                  onAddClick={() => setIsAddExpenseOpen(true)}
                />
              ))}
            </>
          )}
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => activeTab === "itinerary" ? setIsAddItemOpen(true) : setIsAddExpenseOpen(true)}
          className="fixed bottom-10 right-10 h-16 w-16 bg-orange-500 text-white rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] flex items-center justify-center hover:bg-orange-600 transition-all active:scale-90 z-20"
        >
          <Plus className="h-8 w-8 stroke-[3]" />
        </button>

        <AddItemModal 
          isOpen={isAddItemOpen} 
          onClose={() => setIsAddItemOpen(false)} 
          tripId={tripId} 
          tripDays={tripDays}
          onItemAdded={() => {}} 
        />

        <AddExpenseModal 
          isOpen={isAddExpenseOpen} 
          onClose={() => setIsAddExpenseOpen(false)} 
          tripId={tripId} 
          baseCurrency={trip.baseCurrency}
          onExpenseAdded={() => {}} 
        />
      </main>
    </AuthGuard>
  );
}

function ItineraryView({ days, items, onAddClick }: { days: Date[], items: ItineraryItem[], onAddClick: () => void }) {
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

function ExpensesView({ expenses, baseCurrency, total, onAddClick }: { expenses: Expense[], baseCurrency: string, total: number, onAddClick: () => void }) {
  const categoryIcons = {
    Food: Utensils,
    Transport: Car,
    Accommodation: HomeIcon,
    Activities: Activity,
    Other: MoreHorizontal,
  };

  return (
    <div className="space-y-12">
      {/* Summary Card */}
      <div className="bg-stone-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <p className="text-stone-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Total Expenses</p>
            <h2 className="text-5xl font-black tracking-tighter">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(total)}
            </h2>
          </div>
          <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl">
            <TrendingUp className="h-10 w-10 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-stone-100 overflow-hidden">
        <div className="px-8 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="text-lg font-black text-stone-900 tracking-tight uppercase tracking-widest">Transaction History</h3>
          <button onClick={onAddClick} className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">Add New</button>
        </div>
        
        {expenses.length > 0 ? (
          <div className="divide-y divide-stone-50">
            {expenses.map((expense) => {
              const Icon = categoryIcons[expense.category] || MoreHorizontal;
              return (
                <div key={expense.id} className="p-8 flex items-center justify-between hover:bg-stone-50 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="bg-stone-100 p-4 rounded-2xl text-stone-600 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-600">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-black text-stone-900 text-lg">{expense.category}</h4>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-1">
                        {format(expense.date, "MMM d")} • {expense.notes || 'No notes'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-stone-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(expense.convertedAmount)}
                    </p>
                    {expense.currency !== baseCurrency && (
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mt-1">
                        {expense.amount} {expense.currency}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="bg-stone-50 p-8 rounded-full mb-6">
              <DollarSign className="h-12 w-12 text-stone-200" />
            </div>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs italic">No transactions tracked yet.</p>
            <button onClick={onAddClick} className="mt-6 bg-stone-900 text-stone-50 px-8 py-3 rounded-2xl font-black text-sm hover:bg-stone-800 transition-all shadow-lg active:scale-95">
              Log First Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  Compass,
  Settings
} from "lucide-react";
import { getTrip, Trip, ItineraryItem, Expense } from "@/lib/db";
import { format, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import AddItemModal from "@/components/AddItemModal";
import AddExpenseModal from "@/components/AddExpenseModal";
import CountryFlag from "@/components/CountryFlag";
import EditTripModal from "@/components/EditTripModal";
import ItineraryView from "@/components/ItineraryView";
import ExpensesView from "@/components/ExpensesView";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

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
                <div className="flex items-center gap-4">
                  <CountryFlag countryName={trip.destination} size="lg" />
                  <div>
                    <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                      {trip.city ? `${trip.city}, ` : ""}{trip.destination}
                    </h1>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                      {format(trip.startDate, "MMM d")} — {format(trip.endDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
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

        <EditTripModal
          isOpen={isEditTripOpen}
          onClose={() => setIsEditTripOpen(false)}
          trip={trip}
        />
      </main>
    </AuthGuard>
  );
}


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
  Loader2
} from "lucide-react";
import { getTrip, Trip, getItinerary, ItineraryItem, getExpenses, Expense } from "@/lib/db";
import { format, eachDayOfInterval } from "date-fns";
import Link from "next/link";
import AddItemModal from "@/components/AddItemModal";
import AddExpenseModal from "@/components/AddExpenseModal";

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

  // Fetch Trip Meta first (Fast)
  const fetchTripMeta = useCallback(async () => {
    if (!tripId) return;
    try {
      const tripData = await getTrip(tripId);
      if (!tripData) {
        router.push("/");
        return;
      }
      setTrip(tripData);
      setLoadingTrip(false);
      
      // Now fetch details in the background (Slower)
      const [itineraryData, expensesData] = await Promise.all([
        getItinerary(tripId),
        getExpenses(tripId)
      ]);
      
      setItinerary(itineraryData);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error fetching trip details:", error);
    } finally {
      setLoadingContent(false);
    }
  }, [tripId, router]);

  useEffect(() => {
    fetchTripMeta();
  }, [fetchTripMeta]);

  if (loadingTrip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
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
      <main className="min-h-screen bg-gray-50 pb-20">
        {/* Header - Shows instantly once meta is loaded */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">
                    {trip.destination}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {format(trip.startDate, "MMM d")} - {format(trip.endDate, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-xs font-bold text-blue-600 uppercase">{trip.baseCurrency}</span>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-8 mt-2">
              <button
                onClick={() => setActiveTab("itinerary")}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all ${
                  activeTab === "itinerary" 
                    ? "border-blue-600 text-blue-600 font-semibold" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Calendar className="h-5 w-5" />
                <span>Itinerary</span>
              </button>
              <button
                onClick={() => setActiveTab("expenses")}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all ${
                  activeTab === "expenses" 
                    ? "border-blue-600 text-blue-600 font-semibold" 
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Expenses</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loadingContent ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-200 mb-4" />
              <p className="text-gray-400 text-sm animate-pulse">Loading details...</p>
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
                />
              )}
            </>
          )}
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => activeTab === "itinerary" ? setIsAddItemOpen(true) : setIsAddExpenseOpen(true)}
          className="fixed bottom-8 right-8 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 z-20"
        >
          <Plus className="h-8 w-8" />
        </button>

        <AddItemModal 
          isOpen={isAddItemOpen} 
          onClose={() => setIsAddItemOpen(false)} 
          tripId={tripId} 
          tripDays={tripDays}
          onItemAdded={fetchTripMeta}
        />

        <AddExpenseModal 
          isOpen={isAddExpenseOpen} 
          onClose={() => setIsAddExpenseOpen(false)} 
          tripId={tripId} 
          baseCurrency={trip.baseCurrency}
          onExpenseAdded={fetchTripMeta}
        />
      </main>
    </AuthGuard>
  );
}

function ItineraryView({ days, items, onAddClick }: { days: Date[], items: ItineraryItem[], onAddClick: () => void }) {
  return (
    <div className="space-y-12">
      {days.map((day, idx) => {
        const dayItems = items.filter(item => 
          format(item.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
        );

        return (
          <div key={idx} className="relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-600 text-white h-10 w-10 rounded-xl flex items-center justify-center font-bold shadow-sm">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {format(day, "EEEE, MMM d")}
                </h3>
              </div>
            </div>

            <div className="ml-5 border-l-2 border-gray-100 pl-9 space-y-6">
              {dayItems.length > 0 ? (
                dayItems.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
                    <div className="absolute -left-[45px] top-6 h-3 w-3 rounded-full bg-blue-600 border-2 border-white"></div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{item.time}</span>
                      </div>
                      <MoreHorizontal className="h-5 w-5 text-gray-400" />
                    </div>
                    <h4 className="text-gray-900 font-bold text-lg">{item.description}</h4>
                    {item.location && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-2">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-dashed border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-gray-400">
                  <Calendar className="h-8 w-8 mb-2 opacity-50" />
                  <p>Nothing planned for this day yet.</p>
                  <button onClick={onAddClick} className="mt-2 text-blue-600 font-semibold text-sm hover:underline">
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
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Expenses</p>
            <h2 className="text-4xl font-black mt-1">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(total)}
            </h2>
          </div>
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
          <button onClick={onAddClick} className="text-blue-600 font-bold text-sm">Add New</button>
        </div>
        
        {expenses.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {expenses.map((expense) => {
              const Icon = categoryIcons[expense.category] || MoreHorizontal;
              return (
                <div key={expense.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-3 rounded-2xl text-gray-600">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{expense.category}</h4>
                      <p className="text-xs text-gray-500">{format(expense.date, "MMM d, yyyy")} • {expense.notes || 'No notes'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(expense.convertedAmount)}
                    </p>
                    {expense.currency !== baseCurrency && (
                      <p className="text-xs text-gray-400">
                        {expense.amount} {expense.currency}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <DollarSign className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-400">No expenses tracked yet.</p>
            <button onClick={onAddClick} className="mt-4 bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all">
              Add Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

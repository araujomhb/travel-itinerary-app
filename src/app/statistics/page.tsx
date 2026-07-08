"use client";

import { useAuth } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { useState, useEffect } from "react";
import { ArrowLeft, Globe, Loader2 } from "lucide-react";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trip } from "@/lib/db";
import TravelStats from "@/components/TravelStats";
import Link from "next/link";

export default function StatisticsPage() {
  const { user } = useAuth();
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoadingTrips(true);
    setSyncError(null);

    const q = query(
      collection(db, "trips"), 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          startDate: d.startDate ? (d.startDate as Timestamp).toDate() : undefined,
          endDate: d.endDate ? (d.endDate as Timestamp).toDate() : undefined,
          createdAt: (d.createdAt as Timestamp).toDate(),
          status: d.status || "planned",
        };
      }) as Trip[];
      
      const sortedData = [...data].sort((a, b) => {
        const timeA = a.startDate?.getTime() || a.createdAt.getTime();
        const timeB = b.startDate?.getTime() || b.createdAt.getTime();
        return timeB - timeA;
      });
      setAllTrips(sortedData);
      setLoadingTrips(false);
    }, (error) => {
      console.error("Error listening to trips:", error);
      setSyncError("Sync failed");
      setLoadingTrips(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-stone-50 text-stone-850 flex flex-col relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              <div className="flex items-center gap-3">
                <Link 
                  href="/"
                  className="p-3 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  title="Back to Map"
                >
                  <ArrowLeft className="h-6 w-6" />
                  <span className="text-sm font-bold hidden sm:inline">Back to Map</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-stone-900 tracking-tight italic">Explorer</span>
                <div className="bg-stone-950 p-2 rounded-xl shadow-lg">
                  <Globe className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {loadingTrips ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">Loading travel stats...</p>
            </div>
          ) : syncError ? (
            <div className="flex flex-col items-center justify-center py-40 text-center gap-2">
              <p className="text-orange-650 font-black uppercase tracking-widest text-sm">Failed to Sync Data</p>
              <p className="text-xs text-stone-400">Please verify your internet connection or reload the page.</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-stone-900 tracking-tight">Travel Statistics</h1>
                <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mt-1">Detailed continental breakdown & history</p>
              </div>

              <div className="bg-white border border-stone-200 rounded-[2.5rem] p-4 sm:p-8 md:p-12 shadow-xl">
                <TravelStats trips={allTrips} />
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Plus, MapPin, Calendar, Trash2, ChevronRight } from "lucide-react";
import NewTripModal from "@/components/NewTripModal";
import { getTrips, Trip, deleteTrip } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export default function Home() {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTrips(user.uid);
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this trip?")) {
      try {
        await deleteTrip(tripId);
        fetchTrips();
      } catch (error) {
        console.error("Error deleting trip:", error);
      }
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <span className="text-xl font-bold text-blue-600">Travel Planner</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.displayName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors bg-gray-50 rounded-full"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Dashboard Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your upcoming and past travels</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span>New Trip</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trip/${trip.id}`}
                  className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 block relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, trip.id!)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
                    {trip.destination}
                  </h3>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {format(trip.startDate, "MMM d")} - {format(trip.endDate, "MMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      {trip.baseCurrency}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="bg-blue-50 p-6 rounded-full mb-6">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No trips yet</h3>
              <p className="text-gray-500 max-w-xs mt-3 text-lg leading-relaxed">
                Start by creating your first travel itinerary and tracking your expenses.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                Create First Trip
              </button>
            </div>
          )}
        </div>

        <NewTripModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onTripCreated={fetchTrips}
        />
      </main>
    </AuthGuard>
  );
}

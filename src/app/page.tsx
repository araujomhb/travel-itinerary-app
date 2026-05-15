"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Search, Globe, Info, X, Compass, Sparkles, Navigation, Calendar, ChevronRight, MapPin, Plus } from "lucide-react";

import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import NewTripModal from "@/components/NewTripModal";
import TripDetailsModal from "@/components/TripDetailsModal";
import CountryFlag from "@/components/CountryFlag";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trip, createTrip } from "@/lib/db";
import { format } from "date-fns";
import { countryToISO } from "@/lib/flags";
import { COUNTRY_CENTROIDS } from "@/lib/centroids";

// World Map Data Source
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

export default function Home() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewTripId, setViewTripId] = useState<string | null>(null);
  
  // Map State
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1
  });
  
  // Search Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Update suggestions when searchTerm changes
  useEffect(() => {
    if (searchTerm.length > 1) {
      const matches = Object.keys(countryToISO)
        .filter(country => country.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const handleSelectSuggestion = (country: string) => {
    setSelectedCountry(country);
    setSearchTerm("");
    setSuggestions([]);
    
    // Zoom to country
    const centroid = COUNTRY_CENTROIDS[country];
    if (centroid) {
      setPosition({ coordinates: [centroid.lng, centroid.lat], zoom: 3 });
    }
  };
  
  // New: State for all user trips
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // Listen for all trips for the current user
  useEffect(() => {
    if (!user) return;

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
      setLoadingTrips(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Derive countries with itineraries for map highlighting
  const visitedCountries = new Set(allTrips.filter(t => t.status === "visited").map(trip => trip.destination));
  const plannedCountries = new Set(allTrips.filter(t => t.status === "planned").map(trip => trip.destination));

  const handleCountryClick = (geo: any) => {
    const name = geo.properties.name;
    const isDeselect = name === selectedCountry;
    setSelectedCountry(isDeselect ? null : name);
    
    if (!isDeselect) {
      const centroid = COUNTRY_CENTROIDS[name];
      if (centroid) {
        setPosition({ coordinates: [centroid.lng, centroid.lat], zoom: 3 });
      }
    } else {
      setPosition({ coordinates: [0, 20], zoom: 1 });
    }
  };

  const handleQuickMark = async (status: "visited" | "planned") => {
    if (!user || !selectedCountry) return;
    
    try {
      await createTrip({
        userId: user.uid,
        destination: selectedCountry,
        baseCurrency: "USD",
        status: status,
      });
      setSelectedCountry(null);
      setPosition({ coordinates: [0, 20], zoom: 1 });
    } catch (error) {
      console.error("Error quick marking country:", error);
      alert("Failed to mark country.");
    }
  };

  // Filter trips for the selected country
  const countryTrips = allTrips.filter(trip => trip.destination === selectedCountry);
  const countryStatus = countryTrips.some(t => t.status === "visited") ? "visited" : (countryTrips.length > 0 ? "planned" : null);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-stone-50 text-stone-800 flex flex-col relative overflow-hidden font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-stone-900 p-2.5 rounded-2xl shadow-lg shadow-stone-200">
                  <Compass className="h-6 w-6 text-stone-50" />
                </div>
                <span className="text-2xl font-black text-stone-900 tracking-tight hidden sm:block italic">Explorer</span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8 relative">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400 group-focus-within:text-emerald-600 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search your next destination..."
                    className="block w-full pl-11 pr-11 py-3.5 bg-stone-100 border border-stone-200 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-inner placeholder:text-stone-300 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => {
                        setSearchTerm("");
                        setSuggestions([]);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-300 hover:text-stone-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-200 shadow-xl z-[60] overflow-hidden">
                    {suggestions.map((country) => (
                      <button
                        key={country}
                        onClick={() => handleSelectSuggestion(country)}
                        className="w-full px-6 py-3 text-left text-sm font-bold text-stone-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex items-center gap-3"
                      >
                        <CountryFlag countryName={country} size="sm" />
                        {country}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-stone-900">{user?.displayName || "Explorer"}</p>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{user?.isAnonymous ? "Guest Mode" : "Explorer"}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-3 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all active:scale-95"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Map Container */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6">
          
          {/* Action Card / Selected Country */}
          <div className="absolute top-8 left-8 z-10 w-full max-w-[340px]">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Destination</h2>
                {countryStatus && (
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    countryStatus === "visited" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {countryStatus === "visited" ? "Visited" : "Planned"}
                  </span>
                )}
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`${selectedCountry ? "animate-bounce" : "opacity-20"}`}>
                    <CountryFlag countryName={selectedCountry || ""} size="lg" />
                  </div>
                  <p className="text-2xl font-black text-stone-900 truncate">
                    {selectedCountry || "World Map"}
                  </p>
                </div>
                
                {selectedCountry ? (
                  <div className="space-y-4">
                    {/* List Existing Itineraries */}
                    {countryTrips.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">Your Itineraries</p>
                        <div className="max-h-[200px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                          {countryTrips.map(trip => (
                            <button 
                              key={trip.id} 
                              onClick={() => {
                                setViewTripId(trip.id || null);
                                setSelectedCountry(null);
                              }}
                              className="w-full flex items-center justify-between p-3 bg-stone-50 border border-stone-100 rounded-xl hover:border-emerald-500 hover:bg-white transition-all group text-left"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-900 truncate">
                                  {trip.city || "New Adventure"}
                                </p>
                                <p className="text-[10px] text-stone-400 font-bold">
                                  {trip.startDate && trip.endDate ? (
                                    `${format(trip.startDate, "MMM d")} - ${format(trip.endDate, "MMM d, yyyy")}`
                                  ) : (
                                    "Quickly Marked"
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tight">{trip.baseCurrency} Trip</p>
                                  <span className={`w-1 h-1 rounded-full ${trip.status === "visited" ? "bg-emerald-400" : "bg-blue-400"}`}></span>
                                  <p className="text-[9px] text-stone-400 uppercase font-bold">{trip.status}</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-emerald-500 transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        onClick={() => handleQuickMark("visited")}
                        className="bg-emerald-50 text-emerald-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                      >
                        I've Been Here
                      </button>
                      <button 
                        onClick={() => handleQuickMark("planned")}
                        className="bg-blue-50 text-blue-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        Want to Go
                      </button>
                    </div>

                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-stone-900 text-stone-50 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4 fill-current stroke-[3]" />
                      Full Itinerary
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 font-medium italic">Click a country to start planning your adventure.</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-full max-h-[75vh] flex items-center justify-center">
            <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 160 }}>
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={(pos) => setPosition(pos)}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryName = geo.properties.name;
                      const isSelected = selectedCountry === countryName;
                      const isVisited = visitedCountries.has(countryName);
                      const isPlanned = plannedCountries.has(countryName);
                      const isMatch = searchTerm && countryName.toLowerCase().includes(searchTerm.toLowerCase());

                      let fillColor = "#ffffff";
                      let strokeColor = "#e7e5e4";
                      let strokeWidth = 0.8;

                      if (isMatch) {
                        fillColor = "#fef3c7";
                      } else if (isSelected) {
                        fillColor = "#f59e0b";
                      } else if (isVisited) {
                        fillColor = "#d1fae5";
                        strokeColor = "#10b981";
                        strokeWidth = 0.5;
                      } else if (isPlanned) {
                        fillColor = "#dbeafe";
                        strokeColor = "#3b82f6";
                        strokeWidth = 0.5;
                      }

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => setHoveredCountry(countryName)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() => handleCountryClick(geo)}
                          style={{
                            default: {
                              fill: fillColor,
                              stroke: strokeColor,
                              strokeWidth: strokeWidth,
                              outline: "none",
                              transition: "all 300ms",
                            },
                            hover: {
                              fill: "#059669",
                              stroke: "#065f46",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "#d97706",
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Floating Instructions & Legend */}
          <div className="absolute bottom-10 flex flex-col items-center gap-6">
            <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-stone-200 shadow-xl flex gap-6 items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Visited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Want to Visit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Search Match</span>
              </div>
            </div>

            <div className="bg-stone-900 text-stone-100 px-8 py-4 rounded-full flex items-center gap-3 text-sm font-bold shadow-2xl transition-all hover:scale-105">
              <Navigation className="h-4 w-4 text-emerald-400 fill-current" />
              <span>Select a country to explore or plan</span>
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Itinerary Modal */}
        {selectedCountry && isModalOpen && (
          <NewTripModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            destination={selectedCountry}
            onTripCreated={(tripId) => {
              setViewTripId(tripId);
              setIsModalOpen(false);
              setSelectedCountry(null);
            }}
          />
        )}

        {/* Trip Details Modal */}
        {viewTripId && (
          <TripDetailsModal 
            isOpen={!!viewTripId} 
            onClose={() => setViewTripId(null)} 
            tripId={viewTripId} 
          />
        )}

        <style jsx global>{`
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
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #d1d5db;
          }
        `}</style>
      </main>
    </AuthGuard>
  );
}

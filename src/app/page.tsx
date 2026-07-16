"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Search, Globe, Info, X, Compass, Sparkles, Navigation, Calendar, ChevronRight, MapPin, Plus, Minus, RefreshCcw, Trash2, CloudCheck, CloudOff, AlertCircle, Database, User as UserIcon, Bug, ShieldAlert, Wifi, HardDriveDownload, CheckCircle, Heart, BarChart3 } from "lucide-react";
import { getDocsFromServer, terminate, clearIndexedDbPersistence } from "firebase/firestore";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import NewTripModal from "@/components/NewTripModal";
import MarkCountryModal from "@/components/MarkCountryModal";
import TripDetailsModal from "@/components/TripDetailsModal";
import TripListModal from "@/components/TripListModal";
import CountryFlag from "@/components/CountryFlag";
import TravelStats from "@/components/TravelStats";

import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trip, createTrip, deleteTrip } from "@/lib/db";
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
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalStatus, setListModalStatus] = useState<"planned" | "visited">("planned");
  const [modalStatus, setModalStatus] = useState<"planned" | "visited">("planned");
  const [modalName, setModalName] = useState("");
  const [modalCities, setModalCities] = useState("");
  const [modalStartDate, setModalStartDate] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [viewTripId, setViewTripId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const handleClearCache = async () => {
    if (confirm("This will clear your local app cache and reload the page. This is the most effective fix for sync issues. Continue?")) {
      try {
        await terminate(db);
        await clearIndexedDbPersistence(db);
        window.location.reload();
      } catch (e) {
        console.error("Cache clear failed:", e);
        alert("Failed to clear cache. Try logging out and back in.");
      }
    }
  };

  const handleTestConnection = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "trips"), where("userId", "==", user.uid));
      await getDocsFromServer(q);
      alert("✅ Connection to Cloud is ACTIVE.\nServer responded successfully.");
    } catch (e: any) {
      alert(`❌ Connection ERROR:\n${e.message}`);
    }
  };

  const handleForceSync = async () => {
    if (!user) return;
    setIsRefreshing(true);
    setLoadingTrips(true);
    try {
      const q = query(
        collection(db, "trips"), 
        where("userId", "==", user.uid)
      );
      // Fetch directly from server bypassing cache
      const snapshot = await getDocsFromServer(q);
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
      setSyncError(null);
    } catch (error) {
      console.error("Force sync failed:", error);
      setSyncError("Force sync failed");
    } finally {
      setLoadingTrips(false);
      setIsRefreshing(false);
    }
  };
  
  // Map State
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1
  });

  // Search Suggestions State
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // New: State for all user trips
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  // Focus search input when '/' is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const input = document.getElementById("search-input");
        input?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for all trips for the current user
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

  const handleSelectSuggestion = (country: string) => {
    setSelectedCountry(country);
    setSearchTerm("");
    setSuggestions([]);
    
    // Reset modal details
    setModalName("");
    setModalCities("");
    setModalStartDate("");
    setModalEndDate("");
    setModalNotes("");
    
    // Zoom to country
    const centroid = COUNTRY_CENTROIDS[country];
    if (centroid) {
      setPosition({ coordinates: [centroid.lng, centroid.lat], zoom: 3 });
    }
  };

  const handleCountryClick = (geo: any) => {
    const name = geo.properties.name;
    const isDeselect = name === selectedCountry;
    setSelectedCountry(isDeselect ? null : name);
    
    if (!isDeselect) {
      // Reset modal details
      setModalName("");
      setModalCities("");
      setModalStartDate("");
      setModalEndDate("");
      setModalNotes("");

      const centroid = COUNTRY_CENTROIDS[name];
      if (centroid) {
        setPosition({ coordinates: [centroid.lng, centroid.lat], zoom: 3 });
      }
    } else {
      setPosition({ coordinates: [0, 20], zoom: 1 });
    }
  };

  const handleMarkCountrySave = async (
    status: "planned" | "visited", 
    addDetails: boolean, 
    details?: { name?: string; startDate?: string; endDate?: string; notes?: string; cities?: string }
  ) => {
    if (!user || !selectedCountry) return;

    if (addDetails) {
      setModalStatus(status);
      setModalName(details?.name || `${selectedCountry} Trip`);
      setModalCities(details?.cities || "");
      setModalStartDate(details?.startDate || "");
      setModalEndDate(details?.endDate || "");
      setModalNotes(details?.notes || "");
      setIsMarkModalOpen(false);
      setIsModalOpen(true);
    } else {
      try {
        const citiesArray = details?.cities 
          ? details.cities.split(",").map(c => c.trim()).filter(c => c !== "") 
          : [];

        const tripData: any = {
          userId: user.uid,
          name: details?.name || `${selectedCountry} Trip`,
          destination: selectedCountry,
          cities: citiesArray,
          baseCurrency: "USD",
          status: status,
          notes: details?.notes || "",
        };

        if (details?.startDate) {
          tripData.startDate = new Date(details.startDate + "T12:00:00");
        }
        if (details?.endDate) {
          tripData.endDate = new Date(details.endDate + "T12:00:00");
        }

        await createTrip(tripData);
        
        // Note: The modal will call its onClose prop after showing success state
      } catch (error) {
        console.error("Error quick marking country:", error);
        alert("Failed to mark country.");
      }
    }
  };

  const handleZoomIn = () => {
    if (position.zoom < 8) {
      setPosition(prev => ({ ...prev, zoom: prev.zoom * 1.5 }));
    }
  };

  const handleZoomOut = () => {
    if (position.zoom > 1) {
      setPosition(prev => ({ ...prev, zoom: prev.zoom / 1.5 }));
    } else {
      setPosition({ coordinates: [0, 20], zoom: 1 });
    }
  };

  const handleResetZoom = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
    setSelectedCountry(null);
  };

  const handleDeleteTrip = async (e: React.MouseEvent, tripId: string) => {
    e.stopPropagation();
    if (confirm("Delete this trip?")) {
      try {
        await deleteTrip(tripId);
      } catch (error) {
        console.error("Error deleting trip:", error);
      }
    }
  };

  const handleOpenList = (status: "planned" | "visited") => {
    setListModalStatus(status);
    setIsListModalOpen(true);
  };

  // Derive countries with itineraries for map highlighting
  const visitedCountries = new Set(allTrips.filter(t => t.status === "visited").map(trip => trip.destination));
  const plannedCountries = new Set(allTrips.filter(t => t.status === "planned").map(trip => trip.destination));

  // Filter trips for the selected country
  const countryTrips = allTrips.filter(trip => trip.destination === selectedCountry);
  const countryStatus = countryTrips.some(t => t.status === "visited") ? "visited" : (countryTrips.length > 0 ? "planned" : null);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-stone-50 text-stone-800 flex flex-col relative font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center gap-4">
              {/* Left spacer on desktop to balance the right section and center the search bar */}
              <div className="hidden lg:block lg:flex-1" />

              {/* Search Bar */}
              <div className="flex-1 max-w-lg mx-8 lg:mx-0 relative">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-stone-400 group-focus-within:text-emerald-600 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search your next destination... (Press '/' to search)"
                    className="block w-full pl-11 pr-24 py-3.5 bg-stone-100/90 border border-stone-200/80 rounded-2xl text-sm focus:ring-4 focus:ring-emerald-100/80 focus:border-emerald-500 focus:bg-white transition-all outline-none shadow-inner placeholder:text-stone-400 font-semibold text-stone-850"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    {searchTerm ? (
                      <button 
                        onClick={() => {
                          setSearchTerm("");
                          setSuggestions([]);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-stone-200 bg-stone-50 px-1.5 font-mono text-[10px] font-medium text-stone-400 shadow-sm pointer-events-none">
                        <span>/</span>
                      </kbd>
                    )}
                  </div>
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

              <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
                {/* Stats Summary Widget */}
                <div className="flex items-center gap-3 mr-4 border-r border-stone-200 pr-8 hidden lg:flex">
                  <div className="flex items-center bg-stone-100/80 p-1 rounded-2xl border border-stone-200/30 gap-1 shadow-inner">
                    <button 
                      onClick={() => handleOpenList("visited")}
                      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl hover:bg-white hover:shadow-sm hover:scale-[1.02] text-stone-600 hover:text-emerald-600 transition-all cursor-pointer"
                      title="View Visited Countries"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                      </span>
                      <div className="text-left">
                        <p className="text-xs font-black leading-none text-stone-900">{visitedCountries.size}</p>
                        <p className="text-[8px] font-black uppercase tracking-wider text-stone-400 mt-0.5 leading-none">Visited</p>
                      </div>
                    </button>
                    <div className="h-6 w-px bg-stone-200"></div>
                    <button 
                      onClick={() => handleOpenList("planned")}
                      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl hover:bg-white hover:shadow-sm hover:scale-[1.02] text-stone-600 hover:text-yellow-600 transition-all cursor-pointer"
                      title="View Wishlist"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                        <Heart className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      </span>
                      <div className="text-left">
                        <p className="text-xs font-black leading-none text-stone-900">{plannedCountries.size}</p>
                        <p className="text-[8px] font-black uppercase tracking-wider text-stone-400 mt-0.5 leading-none">Wishlist</p>
                      </div>
                    </button>
                  </div>
                  
                  {/* Statistics Page Link (navigates directly to statistics page with BarChart3 icon) */}
                  <Link 
                    href="/statistics"
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 hover:bg-emerald-600 shadow-md shadow-stone-200 hover:shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ml-1"
                    title="View Travel Statistics"
                  >
                    <BarChart3 className="h-5 w-5" />
                  </Link>
                </div>

                <div className="flex flex-col items-end hidden sm:flex">
                  <p className="text-sm font-black text-stone-900 leading-none">{user?.displayName || "Explorer"}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[9px] text-stone-400 font-bold truncate max-w-[120px]">{user?.email}</p>
                    <button 
                      onClick={() => alert(`Your Explorer ID:\n${user?.uid}`)}
                      className="p-0.5 text-stone-300 hover:text-stone-500 transition-colors"
                      title="View ID"
                    >
                      <Info className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user?.isAnonymous && <AlertCircle className="h-2 w-2 text-orange-500" />}
                    <p className={`text-[8px] font-black uppercase tracking-widest ${user?.isAnonymous ? "text-orange-500" : "text-emerald-500"}`}>
                      {user?.isAnonymous ? "Guest Mode" : "Synced"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="p-3 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                  title="Perfil"
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Perfil"
                      className="h-6 w-6 rounded-full object-cover border border-stone-200"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6" />
                  )}
                </Link>
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
        <div className="flex-1 relative flex flex-col items-center justify-center p-2 md:p-6">
          
          {/* Action Card / Selected Country */}
          <div 
            className={`absolute top-4 left-4 right-4 md:top-8 md:left-8 md:right-auto z-10 w-auto md:w-full md:max-w-[340px] transition-all duration-300 ease-out origin-top-left
              ${selectedCountry 
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
                : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
              }`}
          >
            <div className="bg-white/90 backdrop-blur-xl p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Destination</h2>
                  {countryStatus && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      countryStatus === "visited" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {countryStatus === "visited" ? "Visited" : "Planned"}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setSelectedCountry(null);
                    setPosition({ coordinates: [0, 20], zoom: 1 });
                  }} 
                  className="p-1 -mr-1 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
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
                                  {trip.name || trip.destination}
                                </p>
                                <p className="text-[10px] text-stone-400 font-bold truncate">
                                  {trip.cities && trip.cities.length > 0 
                                    ? trip.cities.join(", ") 
                                    : (trip.startDate && trip.endDate 
                                        ? `${format(trip.startDate, "MMM d")} - ${format(trip.endDate, "MMM d, yyyy")}` 
                                        : "Quickly Marked")}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tight">{trip.baseCurrency} Trip</p>
                                  <span className={`w-1 h-1 rounded-full ${trip.status === "visited" ? "bg-emerald-400" : "bg-yellow-400"}`}></span>
                                  <p className="text-[9px] text-stone-400 uppercase font-bold">{trip.status}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-emerald-500 transition-colors" />
                                <button 
                                  onClick={(e) => handleDeleteTrip(e, trip.id || "")}
                                  className="p-1.5 text-stone-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                  title="Delete trip"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          setModalStatus("visited");
                          setIsModalOpen(true);
                        }}
                        className="w-full bg-stone-900 text-stone-50 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200 active:scale-[0.98]"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        Visited
                      </button>
                      <button 
                        onClick={() => {
                          setModalStatus("planned");
                          setIsMarkModalOpen(true);
                        }}
                        className="w-full bg-white text-stone-900 border-2 border-stone-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98]"
                      >
                        <Heart className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        Wish to Visit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-stone-400 font-medium italic">Click a country to start planning your adventure.</p>
                    <div className="pt-4 border-t border-stone-100 flex justify-around items-center text-center lg:hidden">
                      <button 
                        onClick={() => handleOpenList("visited")}
                        className="group hover:scale-105 transition-transform cursor-pointer"
                      >
                        <p className="text-xl font-black text-emerald-600 line-height-1">{visitedCountries.size}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Visited</p>
                      </button>
                      <button 
                        onClick={() => handleOpenList("planned")}
                        className="group hover:scale-105 transition-transform cursor-pointer"
                      >
                        <p className="text-xl font-black text-yellow-600 line-height-1">{plannedCountries.size}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Wish to Visit</p>
                      </button>
                      <button 
                        onClick={() => {
                          const element = document.getElementById("statistics");
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="group hover:scale-105 transition-transform cursor-pointer flex flex-col items-center justify-center border-l border-stone-150 pl-4"
                      >
                        <Globe className="h-5 w-5 text-emerald-600" />
                        <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mt-1">Stats</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-full flex-1 md:max-h-[75vh] flex items-center justify-center relative">
            {/* Map Controls */}
            <div className="absolute right-4 bottom-4 md:right-8 md:bottom-8 z-10 flex flex-col gap-2">
              <button 
                onClick={handleZoomIn}
                className="p-3 bg-white border border-stone-200 rounded-xl shadow-lg text-stone-600 hover:bg-stone-50 active:scale-95 transition-all"
                title="Zoom In"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-3 bg-white border border-stone-200 rounded-xl shadow-lg text-stone-600 hover:bg-stone-50 active:scale-95 transition-all"
                title="Zoom Out"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button 
                onClick={handleResetZoom}
                className="p-3 bg-stone-900 border border-stone-800 rounded-xl shadow-lg text-stone-50 hover:bg-stone-800 active:scale-95 transition-all"
                title="Reset Map"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            </div>

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
                        fillColor = "#ffedd5";
                        strokeColor = "#f97316";
                        strokeWidth = 1;
                      } else if (isSelected) {
                        fillColor = "#ea580c";
                      } else if (isVisited) {
                        fillColor = "#d1fae5";
                        strokeColor = "#10b981";
                        strokeWidth = 0.5;
                      } else if (isPlanned) {
                        fillColor = "#fef9c3"; // Yellow 100
                        strokeColor = "#facc15"; // Yellow 400
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
          <div className="absolute bottom-4 left-4 md:bottom-10 md:left-1/2 md:-translate-x-1/2 z-10 flex flex-col items-start md:items-center gap-4 md:gap-6">
            {/* Mobile toggle button when collapsed */}
            {!isLegendOpen && (
              <button 
                onClick={() => setIsLegendOpen(true)}
                className="flex md:hidden bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-stone-200 shadow-lg items-center gap-2 text-stone-600 hover:bg-stone-50 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                <Info className="h-4 w-4 text-emerald-500" />
                <span>Legend</span>
              </button>
            )}

            {/* Full Legend (always visible on desktop, toggleable on mobile) */}
            <div className={`${isLegendOpen ? "flex animate-in fade-in slide-in-from-bottom-2 duration-200" : "hidden md:flex"} bg-white/90 backdrop-blur-md px-5 py-4 md:py-3 rounded-[1.5rem] md:rounded-2xl border border-stone-200 shadow-xl flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center relative w-full max-w-[240px] md:max-w-none`}>
              {/* Close button for mobile */}
              <button 
                onClick={() => setIsLegendOpen(false)}
                className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-600 md:hidden rounded-lg hover:bg-stone-50 cursor-pointer"
                title="Close Legend"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <button 
                onClick={() => handleOpenList("visited")}
                className="flex items-center gap-2 hover:bg-stone-50 px-2 py-1 rounded-lg transition-colors cursor-pointer w-full md:w-auto text-left"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-500 shrink-0"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Visited ({visitedCountries.size})
                </span>
              </button>
              
              <button 
                onClick={() => handleOpenList("planned")}
                className="flex items-center gap-2 hover:bg-stone-50 px-2 py-1 rounded-lg transition-colors cursor-pointer w-full md:w-auto text-left"
              >
                <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-400 shrink-0"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Wish to Visit ({plannedCountries.size})
                </span>
              </button>

              <div className="flex items-center gap-2 px-2 py-1 w-full md:w-auto">
                <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-500 shrink-0"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Search Match</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mark Country Modal */}
        {selectedCountry && isMarkModalOpen && (
          <MarkCountryModal
            isOpen={isMarkModalOpen}
            onClose={() => {
              setIsMarkModalOpen(false);
              setSelectedCountry(null); // Clear selection on close
            }}
            destination={selectedCountry}
            onSave={handleMarkCountrySave}
          />
        )}

        {/* Itinerary Modal */}
        {selectedCountry && isModalOpen && (
          <NewTripModal 
            isOpen={isModalOpen} 
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCountry(null); // Clear selection on close
            }} 
            destination={selectedCountry}
            initialStatus={modalStatus}
            initialName={modalName}
            initialCities={modalCities}
            initialStartDate={modalStartDate}
            initialEndDate={modalEndDate}
            initialNotes={modalNotes}
            onTripCreated={(tripId) => {
              // Note: NewTripModal will call its onClose prop after showing success state
            }}
          />
        )}

        {/* Trip List Modal */}
        <TripListModal 
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          trips={allTrips}
          onViewTrip={(tripId) => setViewTripId(tripId)}
          status={listModalStatus}
        />



        {/* Travel Statistics Section (Mobile only) */}
        <div className="md:hidden">
          <TravelStats trips={allTrips} />
        </div>

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

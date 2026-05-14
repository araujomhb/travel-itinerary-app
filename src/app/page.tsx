"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Search, Globe, Info, X, Compass, Sparkles, Navigation, Calendar } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import NewTripModal from "@/components/NewTripModal";

// World Map Data Source
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Helper to get flag emoji from country name/code
// For simplicity, we'll use a dynamic lookup or a simple property check
const getFlagEmoji = (countryName: string) => {
  const codePoints = countryName
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  // This is a complex logic for names. Better to use a lookup for common names or just a placeholder for now.
  // Actually, we can use a simpler approach for a demo:
  const flags: Record<string, string> = {
    "Brazil": "🇧🇷", "Portugal": "🇵🇹", "United States": "🇺🇸", "France": "🇫🇷",
    "Spain": "🇪🇸", "Germany": "🇩🇪", "Italy": "🇮🇹", "Japan": "🇯🇵",
    "China": "🇨🇳", "United Kingdom": "🇬🇧", "Canada": "🇨🇦", "Australia": "🇦🇺",
    "Argentina": "🇦🇷", "Mexico": "🇲🇽", "India": "🇮🇳", "Russia": "🇷🇺",
    "South Africa": "🇿🇦", "Egypt": "🇪🇬", "Nigeria": "🇳🇬", "Kenya": "🇰🇪"
  };
  return flags[countryName] || "🏳️";
};

export default function Home() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCountryClick = (geo: any) => {
    const name = geo.properties.name;
    setSelectedCountry(name === selectedCountry ? null : name);
  };

  const selectedFlag = selectedCountry ? getFlagEmoji(selectedCountry) : "";

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
              <div className="flex-1 max-w-md mx-8">
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
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-300 hover:text-stone-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
          <div className="absolute top-8 left-8 z-10 w-full max-w-[320px]">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-3">Destination</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`text-4xl shadow-inner ${selectedCountry ? "animate-bounce" : "opacity-20"}`}>
                    {selectedFlag || "🌍"}
                  </div>
                  <p className="text-2xl font-black text-stone-900 truncate">
                    {selectedCountry || "World Map"}
                  </p>
                </div>
                
                {selectedCountry ? (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 active:scale-[0.98]"
                  >
                    <Calendar className="h-4 w-4 fill-current" />
                    Plan Itinerary
                  </button>
                ) : (
                  <p className="text-sm text-stone-400 font-medium italic">Click a country to start planning your adventure.</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-full max-h-[75vh] flex items-center justify-center">
            <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 160 }}>
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const isSelected = selectedCountry === geo.properties.name;
                      const isHovered = hoveredCountry === geo.properties.name;
                      const isMatch = searchTerm && geo.properties.name.toLowerCase().includes(searchTerm.toLowerCase());

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => setHoveredCountry(geo.properties.name)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() => handleCountryClick(geo)}
                          style={{
                            default: {
                              fill: isMatch ? "#fef3c7" : (isSelected ? "#f59e0b" : "#ffffff"),
                              stroke: "#e7e5e4",
                              strokeWidth: 0.8,
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

          {/* Floating Instructions */}
          <div className="absolute bottom-10">
            <div className="bg-stone-900 text-stone-100 px-8 py-4 rounded-full flex items-center gap-3 text-sm font-bold shadow-2xl transition-all hover:scale-105">
              <Navigation className="h-4 w-4 text-emerald-400 fill-current" />
              <span>Select a country & plan your next itinerary</span>
              <Sparkles className="h-4 w-4 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Itinerary Modal */}
        {selectedCountry && (
          <NewTripModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            destination={selectedCountry}
          />
        )}
      </main>
    </AuthGuard>
  );
}

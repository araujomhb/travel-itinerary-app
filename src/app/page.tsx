"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Search, Globe, Info, X, Heart, Sparkles, Navigation } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";

// World Map Data Source
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function Home() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const handleCountryClick = (geo: any) => {
    const name = geo.properties.name;
    setSelectedCountry(name === selectedCountry ? null : name);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#FFF5F7] text-gray-800 flex flex-col relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-pink-100 rounded-full blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-purple-100 rounded-full blur-3xl opacity-40 -z-10"></div>

        {/* Navigation */}
        <nav className="bg-white/70 backdrop-blur-xl border-b border-pink-100 sticky top-0 z-50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-pink-400 p-2.5 rounded-2xl shadow-lg shadow-pink-100">
                  <Navigation className="h-6 w-6 text-white fill-current" />
                </div>
                <span className="text-2xl font-black text-pink-500 tracking-tight hidden sm:block">Explorer</span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-pink-200 group-focus-within:text-pink-400 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Where to next, love?"
                    className="block w-full pl-11 pr-11 py-3 bg-white border border-pink-50 rounded-2xl text-sm focus:ring-4 focus:ring-pink-100 focus:border-pink-200 transition-all outline-none shadow-inner placeholder:text-pink-100 placeholder:italic"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-pink-200 hover:text-pink-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-pink-500">{user?.displayName || "Explorer"}</p>
                  <p className="text-[10px] text-pink-300 font-bold uppercase tracking-widest">{user?.isAnonymous ? "Guest Mode" : "Member"}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-3 text-pink-200 hover:text-pink-500 hover:bg-pink-50 rounded-2xl transition-all active:scale-95"
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
          
          {/* Selected Country Card */}
          <div className="absolute top-8 left-8 z-10">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-[0_10px_30px_rgba(255,182,193,0.2)]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-200 mb-3">Currently Dreaming Of</h2>
              <div className="flex items-center gap-4">
                <div className={`h-4 w-4 rounded-full shadow-inner ${selectedCountry ? "bg-pink-400 animate-pulse" : "bg-pink-50"}`}></div>
                <p className="text-2xl font-black text-pink-500">{selectedCountry || "Select a place"}</p>
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
                              fill: isMatch ? "#FBCFE8" : (isSelected ? "#F472B6" : "#FDF2F8"),
                              stroke: "#FCE7F3",
                              strokeWidth: 0.8,
                              outline: "none",
                              transition: "all 300ms",
                            },
                            hover: {
                              fill: "#F9A8D4",
                              stroke: "#FBCFE8",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "#F472B6",
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
            <div className="bg-white/80 backdrop-blur-lg px-8 py-4 rounded-full border border-pink-50 flex items-center gap-3 text-sm font-bold text-pink-400 shadow-xl shadow-pink-100/50 transition-all hover:scale-105">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span>Tap a country to select it. Pinch to zoom in!</span>
              <Heart className="h-4 w-4 fill-pink-300 text-pink-300" />
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

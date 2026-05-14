"use client";

import { useState, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Search, Map as MapIcon, Globe, Info, X } from "lucide-react";
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
      <main className="min-h-screen bg-slate-900 text-white flex flex-col">
        {/* Navigation */}
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight hidden sm:block">Explorer</span>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search countries..."
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-sm focus:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold">{user?.displayName || "Explorer"}</p>
                  <p className="text-xs text-slate-400">{user?.isAnonymous ? "Guest Mode" : user?.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4">
          
          {/* Legend / Status */}
          <div className="absolute top-8 left-8 z-10 space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Selected Country</h2>
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${selectedCountry ? "bg-blue-500 animate-pulse" : "bg-slate-600"}`}></div>
                <p className="text-xl font-bold">{selectedCountry || "None"}</p>
              </div>
            </div>
          </div>

          <div className="w-full h-full max-h-[80vh] flex items-center justify-center">
            <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}>
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
                              fill: isMatch ? "#3b82f6" : (isSelected ? "#2563eb" : "#1e293b"),
                              stroke: "#475569",
                              strokeWidth: 0.5,
                              outline: "none",
                              transition: "all 250ms",
                            },
                            hover: {
                              fill: "#3b82f6",
                              stroke: "#64748b",
                              strokeWidth: 1,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "#1d4ed8",
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
          <div className="absolute bottom-8 flex gap-4">
            <div className="bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700 flex items-center gap-2 text-sm text-slate-300 shadow-xl">
              <Info className="h-4 w-4 text-blue-400" />
              <span>Click a country to select it. Pinch or scroll to zoom.</span>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

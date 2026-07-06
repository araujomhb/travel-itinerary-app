"use client";

import { useEffect, useState, useMemo } from "react";
import { Trip } from "@/lib/db";
import { differenceInDays, format } from "date-fns";
import { Globe, Calendar, Compass, Award, Percent, Hourglass, Landmark, ChevronDown, ChevronUp } from "lucide-react";
import CountryFlag from "./CountryFlag";
import { getContinentForCountry, continentTotalCountries } from "@/lib/continents";

// Helper component for animated counts
export function AnimatedCounter({ value, duration = 1000, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // outQuad easing
      
      const currentVal = easeProgress * (end - start) + start;
      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{count.toFixed(decimals)}</span>;
}

interface TravelStatsProps {
  trips: Trip[];
}

export default function TravelStats({ trips }: TravelStatsProps) {
  const [hoveredContinent, setHoveredContinent] = useState<string | null>(null);
  const [expandedTimelineYear, setExpandedTimelineYear] = useState<number | null>(null);

  // 1. Filter for Visited Trips
  const visitedTrips = useMemo(() => {
    return trips.filter((t) => t.status === "visited");
  }, [trips]);

  // 2. Visited Countries Set & Count
  const visitedCountries = useMemo(() => {
    return new Set(visitedTrips.map((t) => t.destination.trim()));
  }, [visitedTrips]);

  const visitedCount = visitedCountries.size;

  // 3. Percentage of countries visited
  const visitedPercentage = useMemo(() => {
    return visitedCount > 0 ? (visitedCount / 195) * 100 : 0;
  }, [visitedCount]);

  // 4. Percentage of world population that has visited fewer countries than me
  // Estimate model: 65% never travel abroad. The rest is distributed exponentially.
  const percentile = useMemo(() => {
    if (visitedCount === 0) return 0;
    // model: 65 + 35 * (1 - e^(-0.15 * count))
    return Math.round(65 + 35 * (1 - Math.exp(-0.15 * visitedCount)));
  }, [visitedCount]);

  // 5. Continent Breakdown
  const continentStats = useMemo(() => {
    const visitedByContinent: Record<string, Set<string>> = {
      "Africa": new Set(),
      "Asia": new Set(),
      "Europe": new Set(),
      "North America": new Set(),
      "Oceania": new Set(),
      "South America": new Set(),
      "Antarctica": new Set(),
    };

    visitedCountries.forEach((country) => {
      const continent = getContinentForCountry(country);
      if (visitedByContinent[continent]) {
        visitedByContinent[continent].add(country);
      }
    });

    const list = Object.keys(continentTotalCountries).map((name) => {
      const visitedSet = visitedByContinent[name];
      const visitedNames = Array.from(visitedSet);
      const visitedNum = visitedNames.length;
      const totalNum = continentTotalCountries[name] || 1;
      const pct = (visitedNum / totalNum) * 100;

      return {
        name,
        visited: visitedNum,
        total: totalNum,
        percentage: pct,
        countries: visitedNames,
      };
    });

    // Handle Antarctica specially if visited
    const antarcticaSet = visitedByContinent["Antarctica"];
    if (antarcticaSet && antarcticaSet.size > 0) {
      list.push({
        name: "Antarctica",
        visited: antarcticaSet.size,
        total: 1,
        percentage: 100,
        countries: Array.from(antarcticaSet),
      });
    }

    return list.sort((a, b) => b.percentage - a.percentage);
  }, [visitedCountries]);

  const visitedContinentsCount = useMemo(() => {
    return continentStats.filter((c) => c.visited > 0).length;
  }, [continentStats]);

  const continentsPercentage = useMemo(() => {
    // 7 total continents
    return (visitedContinentsCount / 7) * 100;
  }, [visitedContinentsCount]);

  // 6. Travel Timeline
  const timelineData = useMemo(() => {
    const yearsMap: Record<number, Trip[]> = {};

    visitedTrips.forEach((trip) => {
      const year = trip.startDate
        ? new Date(trip.startDate).getFullYear()
        : new Date(trip.createdAt).getFullYear();
      
      if (!yearsMap[year]) {
        yearsMap[year] = [];
      }
      yearsMap[year].push(trip);
    });

    // Sort years descending
    const sortedYears = Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedYears.map((year) => {
      // Sort trips in each year chronologically
      const sortedTrips = [...yearsMap[year]].sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : a.createdAt.getTime();
        const dateB = b.startDate ? new Date(b.startDate).getTime() : b.createdAt.getTime();
        return dateA - dateB;
      });

      return {
        year,
        trips: sortedTrips,
      };
    });
  }, [visitedTrips]);

  // Initialize expanded year to the most recent year if timelineData exists
  useEffect(() => {
    if (timelineData.length > 0 && expandedTimelineYear === null) {
      setExpandedTimelineYear(timelineData[0].year);
    }
  }, [timelineData, expandedTimelineYear]);

  // 7. Trip Metrics
  const tripMetrics = useMemo(() => {
    let totalTrips = visitedTrips.length;
    let totalTravelDays = 0;
    let tripsWithDates = 0;

    visitedTrips.forEach((trip) => {
      if (trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const days = differenceInDays(end, start) + 1;
        if (days > 0) {
          totalTravelDays += days;
          tripsWithDates++;
        }
      }
    });

    const averageDuration = tripsWithDates > 0 ? totalTravelDays / tripsWithDates : 0;

    return {
      totalTrips,
      totalTravelDays,
      averageDuration,
    };
  }, [visitedTrips]);

  // 8. Custom Bar Chart Data
  const chartData = useMemo(() => {
    const reversedTimeline = [...timelineData].reverse();
    const years = reversedTimeline.map(item => item.year);
    const counts = reversedTimeline.map(item => {
      // count unique countries visited in that year
      return new Set(item.trips.map(t => t.destination)).size;
    });

    const maxCount = Math.max(...counts, 3); // minimum scaling height for empty/small bars

    return {
      years,
      counts,
      maxCount,
    };
  }, [timelineData]);

  if (visitedCount === 0) {
    return (
      <section id="statistics" className="w-full bg-stone-50 py-16 px-6 sm:px-8 lg:px-12 flex flex-col items-center text-center">
        <div className="max-w-md bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.02)] space-y-6">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">Travel Statistics</h2>
          <p className="text-stone-500 font-medium text-sm leading-relaxed">
            You haven't marked any countries as visited yet. Use the interactive map above to log your adventures, and your statistical dashboard will unlock automatically!
          </p>
        </div>
      </section>
    );
  }

  // Circular progress SVG setup for Main Countries visited
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visitedPercentage / 100) * circumference;

  // Circular progress SVG setup for Percentile comparison
  const strokeDashoffsetPercentile = circumference - (percentile / 100) * circumference;

  return (
    <section id="statistics" className="w-full bg-stone-50 py-16 px-6 sm:px-8 lg:px-12 space-y-12 max-w-7xl mx-auto">
      {/* Header Accent */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100/50">
          <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Statistics Dashboard</span>
        </div>
        <h2 className="text-4xl font-black text-stone-950 tracking-tight">Your Global Footprint</h2>
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Derived in real-time from your travel history</p>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Card 1: Countries Visited */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 left-12 right-12 h-[3px] bg-emerald-500 rounded-b-full"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-400" /> Countries Visited
              </h3>
              <p className="text-stone-500 text-xs font-bold leading-relaxed">Percentage of the world explored</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-stone-100 stroke-current"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-emerald-500 stroke-current transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black text-stone-950"><AnimatedCounter value={visitedPercentage} decimals={1} />%</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between items-end">
            <div>
              <p className="text-3xl font-black text-stone-950 tracking-tight">
                <AnimatedCounter value={visitedCount} /> <span className="text-stone-300 font-medium text-lg">/ 195</span>
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Sovereign Nations</p>
            </div>
            <div className="bg-emerald-50 text-emerald-800 text-[10px] font-black tracking-wider uppercase px-3 py-1.5 rounded-xl border border-emerald-100">
              EXPLORER LEVEL
            </div>
          </div>
        </div>

        {/* Card 2: Travel Percentile */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative group hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute top-0 left-12 right-12 h-[3px] bg-orange-500 rounded-b-full"></div>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-stone-400" /> Global Standings
              </h3>
              <p className="text-stone-500 text-xs font-bold leading-relaxed">Comparison to global population</p>
            </div>
            
            <div className="relative flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-stone-100 stroke-current"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="text-orange-500 stroke-current transition-all duration-1000 ease-out"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffsetPercentile}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg font-black text-stone-950">&gt;<AnimatedCounter value={percentile} />%</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-stone-700 text-sm font-semibold leading-normal">
              You have traveled more than <span className="text-orange-600 font-extrabold">{percentile}%</span> of people worldwide.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-1.5 text-stone-400">
              <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"></span>
              <span className="text-[9px] font-bold uppercase tracking-widest">
                *Estimated based on global survey distributions
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Key Trip Metrics */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between relative group hover:border-yellow-500/30 transition-all duration-300">
          <div className="absolute top-0 left-12 right-12 h-[3px] bg-yellow-500 rounded-b-full"></div>
          
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-stone-400" /> Trip Metrics
            </h3>
            <p className="text-stone-500 text-xs font-bold leading-relaxed">Aggregated logs from your itineraries</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="space-y-1 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <span className="text-2xl font-black text-stone-950"><AnimatedCounter value={tripMetrics.totalTrips} /></span>
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Trips</p>
            </div>
            <div className="space-y-1 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <span className="text-2xl font-black text-stone-950">
                {tripMetrics.totalTravelDays > 0 ? <AnimatedCounter value={tripMetrics.totalTravelDays} /> : "-"}
              </span>
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Days</p>
            </div>
            <div className="space-y-1 bg-stone-50 p-3 rounded-2xl border border-stone-100">
              <span className="text-2xl font-black text-stone-950">
                {tripMetrics.averageDuration > 0 ? <AnimatedCounter value={tripMetrics.averageDuration} decimals={1} /> : "-"}
              </span>
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Avg. Days</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-yellow-500" />
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              {tripMetrics.totalTravelDays > 0 ? "Chronological stats compiled" : "Dates missing in logs"}
            </p>
          </div>
        </div>

      </div>

      {/* Continents & Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Continent Breakdown Box */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-stone-950 tracking-tight">Continent Breakdown</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                Completed <AnimatedCounter value={visitedContinentsCount} /> <span className="text-stone-300">/ 7</span> Continents
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-600 tracking-tighter"><AnimatedCounter value={continentsPercentage} />%</span>
            </div>
          </div>

          {/* Continent progress bars list */}
          <div className="space-y-5">
            {continentStats.map((item) => (
              <div 
                key={item.name} 
                className="space-y-1.5"
                onMouseEnter={() => setHoveredContinent(item.name)}
                onMouseLeave={() => setHoveredContinent(null)}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-850 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.visited > 0 ? "bg-emerald-500" : "bg-stone-300"}`}></span>
                    {item.name}
                  </span>
                  <span className="text-stone-400">
                    <span className="text-stone-900 font-extrabold">{item.visited}</span> / {item.total}
                  </span>
                </div>
                
                {/* Progress bar container */}
                <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden relative">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>

                {/* Country breakdown tooltips / details */}
                {item.visited > 0 && (
                  <div className={`text-[10px] font-bold text-stone-400 mt-1 px-3 py-2 bg-stone-50 rounded-xl border border-stone-100/50 flex flex-wrap gap-2 items-center transition-all duration-300 ${
                    hoveredContinent === item.name ? "opacity-100 scale-100" : "opacity-90"
                  }`}>
                    <span className="uppercase text-[9px] tracking-wider text-stone-400">Visited:</span>
                    {item.countries.map(c => (
                      <span key={c} className="inline-flex items-center gap-1 bg-white border border-stone-200/50 px-2 py-0.5 rounded-lg text-stone-700 shadow-sm">
                        <CountryFlag countryName={c} size="sm" className="scale-75" />
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg font-black text-stone-950 tracking-tight">Countries Visited by Year</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">Growth chart of your international travel</p>
          </div>

          {chartData.years.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-300 font-semibold space-y-2 border-2 border-dashed border-stone-100 rounded-3xl">
              <Hourglass className="w-8 h-8 text-stone-300" />
              <span>Timeline data not available</span>
            </div>
          ) : (
            <div className="relative w-full h-64 mt-4 flex items-end">
              <div className="w-full h-4/5 flex items-end justify-between px-4 border-b border-stone-200 pb-2">
                {chartData.years.map((year, idx) => {
                  const count = chartData.counts[idx];
                  const barHeightPct = (count / chartData.maxCount) * 100;
                  
                  return (
                    <div key={year} className="flex flex-col items-center flex-1 group relative mx-2">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 bg-stone-900 text-stone-50 text-[10px] font-black px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 flex items-center gap-1">
                        <span>{count} country{count > 1 ? "s" : ""}</span>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className="bg-emerald-500 group-hover:bg-emerald-600 rounded-t-lg transition-all duration-1000 ease-out w-8 sm:w-12 flex items-center justify-center text-[10px] text-emerald-800 font-black shadow-md shadow-emerald-500/5 cursor-pointer relative"
                        style={{ height: `${barHeightPct}%` }}
                      >
                        <span className="absolute bottom-2 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                      </div>
                      
                      {/* Label */}
                      <span className="text-[10px] font-black text-stone-500 mt-2 tracking-tight">{year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            <span>Progressive Logs</span>
            <span className="flex items-center gap-1.5"><Percent className="w-3 h-3 text-emerald-500" /> Real-time counts</span>
          </div>
        </div>

      </div>

      {/* Chronological Travel Timeline */}
      <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-stone-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.02)] space-y-8">
        <div>
          <h3 className="text-2xl font-black text-stone-950 tracking-tight">Travel Timeline</h3>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Chronological catalog of your adventures</p>
        </div>

        {timelineData.length === 0 ? (
          <div className="text-center py-12 text-stone-300 font-bold uppercase tracking-widest">
            Timeline not compiled yet
          </div>
        ) : (
          <div className="space-y-6">
            {timelineData.map((item) => {
              const isExpanded = expandedTimelineYear === item.year;
              
              return (
                <div key={item.year} className="border border-stone-150 rounded-[1.8rem] overflow-hidden transition-all duration-300 hover:shadow-md bg-stone-50/30">
                  {/* Accordion Trigger */}
                  <button 
                    onClick={() => setExpandedTimelineYear(isExpanded ? null : item.year)}
                    className="w-full px-6 py-5 flex justify-between items-center bg-white border-b border-stone-100 text-left transition-all hover:bg-stone-50/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span className="text-lg font-black text-stone-950">{item.year}</span>
                      <span className="text-xs font-bold text-stone-400">({item.trips.length} destination{item.trips.length > 1 ? "s" : ""})</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 animate-in slide-in-from-top duration-300">
                      <div className="relative pl-6 border-l-2 border-dashed border-stone-200 space-y-8">
                        {item.trips.map((trip, idx) => {
                          const dateString = trip.startDate && trip.endDate 
                            ? `${format(new Date(trip.startDate), "MMM d")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`
                            : "Quickly marked";
                            
                          return (
                            <div key={trip.id || idx} className="relative group">
                              {/* Connector Dot */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm transition-all group-hover:scale-125 z-10"></div>
                              
                              <div className="bg-white p-6 rounded-2xl border border-stone-100 hover:border-emerald-500/20 hover:shadow-lg transition-all duration-300 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                  <div className="flex items-center gap-3">
                                    <CountryFlag countryName={trip.destination} size="sm" />
                                    <div>
                                      <h4 className="text-sm font-bold text-stone-900 leading-tight">
                                        {trip.name || `${trip.destination} Trip`}
                                      </h4>
                                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">{trip.destination}</p>
                                    </div>
                                  </div>
                                  <div className="text-stone-400 text-[10px] font-bold uppercase tracking-wider bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-100">
                                    {dateString}
                                  </div>
                                </div>

                                {trip.cities && trip.cities.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {trip.cities.map((city) => (
                                      <span key={city} className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-100/50">
                                        {city}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {trip.notes && (
                                  <p className="text-stone-500 text-xs font-medium leading-relaxed italic bg-stone-50/50 p-3.5 rounded-xl border border-stone-100/50">
                                    "{trip.notes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}

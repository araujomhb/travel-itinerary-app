"use client";

import { useState, useEffect } from "react";

// Massive mapping for common names to ISO codes for the image URL
const countryToISO: Record<string, string> = {
  "Afghanistan": "af", "Albania": "al", "Algeria": "dz", "American Samoa": "as",
  "Andorra": "ad", "Angola": "ao", "Anguilla": "ai", "Antarctica": "aq",
  "Antigua and Barbuda": "ag", "Argentina": "ar", "Armenia": "am", "Aruba": "aw",
  "Australia": "au", "Austria": "at", "Azerbaijan": "az", "Bahamas": "bs",
  "Bahrain": "bh", "Bangladesh": "bd", "Barbados": "bb", "Belarus": "by",
  "Belgium": "be", "Belize": "bz", "Benin": "bj", "Bermuda": "bm",
  "Bhutan": "bt", "Bolivia": "bo", "Bosnia and Herzegovina": "ba", "Bosnia & Herz.": "ba",
  "Botswana": "bw", "Brazil": "br", "Brunei": "bn", "Bulgaria": "bg",
  "Burkina Faso": "bf", "Burundi": "bi", "Cambodia": "kh", "Cameroon": "cm",
  "Canada": "ca", "Cape Verde": "cv", "Cayman Islands": "ky", "Chad": "td",
  "Chile": "cl", "China": "cn", "Colombia": "co", "Comoros": "km",
  "Congo": "cg", "Costa Rica": "cr", "Croatia": "hr", "Cuba": "cu",
  "Cyprus": "cy", "Czechia": "cz", "Czech Republic": "cz", "Czech Rep.": "cz",
  "Denmark": "dk", "Djibouti": "dj", "Dominica": "dm", "Dominican Republic": "do",
  "Ecuador": "ec", "Egypt": "eg", "El Salvador": "sv", "Equatorial Guinea": "gq",
  "Eritrea": "er", "Estonia": "ee", "Ethiopia": "et", "Fiji": "fj",
  "Finland": "fi", "France": "fr", "Gabon": "ga", "Gambia": "gm",
  "Georgia": "ge", "Germany": "de", "Ghana": "gh", "Greece": "gr",
  "Greenland": "gl", "Grenada": "gd", "Guatemala": "gt", "Guinea": "gn",
  "Guyana": "gy", "Haiti": "ht", "Honduras": "hn", "Hungary": "hu",
  "Iceland": "is", "India": "in", "Indonesia": "id", "Iran": "ir",
  "Iraq": "iq", "Ireland": "ie", "Israel": "il", "Italy": "it",
  "Jamaica": "jm", "Japan": "jp", "Jordan": "jo", "Kazakhstan": "kz",
  "Kenya": "ke", "Kiribati": "ki", "North Korea": "kp", "South Korea": "kr",
  "S. Korea": "kr", "Kuwait": "kw", "Kyrgyzstan": "kg", "Laos": "la",
  "Latvia": "lv", "Lebanon": "lb", "Lesotho": "ls", "Liberia": "lr",
  "Libya": "ly", "Liechtenstein": "li", "Lithuania": "lt", "Luxembourg": "lu",
  "Madagascar": "mg", "Malawi": "mw", "Malaysia": "my", "Maldives": "mv",
  "Mali": "ml", "Malta": "mt", "Mexico": "mx", "Moldova": "md",
  "Monaco": "mc", "Mongolia": "mn", "Montenegro": "me", "Morocco": "ma",
  "Mozambique": "mz", "Myanmar": "mm", "Namibia": "na", "Nepal": "np",
  "Netherlands": "nl", "New Zealand": "nz", "Nicaragua": "ni", "Niger": "ne",
  "Nigeria": "ng", "Norway": "no", "Oman": "om", "Pakistan": "pk",
  "Panama": "pa", "Papua New Guinea": "pg", "Paraguay": "py", "Peru": "pe",
  "Philippines": "ph", "Poland": "pl", "Portugal": "pt", "Qatar": "qa",
  "Romania": "ro", "Russia": "ru", "Russian Federation": "ru", "Rwanda": "rw",
  "Saudi Arabia": "sa", "Senegal": "sn", "Serbia": "rs", "Seychelles": "sc",
  "Sierra Leone": "sl", "Singapore": "sg", "Slovakia": "sk", "Slovenia": "si",
  "Solomon Islands": "sb", "Somalia": "so", "South Africa": "za", "S. Africa": "za",
  "Spain": "es", "Sri Lanka": "lk", "Sudan": "sd", "Suriname": "sr",
  "Sweden": "se", "Switzerland": "ch", "Syria": "sy", "Taiwan": "tw",
  "Tajikistan": "tj", "Tanzania": "tz", "Thailand": "th", "Timor-Leste": "tl",
  "Togo": "tg", "Tonga": "to", "Trinidad and Tobago": "tt", "Tunisia": "tn",
  "Turkey": "tr", "Turkmenistan": "tm", "Uganda": "ug", "Ukraine": "ua",
  "United Arab Emirates": "ae", "United Kingdom": "gb", "UK": "gb", "Great Britain": "gb",
  "United States": "us", "USA": "us", "United States of America": "us",
  "Uruguay": "uy", "Uzbekistan": "uz", "Vanuatu": "vu", "Vatican City": "va",
  "Venezuela": "ve", "Vietnam": "vn", "Yemen": "ye", "Zambia": "zm", "Zimbabwe": "zw",
  "W. Sahara": "eh", "Western Sahara": "eh", "Dem. Rep. Congo": "cd", "Dem. Rep. Korea": "kp",
  "Eq. Guinea": "gq"
};

interface CountryFlagProps {
  countryName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * A robust component to display country flags using SVG images.
 * This ensures consistency on all operating systems (including Windows).
 */
export default function CountryFlag({ countryName, className = "", size = "md" }: CountryFlagProps) {
  const [iso, setIso] = useState<string | null>(null);

  useEffect(() => {
    if (countryName) {
      const normalized = countryName.trim().toLowerCase();
      const entry = Object.entries(countryToISO).find(
        ([key]) => key.toLowerCase() === normalized
      );
      setIso(entry ? entry[1] : null);
    }
  }, [countryName]);

  const sizes = {
    sm: "w-6 h-4",
    md: "w-10 h-7",
    lg: "w-16 h-11",
  };

  if (!iso) {
    return <span className={`inline-flex items-center justify-center bg-stone-100 rounded text-stone-300 ${sizes[size]} ${className}`}>🏳️</span>;
  }

  return (
    <div className={`relative inline-block overflow-hidden rounded-md shadow-sm border border-stone-200/50 ${sizes[size]} ${className}`}>
      <img
        src={`https://flagcdn.com/w80/${iso}.png`}
        alt={`Flag of ${countryName}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to emoji if image fails
          (e.target as any).style.display = "none";
        }}
      />
    </div>
  );
}

import { countryToISO } from "./flags";

export const countryToContinent: Record<string, string> = {
  // Asia
  "AF": "Asia", "AM": "Asia", "AZ": "Asia", "BH": "Asia", "BD": "Asia", "BT": "Asia", "BN": "Asia", 
  "KH": "Asia", "CN": "Asia", "CY": "Asia", "GE": "Asia", "IN": "Asia", "ID": "Asia", "IR": "Asia", 
  "IQ": "Asia", "IL": "Asia", "JP": "Asia", "JO": "Asia", "KZ": "Asia", "KP": "Asia", "KR": "Asia", 
  "KW": "Asia", "KG": "Asia", "LA": "Asia", "LB": "Asia", "MY": "Asia", "MV": "Asia", "MN": "Asia", 
  "MM": "Asia", "NP": "Asia", "OM": "Asia", "PK": "Asia", "PS": "Asia", "PH": "Asia", "QA": "Asia", 
  "SA": "Asia", "SG": "Asia", "LK": "Asia", "SY": "Asia", "TW": "Asia", "TJ": "Asia", "TH": "Asia", 
  "TL": "Asia", "TR": "Asia", "TM": "Asia", "AE": "Asia", "UZ": "Asia", "VN": "Asia", "YE": "Asia",
  "HK": "Asia", "MO": "Asia", "IO": "Asia",

  // Europe
  "AL": "Europe", "AD": "Europe", "AT": "Europe", "BY": "Europe", "BE": "Europe", "BA": "Europe", 
  "BG": "Europe", "HR": "Europe", "CZ": "Europe", "DK": "Europe", "EE": "Europe", "FI": "Europe", 
  "FR": "Europe", "DE": "Europe", "GR": "Europe", "HU": "Europe", "IS": "Europe", "IE": "Europe", 
  "IT": "Europe", "LV": "Europe", "LI": "Europe", "LT": "Europe", "LU": "Europe", "MT": "Europe", 
  "MD": "Europe", "MC": "Europe", "ME": "Europe", "NL": "Europe", "MK": "Europe", "NO": "Europe", 
  "PL": "Europe", "PT": "Europe", "RO": "Europe", "RU": "Europe", "SM": "Europe", "RS": "Europe", 
  "SK": "Europe", "SI": "Europe", "ES": "Europe", "SE": "Europe", "CH": "Europe", "UA": "Europe", 
  "GB": "Europe", "VA": "Europe", "GG": "Europe", "IM": "Europe", "JE": "Europe", "GI": "Europe",
  "FO": "Europe",

  // Africa
  "DZ": "Africa", "AO": "Africa", "BJ": "Africa", "BW": "Africa", "BF": "Africa", "BI": "Africa", 
  "CV": "Africa", "CM": "Africa", "CF": "Africa", "TD": "Africa", "KM": "Africa", "CG": "Africa", 
  "CD": "Africa", "DJ": "Africa", "EG": "Africa", "GQ": "Africa", "ER": "Africa", "SZ": "Africa", 
  "ET": "Africa", "GA": "Africa", "GM": "Africa", "GH": "Africa", "GN": "Africa", "GW": "Africa", 
  "CI": "Africa", "KE": "Africa", "LS": "Africa", "LR": "Africa", "LY": "Africa", "MG": "Africa", 
  "MW": "Africa", "ML": "Africa", "MR": "Africa", "MU": "Africa", "YT": "Africa", "MA": "Africa", 
  "MZ": "Africa", "NA": "Africa", "NE": "Africa", "NG": "Africa", "RE": "Africa", "RW": "Africa", 
  "ST": "Africa", "SN": "Africa", "SC": "Africa", "SL": "Africa", "SO": "Africa", "ZA": "Africa", 
  "SS": "Africa", "SD": "Africa", "TZ": "Africa", "TG": "Africa", "TN": "Africa", "UG": "Africa", 
  "EH": "Africa", "ZM": "Africa", "ZW": "Africa", "SH": "Africa",

  // North America
  "AG": "North America", "BS": "North America", "BB": "North America", "BZ": "North America", 
  "BM": "North America", "CA": "North America", "KY": "North America", "CR": "North America", 
  "CU": "North America", "DM": "North America", "DO": "North America", "SV": "North America", 
  "GL": "North America", "GD": "North America", "GP": "North America", "GT": "North America", 
  "HT": "North America", "HN": "North America", "JM": "North America", "MQ": "North America", 
  "MX": "North America", "MS": "North America", "NI": "North America", "PA": "North America", 
  "PR": "North America", "KN": "North America", "LC": "North America", "PM": "North America", 
  "VC": "North America", "TT": "North America", "TC": "North America", "US": "North America", 
  "VG": "North America", "VI": "North America", "BL": "North America", "MF": "North America", 
  "SX": "North America", "AW": "North America", "CW": "North America",

  // South America
  "AR": "South America", "BO": "South America", "BR": "South America", "CL": "South America", 
  "CO": "South America", "EC": "South America", "FK": "South America", "GF": "South America", 
  "GY": "South America", "PY": "South America", "PE": "South America", "SR": "South America", 
  "UY": "South America", "VE": "South America",

  // Oceania
  "AS": "Oceania", "AU": "Oceania", "CK": "Oceania", "FJ": "Oceania", "PF": "Oceania", 
  "GU": "Oceania", "KI": "Oceania", "MH": "Oceania", "FM": "Oceania", "NR": "Oceania", 
  "NC": "Oceania", "NZ": "Oceania", "NU": "Oceania", "NF": "Oceania", "MP": "Oceania", 
  "PW": "Oceania", "PG": "Oceania", "PN": "Oceania", "WS": "Oceania", "SB": "Oceania", 
  "TK": "Oceania", "TO": "Oceania", "TV": "Oceania", "VU": "Oceania", "WF": "Oceania", 
  "CC": "Oceania", "CX": "Oceania",

  // Antarctica
  "AQ": "Antarctica", "TF": "Antarctica"
};

// Total standard sovereign countries per continent (summing up to 195)
export const continentTotalCountries: Record<string, number> = {
  "Africa": 54,
  "Asia": 48,
  "Europe": 44,
  "North America": 23,
  "Oceania": 14,
  "South America": 12
};

/**
 * Returns the continent name for a given country name.
 * @param countryName - The name of the country.
 * @returns The continent name or a default if not found.
 */
export function getContinentForCountry(countryName: string): string {
  if (!countryName) return "Other";
  
  const normalized = countryName.trim().toLowerCase();
  
  // Try direct lookup of countryName in countryToISO
  const entry = Object.entries(countryToISO).find(
    ([key]) => key.toLowerCase() === normalized
  );
  
  const isoCode = entry ? entry[1] : null;
  if (!isoCode) return "Other";
  
  return countryToContinent[isoCode.toUpperCase()] || "Other";
}

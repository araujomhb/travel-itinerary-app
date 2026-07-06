import { describe, it, expect } from "vitest";
import { getContinentForCountry, countryToContinent } from "./continents";

describe("continents helper", () => {
  it("resolves correct continents for common country names", () => {
    expect(getContinentForCountry("Germany")).toBe("Europe");
    expect(getContinentForCountry("China")).toBe("Asia");
    expect(getContinentForCountry("Brazil")).toBe("South America");
    expect(getContinentForCountry("United States")).toBe("North America");
    expect(getContinentForCountry("USA")).toBe("North America");
    expect(getContinentForCountry("Egypt")).toBe("Africa");
    expect(getContinentForCountry("Australia")).toBe("Oceania");
    expect(getContinentForCountry("Antarctica")).toBe("Antarctica");
  });

  it("handles case insensitivity and whitespace trimming", () => {
    expect(getContinentForCountry("   germany  ")).toBe("Europe");
    expect(getContinentForCountry("CHINA")).toBe("Asia");
    expect(getContinentForCountry("south korea")).toBe("Asia");
  });

  it("returns Other for unknown countries", () => {
    expect(getContinentForCountry("")).toBe("Other");
    expect(getContinentForCountry("Atlantis")).toBe("Other");
  });

  it("maps ISO codes correctly to continents", () => {
    expect(countryToContinent["DE"]).toBe("Europe");
    expect(countryToContinent["CN"]).toBe("Asia");
    expect(countryToContinent["BR"]).toBe("South America");
    expect(countryToContinent["US"]).toBe("North America");
    expect(countryToContinent["EG"]).toBe("Africa");
    expect(countryToContinent["AU"]).toBe("Oceania");
    expect(countryToContinent["AQ"]).toBe("Antarctica");
  });
});

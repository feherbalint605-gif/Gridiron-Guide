// A súly MINDIG lbs-ben van tárolva az adatbázisban (egész szám).
// Ezek a segédfüggvények csak megjelenítéshez / beviteli mezőhöz konvertálnak.

const LBS_PER_KG = 2.20462262;

export function lbsToDisplay(lbs: number, unit: "lbs" | "kg"): number {
  if (unit === "kg") {
    return Math.round((lbs / LBS_PER_KG) * 10) / 10;
  }
  return Math.round(lbs);
}

export function displayToLbs(value: number, unit: "lbs" | "kg"): number {
  if (unit === "kg") {
    return Math.round(value * LBS_PER_KG);
  }
  return Math.round(value);
}

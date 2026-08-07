// A súly MINDIG lbs-ben van tárolva az adatbázisban (1 tizedesjegy pontossággal).
// Ezek a segédfüggvények csak megjelenítéshez / beviteli mezőhöz konvertálnak.
const LBS_PER_KG = 2.20462262;

export function lbsToDisplay(lbs: number, unit: "lbs" | "kg"): number {
  if (unit === "kg") {
    return Math.round((lbs / LBS_PER_KG) * 10) / 10;
  }
  return Math.round(lbs * 10) / 10;
}

export function displayToLbs(value: number, unit: "lbs" | "kg"): number {
  if (unit === "kg") {
    return Math.round(value * LBS_PER_KG * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

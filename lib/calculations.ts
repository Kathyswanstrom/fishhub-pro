export function roundOne(value: number): number { return Math.round((value || 0) * 10) / 10; }
export function estimateHalibutWeight(lengthInches: number): number {
  if (!lengthInches || lengthInches <= 0) return 0;
  return roundOne(0.00018872 * Math.pow(lengthInches, 3.24));
}
export function estimateSalmonWeight(lengthInches: number, girthInches?: number): number {
  if (!lengthInches || lengthInches <= 0) return 0;
  if (girthInches && girthInches > 0) return roundOne((lengthInches * girthInches * girthInches) / 800);
  return roundOne(0.00069 * Math.pow(lengthInches, 2.98));
}
export function processedYield(weight: number, percent: number): number { return roundOne(weight * (percent / 100)); }
export function shareMapUrl(lat?: number | null, lng?: number | null): string {
  if (!lat || !lng) return '';
  return `https://maps.google.com/?q=${lat},${lng}`;
}
export function formatDateTimeLocal(date = new Date()): string {
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
export function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 3958.8;
  const toRad = (v:number)=>v*Math.PI/180;
  const dLat=toRad(lat2-lat1); const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return r*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

import { distanceMiles } from './calculations';

export type TideStation = { id: string; name: string; lat: number; lng: number; distanceMiles: number };
export type TideData = { stationId: string; stationName: string; highTide: string; lowTide: string };

function yyyymmdd(dateValue: string): string {
  const d = new Date(dateValue); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0');
  return `${y}${m}${day}`;
}

export async function nearestNoaaTideStation(latitude: number, longitude: number): Promise<TideStation | null> {
  const res = await fetch('https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions');
  if (!res.ok) throw new Error('NOAA tide stations could not be loaded.');
  const json = await res.json();
  const stations = (json.stations || []).map((s:any) => {
    const lat = Number(s.lat || s.latitude); const lng = Number(s.lng || s.lon || s.longitude);
    if (!s.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { id: String(s.id), name: String(s.name || s.id), lat, lng, distanceMiles: distanceMiles(latitude, longitude, lat, lng) };
  }).filter(Boolean).sort((a:TideStation,b:TideStation)=>a.distanceMiles-b.distanceMiles);
  return stations[0] || null;
}

export async function highLowTides(stationId: string, caughtAt: string): Promise<{ highTide: string; lowTide: string }> {
  const date = yyyymmdd(caughtAt);
  const url = new URL('https://api.tidesandcurrents.noaa.gov/api/prod/datagetter');
  url.searchParams.set('begin_date', date); url.searchParams.set('end_date', date); url.searchParams.set('station', stationId);
  url.searchParams.set('product', 'predictions'); url.searchParams.set('datum', 'MLLW'); url.searchParams.set('time_zone', 'lst_ldt');
  url.searchParams.set('interval', 'hilo'); url.searchParams.set('units', 'english'); url.searchParams.set('application', 'FishHubPro'); url.searchParams.set('format', 'json');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('NOAA high/low tides could not be loaded.');
  const json = await res.json();
  const predictions = json.predictions || [];
  const fmt = (p:any)=>`${new Date(p.t).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})} / ${p.v} ft`;
  return { highTide: predictions.filter((p:any)=>p.type==='H').map(fmt).join(', '), lowTide: predictions.filter((p:any)=>p.type==='L').map(fmt).join(', ') };
}

export async function tideDataForLocation(latitude: number, longitude: number, caughtAt: string): Promise<TideData | null> {
  const station = await nearestNoaaTideStation(latitude, longitude);
  if (!station) return null;
  const tides = await highLowTides(station.id, caughtAt);
  return { stationId: station.id, stationName: `${station.name} (${Math.round(station.distanceMiles * 10) / 10} mi)`, ...tides };
}

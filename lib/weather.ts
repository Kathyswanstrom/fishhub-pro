export type WeatherSnapshot = {
  airTemp?: number; windSpeed?: number; windDirection?: number; pressure?: number; waveHeight?: number; wavePeriod?: number; waterTemp?: number; summary: string;
};
export async function fetchWeatherSnapshot(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
  weatherUrl.searchParams.set('latitude', String(latitude)); weatherUrl.searchParams.set('longitude', String(longitude));
  weatherUrl.searchParams.set('current', 'temperature_2m,wind_speed_10m,wind_direction_10m,surface_pressure');
  weatherUrl.searchParams.set('temperature_unit', 'fahrenheit'); weatherUrl.searchParams.set('wind_speed_unit', 'mph'); weatherUrl.searchParams.set('timezone', 'auto');
  const marineUrl = new URL('https://marine-api.open-meteo.com/v1/marine');
  marineUrl.searchParams.set('latitude', String(latitude)); marineUrl.searchParams.set('longitude', String(longitude));
  marineUrl.searchParams.set('current', 'wave_height,wave_period,sea_surface_temperature'); marineUrl.searchParams.set('timezone', 'auto');
  const [wRes, mRes] = await Promise.allSettled([fetch(weatherUrl.toString()), fetch(marineUrl.toString())]);
  let current:any = {}; let marine:any = {};
  if (wRes.status === 'fulfilled' && wRes.value.ok) current = (await wRes.value.json()).current || {};
  if (mRes.status === 'fulfilled' && mRes.value.ok) marine = (await mRes.value.json()).current || {};
  return {
    airTemp: current.temperature_2m, windSpeed: current.wind_speed_10m, windDirection: current.wind_direction_10m,
    pressure: current.surface_pressure, waveHeight: marine.wave_height, wavePeriod: marine.wave_period, waterTemp: marine.sea_surface_temperature,
    summary: `Air ${current.temperature_2m ?? '-'}°F, wind ${current.wind_speed_10m ?? '-'} mph, waves ${marine.wave_height ?? '-'} m, SST ${marine.sea_surface_temperature ?? '-'}°C`
  };
}

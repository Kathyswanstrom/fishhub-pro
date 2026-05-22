export type PrivacyLevel = 'private' | 'crew' | 'approximate' | 'public';
export type Species = 'halibut' | 'salmon' | 'crab' | 'other';
export type CatchRecord = {
  id?: string; trip_id?: string | null; species: Species; species_detail?: string | null; length_inches?: number | null; girth_inches?: number | null;
  estimated_weight_lbs?: number | null; estimated_yield_lbs?: number | null; yield_percent?: number | null; location_name: string; latitude?: number | null; longitude?: number | null;
  depth_ft?: number | null; caught_at: string; bait?: string | null; lure_color?: string | null; tide_station_id?: string | null; tide_station_name?: string | null;
  high_tide?: string | null; low_tide?: string | null; weather_summary?: string | null; captain_notes?: string | null; photo_url?: string | null; privacy_level?: PrivacyLevel;
};
export type CrabPotRecord = {
  id?: string; trip_id?: string | null; pot_number: string; location_name: string; latitude?: number | null; longitude?: number | null; depth_ft?: number | null;
  bait?: string | null; dropped_at: string; pulled_at?: string | null; soak_hours?: number | null; keepers?: number | null; shorts?: number | null; females?: number | null; soft_shell?: number | null; bottom_type?: string | null; notes?: string | null; photo_url?: string | null; privacy_level?: PrivacyLevel;
};

/**
 * Mapbox Geocoding bias for Grow Green service-area address autocomplete.
 *
 * Without proximity + bbox, short US queries (e.g. "14464 L") often rank
 * out-of-state matches (notably Ohio) ahead of South Louisiana streets.
 *
 * Values are lon,lat for proximity and minLon,minLat,maxLon,maxLat for bbox.
 */
export const LA_MAPBOX_PROXIMITY = "-91.05,30.35";
export const LA_MAPBOX_BBOX = "-92.25,29.40,-89.35,31.65";

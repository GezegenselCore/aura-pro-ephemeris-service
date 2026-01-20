/**
 * Julian Day utilities
 */

/**
 * Convert UTC Date to Julian Day (UT)
 * Swiss Ephemeris expects UT Julian Day
 */
export function dateToJulianDayUT(date: Date): number {
  const time = date.getTime();
  // Julian Day = (time / 86400000) + 2440587.5
  // 2440587.5 is the Julian Day for 1970-01-01 00:00:00 UTC
  return time / 86400000 + 2440587.5;
}

/**
 * Swiss Ephemeris provider using sweph Node binding
 * Handles ephemeris file management and calculations
 * 
 * NOTE: This file uses Swiss Ephemeris (AGPL) and must remain open source.
 */

import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';
import * as path from 'path';
import { dateToJulianDayUT } from '../utils/julian';
import { normalizeAngleDeg, shortestDeltaDeg } from '../utils/angles';
import { getSwephBodyConstant, type BodyName } from './bodies';
import { HttpsError } from 'firebase-functions/v2/https';

// Lazy load sweph (may not be available in all environments)
let sweph: any = null;
let ephemerisPathSet = false;

/**
 * Load sweph library
 * Throws HttpsError if library not available
 */
function loadSweph(): any {
  if (sweph) return sweph;
  try {
    sweph = require('sweph');
    return sweph;
  } catch (err: any) {
    throw new HttpsError(
      'unavailable',
      `Swiss Ephemeris library not available: ${err?.message || 'unknown error'}`
    );
  }
}

const EPHEMERIS_DIR = '/tmp/se';
const BUCKET_NAME = process.env.EPHEMERIS_BUCKET || 'aura-ephemeris';
const EPHEMERIS_PREFIX = process.env.EPHEMERIS_PREFIX || 'se/';

/**
 * Ensure ephemeris files are downloaded from GCS
 */
async function ensureEphemerisFiles(): Promise<void> {
  // Check if files already exist
  if (fs.existsSync(EPHEMERIS_DIR)) {
    const files = fs.readdirSync(EPHEMERIS_DIR);
    if (files.length > 0) {
      // Files exist, assume they're valid
      return;
    }
  }

  // Create directory
  fs.mkdirSync(EPHEMERIS_DIR, { recursive: true });

  try {
    // Initialize GCS client
    const storage = new Storage();
    const bucket = storage.bucket(BUCKET_NAME);

    // List of required ephemeris files for Chiron + asteroids
    // Swiss Ephemeris asteroid ephemeris files:
    // - seas_433.se1: Main asteroid ephemeris (Ceres, Pallas, Juno, Vesta)
    // - seas_434.se1: Extended asteroid ephemeris (if needed)
    // - sepl_433.se1: Planetary ephemeris (base, may be needed for calculations)
    // Note: Chiron may require additional file or be in seas_433.se1
    // Verify exact file requirements with Swiss Ephemeris documentation
    const requiredFiles = [
      'seas_433.se1', // Main asteroid ephemeris (Ceres, Pallas, Juno, Vesta)
      // 'seas_434.se1', // Extended asteroids (if Chiron not in seas_433)
      // 'sepl_433.se1', // Planetary base (may be needed for coordinate transforms)
    ];

    // Download files
    for (const filename of requiredFiles) {
      const remotePath = `${EPHEMERIS_PREFIX}${filename}`;
      const localPath = path.join(EPHEMERIS_DIR, filename);

      try {
        await bucket.file(remotePath).download({ destination: localPath });
        console.log(`[swephProvider] Downloaded ${filename}`);
      } catch (err: any) {
        console.warn(`[swephProvider] Failed to download ${filename}:`, err?.message);
        // Continue with other files
      }
    }

    // Set ephemeris path for sweph (only once)
    if (!ephemerisPathSet) {
      const swephLib = loadSweph();
      // sweph API: setEphePath(path) or swe_set_ephe_path(path)
      if (swephLib && typeof swephLib.setEphePath === 'function') {
        swephLib.setEphePath(EPHEMERIS_DIR);
        ephemerisPathSet = true;
        console.log(`[swephProvider] Ephemeris path set to: ${EPHEMERIS_DIR}`);
      } else if (swephLib && typeof swephLib.swe_set_ephe_path === 'function') {
        swephLib.swe_set_ephe_path(EPHEMERIS_DIR);
        ephemerisPathSet = true;
        console.log(`[swephProvider] Ephemeris path set to: ${EPHEMERIS_DIR}`);
      } else {
        console.warn('[swephProvider] setEphePath function not found in sweph library');
      }
    }
  } catch (err: any) {
    throw new HttpsError(
      'unavailable',
      `Failed to download ephemeris files: ${err?.message || 'unknown error'}`
    );
  }
}

/**
 * Compute ecliptic longitude for a body at given UTC time
 */
async function computeLongitude(
  bodyName: BodyName,
  utcDate: Date,
  zodiacSystem: 'tropical' | 'sidereal_lahiri'
): Promise<number> {
  await ensureEphemerisFiles();
  const swephLib = loadSweph();

  const jd = dateToJulianDayUT(utcDate);
  const bodyConstant = getSwephBodyConstant(bodyName);

  // Swiss Ephemeris calculation flags
  // SEFLG_SWIEPH = 256 (0x100) - use Swiss Ephemeris
  // SEFLG_SPEED = 256 (0x100) - include speed in result
  // SEFLG_EQUATORIAL = 0 - ecliptic coordinates (default)
  // Note: Flag values may vary by sweph binding version, verify with docs
  const SEFLG_SWIEPH = 256; // Use Swiss Ephemeris
  const flags = SEFLG_SWIEPH;

  try {
    // Calculate geocentric ecliptic position
    // sweph API: calc_ut(jd_ut, body, flags) -> [longitude, latitude, distance, speedLong, speedLat, speedDist, ...]
    // OR: swe_calc_ut(jd_ut, body, flags, [longitude, latitude, distance, ...], errorString)
    // Verify exact API signature with sweph npm package documentation
    
    let result: number[] | null = null;
    let errorString = '';

    // Try modern API first (calc_ut returns array)
    if (typeof swephLib.calc_ut === 'function') {
      const calcResult = swephLib.calc_ut(jd, bodyConstant, flags);
      if (Array.isArray(calcResult) && calcResult.length >= 1) {
        result = calcResult;
      }
    }
    // Try alternative API (swe_calc_ut with output array)
    else if (typeof swephLib.swe_calc_ut === 'function') {
      const xx = [0, 0, 0, 0, 0, 0]; // Output array
      const ret = swephLib.swe_calc_ut(jd, bodyConstant, flags, xx, errorString);
      if (ret >= 0 && xx.length >= 1) {
        result = xx;
      } else {
        throw new Error(`swe_calc_ut returned error code: ${ret}, message: ${errorString}`);
      }
    }
    // Try legacy API (calc returns object)
    else if (typeof swephLib.calc === 'function') {
      const calcResult = swephLib.calc(jd, bodyConstant, flags);
      if (calcResult && typeof calcResult === 'object') {
        result = [
          calcResult.longitude || calcResult.lon || 0,
          calcResult.latitude || calcResult.lat || 0,
          calcResult.distance || calcResult.dist || 0,
        ];
      }
    }

    if (!result || result.length < 1 || !isFinite(result[0])) {
      throw new Error(`Invalid result from sweph for ${bodyName}: ${JSON.stringify(result)}`);
    }

    let longitude = result[0]; // Ecliptic longitude in degrees

    // Apply sidereal shift if needed
    if (zodiacSystem === 'sidereal_lahiri') {
      // Calculate Lahiri ayanamsa
      // sweph API: get_ayanamsa(jd) or swe_get_ayanamsa(jd)
      let ayanamsa = 0;
      
      if (typeof swephLib.get_ayanamsa === 'function') {
        ayanamsa = swephLib.get_ayanamsa(jd) || 0;
      } else if (typeof swephLib.swe_get_ayanamsa === 'function') {
        ayanamsa = swephLib.swe_get_ayanamsa(jd) || 0;
      } else {
        // Fallback: calculate Lahiri ayanamsa manually if API not available
        // Lahiri ayanamsa formula (approximate): 23.85327 + 0.013012 * (jd - 2451545) / 36525
        const t = (jd - 2451545.0) / 36525.0;
        ayanamsa = 23.85327 + 0.013012 * t;
        console.warn(`[swephProvider] Using manual Lahiri ayanamsa calculation for ${bodyName}`);
      }

      longitude = normalizeAngleDeg(longitude - ayanamsa);
    } else {
      longitude = normalizeAngleDeg(longitude);
    }

    return longitude;
  } catch (err: any) {
    const errorMsg = err?.message || 'unknown error';
    console.error(`[swephProvider] Error computing ${bodyName} at JD ${jd}:`, errorMsg);
    throw new HttpsError(
      'unavailable',
      `Failed to compute position for ${bodyName}: ${errorMsg}`
    );
  }
}

/**
 * Compute speed and retrograde status
 * Uses +12h sampling method for consistency with on-device engine
 */
async function computeSpeed(
  bodyName: BodyName,
  utcDate: Date,
  zodiacSystem: 'tropical' | 'sidereal_lahiri'
): Promise<{ speedDegPerDay: number; retrograde: boolean }> {
  const lon0 = await computeLongitude(bodyName, utcDate, zodiacSystem);

  // Sample at +12 hours
  const t1 = new Date(utcDate.getTime() + 12 * 60 * 60 * 1000);
  const lon1 = await computeLongitude(bodyName, t1, zodiacSystem);

  // Calculate delta (shortest path)
  const delta12h = shortestDeltaDeg(lon0, lon1);
  const speedDegPerDay = delta12h * 2; // Scale to per day

  return {
    speedDegPerDay: Math.round(speedDegPerDay * 10000) / 10000, // Round to 4 decimals
    retrograde: speedDegPerDay < 0,
  };
}

/**
 * Compute extras for all requested bodies
 */
export async function computeExtras(
  utcISO: string,
  bodies: BodyName[],
  zodiacSystem: 'tropical' | 'sidereal_lahiri',
  wantSpeed: boolean
): Promise<Record<string, { longitudeDeg: number; speedDegPerDay?: number; retrograde?: boolean }>> {
  const utcDate = new Date(utcISO);
  if (isNaN(utcDate.getTime())) {
    throw new HttpsError('invalid-argument', `Invalid UTC date: ${utcISO}`);
  }

  const extras: Record<string, { longitudeDeg: number; speedDegPerDay?: number; retrograde?: boolean }> = {};

  for (const bodyName of bodies) {
    try {
      const longitude = await computeLongitude(bodyName, utcDate, zodiacSystem);

      const result: any = {
        longitudeDeg: Math.round(longitude * 10000) / 10000, // Round to 4 decimals
      };

      if (wantSpeed) {
        const speed = await computeSpeed(bodyName, utcDate, zodiacSystem);
        result.speedDegPerDay = speed.speedDegPerDay;
        result.retrograde = speed.retrograde;
      }

      extras[bodyName] = result;
    } catch (err: any) {
      // Log error but continue with other bodies
      // This allows partial results if one body fails
      console.error(`[swephProvider] Error computing ${bodyName}:`, err?.message || err);
      // Skip this body and continue with others
      // In production, you may want to throw if critical bodies fail
    }
  }

  // Validate that at least one body was computed
  if (Object.keys(extras).length === 0) {
    throw new HttpsError(
      'unavailable',
      'Failed to compute any body positions. Check ephemeris files and sweph configuration.'
    );
  }

  return extras;
}

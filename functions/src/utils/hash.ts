/**
 * Hash utilities for cache keys
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash for cache key
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate cache document ID from request parameters
 */
export function generateCacheKey(
  utcISO: string,
  zodiacSystem: string,
  bodies: string[],
  wantSpeed: boolean
): string {
  const bodiesSorted = [...bodies].sort().join(',');
  const input = `${utcISO}|${zodiacSystem}|${bodiesSorted}|${wantSpeed}`;
  return sha256(input);
}

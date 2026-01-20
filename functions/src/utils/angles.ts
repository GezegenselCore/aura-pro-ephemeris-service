/**
 * Angle normalization utilities
 */

/**
 * Normalize angle to 0..360 range
 */
export function normalizeAngleDeg(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Shortest delta between two angles (in degrees)
 * Returns value in range [-180, 180)
 */
export function shortestDeltaDeg(a: number, b: number): number {
  const delta = normalizeAngleDeg(b) - normalizeAngleDeg(a);
  return ((delta + 540) % 360) - 180;
}

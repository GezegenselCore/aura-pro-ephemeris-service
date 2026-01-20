/**
 * Firestore cache for ephemeris results
 * TTL: 3 days (optimal balance: accuracy + cost efficiency)
 * 
 * Rationale:
 * - Chiron: ~0.02-0.03°/day → 3 days = ~0.06-0.09° error (excellent)
 * - Ceres/Pallas/Juno/Vesta: ~0.05-0.1°/day → 3 days = ~0.15-0.3° error (excellent)
 * - Astrological aspects typically use 1-2° tolerance
 * - 3 days provides best accuracy while minimizing computation costs
 * 
 * Cost Analysis (Firestore):
 * - Read: $0.06 per 100k reads
 * - Write: $0.18 per 100k writes
 * - Storage: $0.18 per GB/month
 * - Cache reduces expensive Swiss Ephemeris calculations (CPU/memory)
 * - 3 days = ~4x fewer calculations vs 1 day, ~10x fewer vs no cache
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ProEphemerisResponse } from '../api/types';

const CACHE_TTL_DAYS = 3; // Optimal: accuracy + cost efficiency
const COLLECTION_NAME = 'proEphemerisCache';

interface CacheEntry {
  extras: ProEphemerisResponse['extras'];
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

/**
 * Get cached result if available and not expired
 */
export async function getCached(
  cacheKey: string
): Promise<ProEphemerisResponse['extras'] | null> {
  const db = getFirestore();
  const docRef = db.collection(COLLECTION_NAME).doc(cacheKey);
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as CacheEntry;
  const now = Timestamp.now();

  // Check if expired
  if (data.expiresAt.toMillis() < now.toMillis()) {
    // Delete expired entry
    await docRef.delete().catch(() => {
      // Ignore delete errors
    });
    return null;
  }

  return data.extras;
}

/**
 * Store result in cache
 */
export async function setCached(
  cacheKey: string,
  extras: ProEphemerisResponse['extras']
): Promise<void> {
  const db = getFirestore();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
    now.toMillis() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const entry: CacheEntry = {
    extras,
    createdAt: now,
    expiresAt,
  };

  await db.collection(COLLECTION_NAME).doc(cacheKey).set(entry);
}

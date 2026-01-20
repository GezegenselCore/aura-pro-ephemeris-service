/**
 * Rate limiting for ephemeris requests
 * Limit: 100 requests per day per user (configurable via env)
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const COLLECTION_NAME = 'proRate';
const DEFAULT_LIMIT = 100;
const TTL_DAYS = 2;

/**
 * Check and increment rate limit counter
 * Throws HttpsError('resource-exhausted') if limit exceeded
 */
export async function checkRateLimit(uid: string): Promise<void> {
  const limit = parseInt(process.env.RATE_LIMIT_PER_DAY || String(DEFAULT_LIMIT), 10);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const docId = `${uid}_${today}`;

  const db = getFirestore();
  const docRef = db.collection(COLLECTION_NAME).doc(docId);

  // Atomic increment with transaction
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef);

    if (!doc.exists) {
      // First request today
      const expiresAt = Timestamp.fromMillis(
        Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000
      );
      transaction.set(docRef, {
        count: 1,
        updatedAt: Timestamp.now(),
        expiresAt,
      });
      return;
    }

    const data = doc.data();
    const currentCount = data?.count || 0;

    if (currentCount >= limit) {
      throw new HttpsError(
        'resource-exhausted',
        `Rate limit exceeded: ${limit} requests per day`
      );
    }

    // Increment counter
    transaction.update(docRef, {
      count: currentCount + 1,
      updatedAt: Timestamp.now(),
    });
  });
}

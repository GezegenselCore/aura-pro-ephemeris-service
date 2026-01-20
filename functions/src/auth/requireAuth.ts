/**
 * Auth middleware for callable functions
 */

import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';

/**
 * Require authenticated user
 * Throws HttpsError('unauthenticated') if no auth context
 */
export function requireAuth<T>(request: CallableRequest<T>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }
  return uid;
}

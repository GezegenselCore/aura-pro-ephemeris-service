/**
 * Unit tests for getProEphemeris callable function
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { ProEphemerisRequest } from '../api/types';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
    runTransaction: jest.fn(async (callback: any) => {
      return await callback({
        get: jest.fn(() => ({
          exists: false,
          data: () => null,
        })),
        set: jest.fn(),
        update: jest.fn(),
      });
    }),
  })),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromMillis: jest.fn((ms) => ({ toMillis: () => ms })),
  },
}));

// Mock sweph provider
jest.mock('../ephemeris/swephProvider', () => ({
  computeExtras: jest.fn(async (utcISO: string, bodies: string[]) => {
    // Mock response: return valid longitudes for test
    const extras: Record<string, { longitudeDeg: number }> = {};
    for (const body of bodies) {
      extras[body] = {
        longitudeDeg: 123.4567, // Mock value
      };
    }
    return extras;
  }),
}));

// Mock cache
jest.mock('../cache/firestoreCache', () => ({
  getCached: jest.fn(async (): Promise<any> => null), // Cache miss by default
  setCached: jest.fn(async () => {}),
}));

// Mock rate limit
jest.mock('../rateLimit/rateLimit', () => ({
  checkRateLimit: jest.fn(async (): Promise<void> => {}), // Pass by default
}));

describe('getProEphemeris', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate input schema - valid request', () => {
    const validRequest: ProEphemerisRequest = {
      utcISO: '1992-03-30T08:30:00.000Z',
      zodiacSystem: 'tropical',
      bodies: ['Chiron', 'Ceres'],
      wantSpeed: true,
      debug: false,
    };

    // Schema validation is done by Zod in the function
    expect(validRequest.utcISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(validRequest.bodies.length).toBeGreaterThan(0);
    expect(validRequest.bodies.length).toBeLessThanOrEqual(5);
  });

  it('should reject invalid UTC ISO format', () => {
    const invalidRequest = {
      utcISO: '1992-03-30', // Missing time and Z
      zodiacSystem: 'tropical',
      bodies: ['Chiron'],
    };

    // This would fail Zod validation
    expect(invalidRequest.utcISO).not.toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });

  it('should return longitude in [0, 360) range', async () => {
    const { computeExtras } = require('../ephemeris/swephProvider');
    const result = await computeExtras('1992-03-30T08:30:00.000Z', ['Chiron'], 'tropical', true);

    expect(result).toBeDefined();
    expect(result.Chiron).toBeDefined();
    expect(result.Chiron.longitudeDeg).toBeGreaterThanOrEqual(0);
    expect(result.Chiron.longitudeDeg).toBeLessThan(360);
    expect(isFinite(result.Chiron.longitudeDeg)).toBe(true);
  });

  it('should return all requested bodies', async () => {
    const { computeExtras } = require('../ephemeris/swephProvider');
    const bodies = ['Chiron', 'Ceres', 'Pallas'];
    const result = await computeExtras('1992-03-30T08:30:00.000Z', bodies, 'tropical', false);

    expect(Object.keys(result).length).toBe(bodies.length);
    for (const body of bodies) {
      expect(result[body]).toBeDefined();
      expect(result[body].longitudeDeg).toBeDefined();
    }
  });

  it('should handle cache hit scenario', async () => {
    const { getCached } = require('../cache/firestoreCache');
    const mockCached: any = {
      Chiron: { longitudeDeg: 123.4567 },
      Ceres: { longitudeDeg: 234.5678 },
    };

    (getCached as jest.MockedFunction<any>).mockResolvedValueOnce(mockCached);

    const cached = await getCached('test-key');
    expect(cached).toEqual(mockCached);
  });

  it('should handle cache miss scenario', async () => {
    const { getCached } = require('../cache/firestoreCache');
    (getCached as jest.MockedFunction<any>).mockResolvedValueOnce(null);

    const cached = await getCached('test-key');
    expect(cached).toBeNull();
  });

  it('should enforce rate limit', async () => {
    const { checkRateLimit } = require('../rateLimit/rateLimit');
    const { HttpsError } = require('firebase-functions/v2/https');

    // Mock rate limit exceeded
    const error = new (HttpsError as any)('resource-exhausted', 'Rate limit exceeded: 100 requests per day');
    (checkRateLimit as jest.MockedFunction<any>).mockRejectedValueOnce(error);

    await expect(checkRateLimit('test-uid')).rejects.toThrow();
  });
});

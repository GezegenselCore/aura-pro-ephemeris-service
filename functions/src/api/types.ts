/**
 * API Types for getProEphemeris callable function
 */

import { z } from 'zod';

export const ProEphemerisRequestSchema = z.object({
  utcISO: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, {
    message: 'utcISO must be ISO 8601 format with Z timezone',
  }),
  zodiacSystem: z.enum(['tropical', 'sidereal_lahiri']),
  bodies: z
    .array(z.enum(['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta']))
    .min(1, 'At least one body required')
    .max(5, 'Maximum 5 bodies allowed'),
  wantSpeed: z.boolean().optional().default(true),
  debug: z.boolean().optional().default(false),
});

export type ProEphemerisRequest = z.infer<typeof ProEphemerisRequestSchema>;

export interface ProEphemerisResponse {
  extras: Record<
    string,
    {
      longitudeDeg: number; // 0..360
      speedDegPerDay?: number; // optional if wantSpeed=true
      retrograde?: boolean; // optional if wantSpeed=true
    }
  >;
  meta: {
    provider: 'swisseph';
    cached: boolean;
    version: 'v1';
  };
}

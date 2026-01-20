/**
 * Body name to Swiss Ephemeris constant mapping
 * 
 * Swiss Ephemeris body constants (SE_* constants):
 * - Chiron (2060 Chiron): SE_CHIRON = 15
 * - Ceres (1 Ceres): SE_CERES = 4
 * - Pallas (2 Pallas): SE_PALLAS = 5
 * - Juno (3 Juno): SE_JUNO = 6
 * - Vesta (4 Vesta): SE_VESTA = 7
 * 
 * Reference: Swiss Ephemeris documentation
 */

export const BODY_NAMES = ['Chiron', 'Ceres', 'Pallas', 'Juno', 'Vesta'] as const;
export type BodyName = (typeof BODY_NAMES)[number];

/**
 * Map body name to Swiss Ephemeris body constant
 * 
 * @param bodyName - Body name (Chiron, Ceres, Pallas, Juno, Vesta)
 * @returns Swiss Ephemeris numeric constant for the body
 */
export function getSwephBodyConstant(bodyName: BodyName): number {
  // Swiss Ephemeris body constants (SE_* constants from sweph.h)
  const BODY_CONSTANTS: Record<BodyName, number> = {
    Chiron: 15, // SE_CHIRON (2060 Chiron)
    Ceres: 4,   // SE_CERES (1 Ceres)
    Pallas: 5, // SE_PALLAS (2 Pallas)
    Juno: 6,   // SE_JUNO (3 Juno)
    Vesta: 7,  // SE_VESTA (4 Vesta)
  };

  const constant = BODY_CONSTANTS[bodyName];
  if (constant === undefined) {
    throw new Error(`Unknown body name: ${bodyName}`);
  }

  return constant;
}

/**
 * Validate body name
 */
export function isValidBodyName(name: string): name is BodyName {
  return BODY_NAMES.includes(name as BodyName);
}

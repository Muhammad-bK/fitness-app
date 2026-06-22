const LBS_PER_KG = 2.2046226218;

export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function displayWeight(valueKg: number, unitPreference: 'kg' | 'lbs'): number {
  if (unitPreference === 'lbs') return kgToLbs(valueKg);
  return Math.round(valueKg * 10) / 10;
}

export function formatWeight(valueKg: number, unitPreference: 'kg' | 'lbs'): string {
  return `${displayWeight(valueKg, unitPreference)} ${unitPreference}`;
}

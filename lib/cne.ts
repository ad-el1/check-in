/** Normalisation CNE : toujours trim + uppercase avant lookup/insert. */
export function normalizeCne(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Validation format : 4 à 15 caractères alphanumériques. */
export function isValidCne(cne: string): boolean {
  return /^[A-Z0-9]{4,15}$/.test(cne);
}

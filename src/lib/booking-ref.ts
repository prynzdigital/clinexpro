/** Short, unambiguous booking reference, e.g. "CP-7KQ2ZM" (no 0/O or 1/I). */
export function bookingRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "CP-";
  for (const byte of crypto.getRandomValues(new Uint8Array(6))) out += alphabet[byte % alphabet.length];
  return out;
}

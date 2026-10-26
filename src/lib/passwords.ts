import "server-only";
import bcrypt from "bcryptjs";

export const PASSWORD_MIN_LENGTH = 10;

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** Easy to read out or type from a phone: no 0/O or 1/l/I. e.g. "kq7M-x3Tr-9bWp". */
export function temporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const chars = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => alphabet[b % alphabet.length]);
  return [chars.slice(0, 4), chars.slice(4, 8), chars.slice(8)].map((g) => g.join("")).join("-");
}

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "clinex_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

export type SessionPayload = { uid: number; email: string; name: string; role: string; ver: number };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is not set");
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    // Staff-app tokens are signed with the same secret; never accept one here.
    if (payload.kind !== undefined || typeof payload.uid !== "number") return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// --- Staff app (cleaners) ------------------------------------------------

export const STAFF_COOKIE = "clinex_staff";
/** Phones stay signed in for a month; a PIN change or deactivation ends it sooner. */
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export type StaffSessionPayload = { sid: number; ver: number };

export async function createStaffToken(payload: StaffSessionPayload) {
  return new SignJWT({ ...payload, kind: "staff" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STAFF_SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyStaffToken(token: string | undefined): Promise<StaffSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.kind !== "staff" || typeof payload.sid !== "number" || typeof payload.ver !== "number") return null;
    return { sid: payload.sid, ver: payload.ver };
  } catch {
    return null;
  }
}

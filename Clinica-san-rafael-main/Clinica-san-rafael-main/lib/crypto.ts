// lib/crypto.ts
import crypto from "crypto"

/**
 * Hashes a password using SHA-256 and a random salt
 * Output format: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto
    .createHash("sha256")
    .update(salt + password)
    .digest("hex")
  return `${salt}:${hash}`
}

/**
 * Verifies a password against a stored hash ("salt:hash") or legacy fallback
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!storedHashOrPlain) return false

  // If stored in "salt:hash" format
  if (storedHashOrPlain.includes(":")) {
    const [salt, originalHash] = storedHashOrPlain.split(":")
    const hash = crypto
      .createHash("sha256")
      .update(salt + password)
      .digest("hex")
    return hash === originalHash
  }

  // Legacy plain fallback for initial migration
  return password === storedHashOrPlain
}

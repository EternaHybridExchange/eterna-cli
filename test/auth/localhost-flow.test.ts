import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  computeCodeChallenge,
} from "../../src/auth/localhost-flow.js";

describe("PKCE", () => {
  it("generateCodeVerifier returns a 43-128 char base64url string", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("computeCodeChallenge returns a base64url SHA-256 hash", async () => {
    const verifier = "test-verifier-value-that-is-long-enough-here";
    const challenge = await computeCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    const challenge2 = await computeCodeChallenge(verifier);
    expect(challenge).toBe(challenge2);
  });
});

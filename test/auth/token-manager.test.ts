import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TokenManager } from "../../src/auth/token-manager.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("TokenManager", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eterna-test-"));
    vi.stubEnv("ETERNA_CONFIG_DIR", tmpDir);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("isAuthenticated returns false when no credentials exist", () => {
    const tm = new TokenManager();
    expect(tm.isAuthenticated()).toBe(false);
  });

  it("isAuthenticated returns true when valid credentials exist", () => {
    const tm = new TokenManager();
    tm.saveTokens({
      accessToken: "at_123",
      refreshToken: "rt_456",
      expiresIn: 900,
      clientId: "eterna-cli",
      resource: "https://ai-api.eterna.exchange",
    });
    expect(tm.isAuthenticated()).toBe(true);
  });

  it("getAccessToken returns null when no credentials exist", () => {
    const tm = new TokenManager();
    expect(tm.getAccessToken()).toBeNull();
  });

  it("getAccessToken returns the stored token when not expired", () => {
    const tm = new TokenManager();
    tm.saveTokens({
      accessToken: "at_valid",
      refreshToken: "rt_456",
      expiresIn: 900,
      clientId: "eterna-cli",
      resource: "https://ai-api.eterna.exchange",
    });
    expect(tm.getAccessToken()).toBe("at_valid");
  });

  it("needsRefresh returns true when token is within 60s of expiry", () => {
    const tm = new TokenManager();
    tm.saveTokens({
      accessToken: "at_expiring",
      refreshToken: "rt_456",
      expiresIn: 30,
      clientId: "eterna-cli",
      resource: "https://ai-api.eterna.exchange",
    });
    expect(tm.needsRefresh()).toBe(true);
  });
});

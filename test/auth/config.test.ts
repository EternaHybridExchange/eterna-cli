import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readConfig,
  writeConfig,
  getConfigDir,
  clearConfig,
} from "../../src/auth/config.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("config", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eterna-test-"));
    vi.stubEnv("ETERNA_CONFIG_DIR", tmpDir);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns default config when no file exists", () => {
    const config = readConfig();
    expect(config).toEqual({ endpoint: "https://ai-api.eterna.exchange" });
  });

  it("writes and reads config", () => {
    writeConfig({ endpoint: "https://custom.api.local" });
    const config = readConfig();
    expect(config.endpoint).toBe("https://custom.api.local");
  });

  it("getConfigDir respects ETERNA_CONFIG_DIR env var", () => {
    expect(getConfigDir()).toBe(tmpDir);
  });

  it("clearConfig removes the config file", () => {
    writeConfig({ endpoint: "https://example.com" });
    clearConfig();
    const config = readConfig();
    expect(config).toEqual({ endpoint: "https://ai-api.eterna.exchange" });
  });
});

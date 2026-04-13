import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ApiClient } from "../../src/api/client.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("ApiClient", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eterna-test-"));
    vi.stubEnv("ETERNA_CONFIG_DIR", tmpDir);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("throws when not authenticated", async () => {
    const client = new ApiClient();
    await expect(client.execute("code")).rejects.toThrow("Not authenticated");
  });
});

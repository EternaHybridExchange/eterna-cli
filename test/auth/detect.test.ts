import { describe, it, expect, vi, afterEach } from "vitest";
import { detectAuthFlow } from "../../src/auth/detect.js";

describe("detectAuthFlow", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 'device' when SSH_CLIENT is set", () => {
    vi.stubEnv("SSH_CLIENT", "192.168.1.1 54321 22");
    expect(detectAuthFlow(false)).toBe("device");
  });

  it("returns 'device' when SSH_TTY is set", () => {
    vi.stubEnv("SSH_TTY", "/dev/pts/0");
    expect(detectAuthFlow(false)).toBe("device");
  });

  it("returns 'device' when --no-browser flag is true", () => {
    expect(detectAuthFlow(true)).toBe("device");
  });

  it("returns 'localhost' when not SSH and browser available", () => {
    delete process.env.SSH_CLIENT;
    delete process.env.SSH_TTY;
    expect(detectAuthFlow(false)).toBe("localhost");
  });
});

import { describe, it, expect } from "vitest";
import { readCodeFromFile } from "../../src/commands/execute.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

describe("readCodeFromFile", () => {
  it("reads code from a file path", () => {
    const tmpFile = path.join(os.tmpdir(), "eterna-test-code.ts");
    fs.writeFileSync(tmpFile, "const x = eterna.getBalance();\n");
    try {
      const code = readCodeFromFile(tmpFile);
      expect(code).toBe("const x = eterna.getBalance();\n");
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("throws on non-existent file", () => {
    expect(() => readCodeFromFile("/tmp/eterna-nonexistent.ts")).toThrow();
  });
});

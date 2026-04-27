import { Command } from "commander";
import * as fs from "node:fs";
import { ApiClient } from "../api/client.js";
import { startSpinner, stopSpinner } from "../util/spinner.js";
import { formatExecutionResult } from "../util/format.js";

export function readCodeFromFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

export const executeCommand = new Command("execute")
  .description("Execute trading code in the Eterna sandbox")
  .argument("[file]", "TypeScript file to execute, or - for stdin")
  .option("-e, --eval <code>", "Execute inline code instead of a file")
  .action(async (file: string | undefined, opts: { eval?: string }) => {
    let code: string;

    if (opts.eval) {
      code = opts.eval;
    } else if (file === "-" || (!file && !process.stdin.isTTY)) {
      code = await readStdin();
    } else if (file) {
      code = await readCodeFromFile(file);
    } else {
      console.error(
        "Usage: eterna execute <file.ts>, eterna execute -e '<code>', or pipe via stdin",
      );
      process.exitCode = 1;
      return;
    }

    if (!code.trim()) {
      console.error("Error: empty code input");
      process.exitCode = 1;
      return;
    }

    const client = new ApiClient();
    startSpinner("Executing...");

    try {
      const result = await client.execute(code);
      stopSpinner(result.success, result.success ? "Done" : "Execution failed");
      console.log(formatExecutionResult(result));
      if (!result.success) process.exitCode = 1;
    } catch (err) {
      stopSpinner(false, "Failed");
      console.error((err as Error).message);
      process.exitCode = 1;
    }
  });

import { Command } from "commander";
import * as fs from "node:fs";
import { ApiClient } from "../api/client.js";
import { startSpinner, stopSpinner } from "../util/spinner.js";
import { formatExecutionResult } from "../util/format.js";

export async function readCodeFromFile(filePath: string): Promise<string> {
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
  .action(async (file?: string) => {
    let code: string;

    if (file === "-" || (!file && !process.stdin.isTTY)) {
      code = await readStdin();
    } else if (file) {
      code = await readCodeFromFile(file);
    } else {
      console.error("Usage: eterna execute <file.ts> or pipe code via stdin");
      process.exitCode = 1;
      return;
    }

    if (!code.trim()) {
      console.error("Error: empty code input");
      process.exitCode = 1;
      return;
    }

    const client = new ApiClient();
    const spinner = startSpinner("Executing...");

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

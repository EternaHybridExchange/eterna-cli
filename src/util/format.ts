import type { ExecutionResult } from "../api/client.js";

export function formatExecutionResult(result: ExecutionResult): string {
  const lines: string[] = [];

  if (result.success) {
    if (result.result !== undefined && result.result !== null) {
      lines.push(
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result, null, 2),
      );
    }
  } else {
    lines.push(`Error: ${result.error ?? "Unknown error"}`);
  }

  if (result.logs.length > 0) {
    lines.push("");
    lines.push("--- Logs ---");
    lines.push(...result.logs);
  }

  if (result.validationErrors && result.validationErrors.length > 0) {
    lines.push("");
    lines.push("--- Validation Errors ---");
    for (const ve of result.validationErrors) {
      lines.push(`  ${ve.field}: ${ve.message}`);
    }
  }

  lines.push("");
  lines.push(
    `(${result.stats.durationMs}ms, ${result.stats.apiCallsMade} API calls)`,
  );

  return lines.join("\n");
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

import { Command } from "commander";
import { ApiClient } from "../api/client.js";
import { startSpinner, stopSpinner } from "../util/spinner.js";
import { formatExecutionResult } from "../util/format.js";

export const positionsCommand = new Command("positions")
  .description("Get your open positions")
  .action(async () => {
    const client = new ApiClient();
    const spinner = startSpinner("Fetching positions...");

    try {
      const result = await client.execute(
        "const positions = await eterna.getPositions();\nreturn positions;",
      );
      stopSpinner(result.success, result.success ? "Done" : "Failed");
      console.log(formatExecutionResult(result));
      if (!result.success) process.exitCode = 1;
    } catch (err) {
      stopSpinner(false, "Failed");
      console.error((err as Error).message);
      process.exitCode = 1;
    }
  });

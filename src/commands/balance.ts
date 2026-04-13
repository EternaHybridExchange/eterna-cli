import { Command } from "commander";
import { ApiClient } from "../api/client.js";
import { startSpinner, stopSpinner } from "../util/spinner.js";
import { formatExecutionResult } from "../util/format.js";

export const balanceCommand = new Command("balance")
  .description("Get your account balance")
  .action(async () => {
    const client = new ApiClient();
    startSpinner("Fetching balance...");

    try {
      const result = await client.execute(
        "const balance = await eterna.getBalance();\nreturn balance;",
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

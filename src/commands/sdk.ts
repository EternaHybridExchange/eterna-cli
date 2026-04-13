import { Command } from "commander";
import { ApiClient } from "../api/client.js";

export const sdkCommand = new Command("sdk")
  .description("Browse the Eterna SDK reference")
  .option("--search <query>", "Search for SDK methods by keyword")
  .option(
    "--detail <level>",
    "Detail level: list, summary, full, params, keywords",
    "summary",
  )
  .action(async (opts: { search?: string; detail: string }) => {
    const client = new ApiClient();

    try {
      const result = await client.sdkSearch(opts.search, opts.detail);
      console.log(result.text);
    } catch (err) {
      console.error((err as Error).message);
      process.exitCode = 1;
    }
  });

import { Command } from "commander";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { executeCommand } from "./commands/execute.js";
import { sdkCommand } from "./commands/sdk.js";
import { balanceCommand } from "./commands/balance.js";
import { positionsCommand } from "./commands/positions.js";

const program = new Command();

program
  .name("eterna")
  .description("Eterna CLI — execute trading strategies from your terminal")
  .version("0.1.0");

program.addCommand(loginCommand);
program.addCommand(logoutCommand);
program.addCommand(executeCommand);
program.addCommand(sdkCommand);
program.addCommand(balanceCommand);
program.addCommand(positionsCommand);

program.parse();

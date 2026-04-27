import { Command } from "commander";
import { TokenManager } from "../auth/token-manager.js";
import { readCredentials, readConfig } from "../auth/config.js";

export const statusCommand = new Command("status")
  .description("Show authentication status")
  .action(async () => {
    const tokenManager = new TokenManager();
    const creds = readCredentials();

    if (!creds || !tokenManager.isAuthenticated()) {
      console.log("Not authenticated. Run `eterna login` to get started.");
      return;
    }

    const config = readConfig();
    const expired = tokenManager.needsRefresh();

    console.log(`Authenticated`);
    console.log(`  Endpoint:  ${config.endpoint}`);

    const expiresAt = new Date(creds.expiresAt);
    if (expired) {
      console.log(`  Token:     expired (${expiresAt.toLocaleString()})`);
    } else {
      const remaining = Math.round((creds.expiresAt - Date.now()) / 60_000);
      console.log(`  Token:     valid (expires in ${remaining}m)`);
    }
  });

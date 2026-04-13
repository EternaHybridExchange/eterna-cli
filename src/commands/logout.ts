import { Command } from "commander";
import { TokenManager } from "../auth/token-manager.js";

export const logoutCommand = new Command("logout")
  .description("Remove stored credentials")
  .action(() => {
    const tokenManager = new TokenManager();

    if (!tokenManager.isAuthenticated()) {
      console.log("Not currently authenticated.");
      return;
    }

    tokenManager.logout();
    console.log("Logged out. Credentials removed from ~/.eterna/");
  });

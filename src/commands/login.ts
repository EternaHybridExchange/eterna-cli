// src/commands/login.ts
import { Command } from "commander";
import open from "open";
import { detectAuthFlow } from "../auth/detect.js";
import {
  localhostAuthFlow,
  buildAuthorizationUrl,
  generateCodeVerifier,
  computeCodeChallenge,
} from "../auth/localhost-flow.js";
import { deviceCodeFlow } from "../auth/device-flow.js";
import { TokenManager } from "../auth/token-manager.js";
import { readConfig } from "../auth/config.js";
import { startSpinner, stopSpinner } from "../util/spinner.js";

const CLIENT_ID = "eterna-cli";

export const loginCommand = new Command("login")
  .description("Authenticate with Eterna")
  .option("--no-browser", "Use device code flow (no browser redirect)")
  .action(async (opts: { browser: boolean }) => {
    const tokenManager = new TokenManager();
    const config = readConfig();
    const resource = config.endpoint;

    if (tokenManager.isAuthenticated() && !tokenManager.needsRefresh()) {
      console.log(
        "Already authenticated. Use `eterna logout` first to re-authenticate.",
      );
      return;
    }

    const flowType = detectAuthFlow(!opts.browser);

    if (flowType === "localhost") {
      await loginWithLocalhost(resource, tokenManager);
    } else {
      await loginWithDeviceCode(resource, tokenManager);
    }
  });

async function loginWithLocalhost(
  resource: string,
  tokenManager: TokenManager,
): Promise<void> {
  const spinner = startSpinner("Opening browser for authentication...");

  try {
    const { randomBytes } = await import("node:crypto");
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);
    const state = randomBytes(16).toString("hex");
    const authUrl = buildAuthorizationUrl(codeChallenge, state, resource);

    await open(authUrl);
    stopSpinner(undefined);
    console.log("Waiting for authorization in browser...\n");

    const tokens = await localhostAuthFlow(resource);

    tokenManager.saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      clientId: CLIENT_ID,
      resource,
    });

    console.log("Logged in successfully!");
  } catch (err) {
    stopSpinner(false, "Authentication failed");
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}

async function loginWithDeviceCode(
  resource: string,
  tokenManager: TokenManager,
): Promise<void> {
  try {
    const tokens = await deviceCodeFlow(resource, {
      onUserCode: (userCode, _verificationUri, verificationUriComplete) => {
        console.log("");
        console.log("  To authenticate, visit:");
        console.log(`  ${verificationUriComplete}`);
        console.log("");
        console.log(`  Or go to the URL above and enter code: ${userCode}`);
        console.log("");
      },
      onPolling: () => {
        // Could show a spinner dot, but keeping it quiet
      },
    });

    tokenManager.saveTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      clientId: CLIENT_ID,
      resource,
    });

    console.log("Logged in successfully!");
  } catch (err) {
    console.error(`Authentication failed: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

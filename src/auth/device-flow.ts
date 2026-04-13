// src/auth/device-flow.ts
import { getAuthIssuer } from "./config.js";

const CLIENT_ID = "eterna-cli";
const SCOPE = "mcp:full";

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface DeviceFlowCallbacks {
  onUserCode: (
    userCode: string,
    verificationUri: string,
    verificationUriComplete: string,
  ) => void;
  onPolling: () => void;
}

export async function deviceCodeFlow(
  resource: string,
  callbacks: DeviceFlowCallbacks,
): Promise<TokenResponse> {
  const issuer = getAuthIssuer();

  const deviceRes = await fetch(`${issuer}/api/oauth/device/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: SCOPE,
      resource,
    }),
  });

  if (!deviceRes.ok) {
    const err = await deviceRes.json().catch(() => ({}));
    throw new Error(
      `Device code request failed: ${(err as Record<string, string>).error_description ?? deviceRes.statusText}`,
    );
  }

  const deviceData = (await deviceRes.json()) as DeviceCodeResponse;

  callbacks.onUserCode(
    deviceData.user_code,
    deviceData.verification_uri,
    deviceData.verification_uri_complete,
  );

  let interval = deviceData.interval * 1000;
  const deadline = Date.now() + deviceData.expires_in * 1000;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    callbacks.onPolling();

    const tokenRes = await fetch(`${issuer}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: deviceData.device_code,
        client_id: CLIENT_ID,
        resource,
      }).toString(),
    });

    if (tokenRes.ok) {
      return tokenRes.json() as Promise<TokenResponse>;
    }

    const err = (await tokenRes.json()) as {
      error: string;
      error_description?: string;
    };

    switch (err.error) {
      case "authorization_pending":
        continue;
      case "slow_down":
        interval += 5000;
        continue;
      case "expired_token":
        throw new Error("Device code expired. Please try again.");
      case "access_denied":
        throw new Error("Authorization denied by user.");
      default:
        throw new Error(
          `Unexpected error: ${err.error_description ?? err.error}`,
        );
    }
  }

  throw new Error("Device code expired. Please try again.");
}

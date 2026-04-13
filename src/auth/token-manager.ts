import {
  readCredentials,
  writeCredentials,
  clearCredentials,
  getAuthIssuer,
} from "./config.js";

const REFRESH_BUFFER_MS = 60_000;

export interface SaveTokenParams {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  clientId: string;
  resource: string;
}

export class TokenManager {
  isAuthenticated(): boolean {
    const creds = readCredentials();
    return creds !== null;
  }

  getAccessToken(): string | null {
    const creds = readCredentials();
    if (!creds) return null;
    return creds.accessToken;
  }

  needsRefresh(): boolean {
    const creds = readCredentials();
    if (!creds) return false;
    return Date.now() >= creds.expiresAt - REFRESH_BUFFER_MS;
  }

  saveTokens(params: SaveTokenParams): void {
    writeCredentials({
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresAt: Date.now() + params.expiresIn * 1000,
      clientId: params.clientId,
      resource: params.resource,
    });
  }

  async refreshIfNeeded(): Promise<string | null> {
    const creds = readCredentials();
    if (!creds) return null;

    if (!this.needsRefresh()) {
      return creds.accessToken;
    }

    const issuer = getAuthIssuer();
    const res = await fetch(`${issuer}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: creds.refreshToken,
        client_id: creds.clientId,
        resource: creds.resource,
      }).toString(),
    });

    if (!res.ok) {
      clearCredentials();
      return null;
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    this.saveTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      clientId: creds.clientId,
      resource: creds.resource,
    });

    return data.access_token;
  }

  logout(): void {
    clearCredentials();
  }
}

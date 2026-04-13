import { readConfig } from "../auth/config.js";
import { TokenManager } from "../auth/token-manager.js";

export interface ExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
  logs: string[];
  stats: {
    durationMs: number;
    apiCallsMade: number;
  };
  validationErrors?: Array<{ field: string; message: string }>;
}

export interface SdkSearchResult {
  text: string;
}

export class ApiClient {
  private tokenManager = new TokenManager();

  private async getAuthHeaders(): Promise<Record<string, string>> {
    let token = this.tokenManager.getAccessToken();

    if (!token || this.tokenManager.needsRefresh()) {
      token = await this.tokenManager.refreshIfNeeded();
    }

    if (!token) {
      throw new Error("Not authenticated. Run `eterna login` first.");
    }

    return { Authorization: `Bearer ${token}` };
  }

  private getBaseUrl(): string {
    return readConfig().endpoint;
  }

  async execute(code: string): Promise<ExecutionResult> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`${this.getBaseUrl()}/sandbox/execute`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (res.status === 401) {
      const newToken = await this.tokenManager.refreshIfNeeded();
      if (!newToken) {
        throw new Error(
          "Session expired. Run `eterna login` to re-authenticate.",
        );
      }
      const retryRes = await fetch(`${this.getBaseUrl()}/sandbox/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${newToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      if (!retryRes.ok) {
        throw new Error(`Execution failed: ${retryRes.statusText}`);
      }
      return retryRes.json() as Promise<ExecutionResult>;
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Execution failed (${res.status}): ${errBody}`);
    }

    return res.json() as Promise<ExecutionResult>;
  }

  async sdkSearch(
    query?: string,
    detailLevel: string = "summary",
  ): Promise<SdkSearchResult> {
    const params = new URLSearchParams({ detail_level: detailLevel });
    if (query) params.set("query", query);

    const res = await fetch(
      `${this.getBaseUrl()}/sdk/search?${params.toString()}`,
    );

    if (!res.ok) {
      throw new Error(`SDK search failed (${res.status}): ${res.statusText}`);
    }

    return res.json() as Promise<SdkSearchResult>;
  }
}

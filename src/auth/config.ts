import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const DEFAULT_ENDPOINT = "https://ai-api.eterna.exchange";
const AUTH_ISSUER = "https://ai-auth.eterna.exchange";
const DEFAULT_MCP_ENDPOINT = "https://mcp.eterna.exchange";

export interface EternaConfig {
  endpoint: string;
}

export interface EternaCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  clientId: string;
  resource: string;
}

export function getConfigDir(): string {
  return process.env.ETERNA_CONFIG_DIR ?? path.join(os.homedir(), ".eterna");
}

export function getAuthIssuer(): string {
  return process.env.ETERNA_AUTH_ISSUER ?? AUTH_ISSUER;
}

export function getMcpEndpoint(): string {
  const raw = process.env.ETERNA_MCP_URL
    ?? (process.env.ETERNA_ENDPOINT ?? DEFAULT_ENDPOINT).replace("ai-api.", "mcp.");
  // Strip trailing /mcp if present — users sometimes copy the full MCP protocol
  // URL from their Claude config (e.g. https://mcp.eterna.exchange/mcp), but
  // REST endpoints like /migrate/link-legacy-key live at the base URL.
  return raw.replace(/\/mcp$/, "");
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function readConfig(): EternaConfig {
  if (process.env.ETERNA_ENDPOINT) {
    return { endpoint: process.env.ETERNA_ENDPOINT };
  }
  const configPath = path.join(getConfigDir(), "config.json");
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<EternaConfig>;
    return {
      endpoint: parsed.endpoint ?? DEFAULT_ENDPOINT,
    };
  } catch {
    return { endpoint: DEFAULT_ENDPOINT };
  }
}

export function writeConfig(config: Partial<EternaConfig>): void {
  ensureConfigDir();
  const existing = readConfig();
  const merged = { ...existing, ...config };
  const configPath = path.join(getConfigDir(), "config.json");
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", {
    mode: 0o600,
  });
}

export function readCredentials(): EternaCredentials | null {
  const credPath = path.join(getConfigDir(), "credentials.json");
  try {
    const raw = fs.readFileSync(credPath, "utf-8");
    const parsed = JSON.parse(raw) as EternaCredentials;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCredentials(creds: EternaCredentials): void {
  ensureConfigDir();
  const credPath = path.join(getConfigDir(), "credentials.json");
  fs.writeFileSync(credPath, JSON.stringify(creds, null, 2) + "\n", {
    mode: 0o600,
  });
}

export function clearConfig(): void {
  const configPath = path.join(getConfigDir(), "config.json");
  const credPath = path.join(getConfigDir(), "credentials.json");
  try {
    fs.unlinkSync(configPath);
  } catch {
    /* ignore */
  }
  try {
    fs.unlinkSync(credPath);
  } catch {
    /* ignore */
  }
}

export function clearCredentials(): void {
  const credPath = path.join(getConfigDir(), "credentials.json");
  try {
    fs.unlinkSync(credPath);
  } catch {
    /* ignore */
  }
}

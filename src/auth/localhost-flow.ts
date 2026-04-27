import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes, createHash } from "node:crypto";
import open from "open";
import { getAuthIssuer } from "./config.js";

const CLIENT_ID = "eterna-cli";
const CALLBACK_PORT = 9876;
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`;
const SCOPE = "mcp:full";

function callbackPage(title: string, message: string, success: boolean): string {
  const iconColor = success ? "#a299ff" : "#f87171";
  const icon = success ? "&#10003;" : "&#10007;";
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Eterna CLI</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:"JetBrains Mono",monospace;background:#000;color:#fff;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:1rem}
.card{text-align:center;padding:3rem 2.5rem;background:#0c0c0c;
  border:1px solid #1a1a1a;max-width:28rem;width:100%;
  transition:border-color .2s}
.card:hover{border-color:rgba(255,255,255,.1)}
.icon{font-size:2.5rem;width:64px;height:64px;line-height:64px;
  color:${iconColor};margin:0 auto 2rem;display:block;letter-spacing:-0.05em}
h1{font-size:1.25rem;margin-bottom:0.75rem;color:#fff;font-weight:700;
  letter-spacing:0.02em}
p{color:#b0b0b0;line-height:1.6;font-size:0.875rem}
.brand{margin-top:2.5rem;font-size:0.625rem;color:#555;
  letter-spacing:0.1em;text-transform:uppercase;font-weight:500}
</style></head>
<body><div class="card">
  <span class="icon">${icon}</span>
  <h1>${title}</h1>
  <p>${message}</p>
  <div class="brand">Eterna</div>
</div></body></html>`;
}

export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export async function computeCodeChallenge(verifier: string): Promise<string> {
  const hash = createHash("sha256").update(verifier).digest();
  return hash.toString("base64url");
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

function buildAuthorizationUrl(
  codeChallenge: string,
  state: string,
  resource: string,
): string {
  const issuer = getAuthIssuer();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    resource,
  });
  return `${issuer}/oauth/authorize?${params.toString()}`;
}

export async function localhostAuthFlow(
  resource: string,
): Promise<TokenResponse> {
  const issuer = getAuthIssuer();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  const state = randomBytes(16).toString("hex");

  // Build auth URL and start callback server before opening browser
  const authUrl = buildAuthorizationUrl(codeChallenge, state, resource);

  const { code, receivedState } = await new Promise<{
    code: string;
    receivedState: string;
  }>((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${CALLBACK_PORT}`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const receivedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(callbackPage("Authorization Failed", "Something went wrong. You can close this window.", false));
          server.closeAllConnections();
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code || !receivedState) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(callbackPage("Missing Parameters", "The callback was missing required parameters.", false));
          server.closeAllConnections();
          server.close();
          reject(new Error("Missing code or state in callback"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(callbackPage("Authorized!", "You can close this window and return to your terminal.", true), () => {
          server.closeAllConnections();
          server.close();
        });
        resolve({ code, receivedState });
      }
    });

    server.listen(CALLBACK_PORT, "127.0.0.1", () => {
      // Server ready — open browser with the same PKCE state
      open(authUrl).catch(() => {
        server.close();
        reject(new Error("Failed to open browser"));
      });
    });

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 300_000);
    timeout.unref();
  });

  if (receivedState !== state) {
    throw new Error("State mismatch — possible CSRF attack");
  }

  const tokenUrl = `${issuer}/api/oauth/token`;
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
    resource,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(
      `Token exchange failed: ${(err as Record<string, string>).error_description ?? tokenRes.statusText}`,
    );
  }

  return tokenRes.json() as Promise<TokenResponse>;
}

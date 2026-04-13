import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { getAuthIssuer } from "./config.js";

const CLIENT_ID = "eterna-cli";
const CALLBACK_PORT = 9876;
const REDIRECT_URI = `http://127.0.0.1:${CALLBACK_PORT}/callback`;
const SCOPE = "mcp:full";

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

export async function localhostAuthFlow(
  resource: string,
): Promise<TokenResponse> {
  const issuer = getAuthIssuer();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  const state = randomBytes(16).toString("hex");

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
          res.end(
            "<html><body><h1>Authorization Failed</h1><p>You can close this window.</p></body></html>",
          );
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code || !receivedState) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<html><body><h1>Missing parameters</h1></body></html>");
          server.close();
          reject(new Error("Missing code or state in callback"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body><h1>Authorized!</h1><p>You can close this window and return to your terminal.</p></body></html>",
        );
        server.close();
        resolve({ code, receivedState });
      }
    });

    server.listen(CALLBACK_PORT, "127.0.0.1", () => {
      // Server ready
    });

    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 5 minutes"));
    }, 300_000);
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

export function buildAuthorizationUrl(
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

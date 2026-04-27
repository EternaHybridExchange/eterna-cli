import { getMcpEndpoint } from "./config.js";
import { LinkResultSchema } from "./validation.js";

const LINK_TIMEOUT_MS = 10_000;

/**
 * Links a legacy mcp-gateway API key to the caller's OAuth identity.
 * Called automatically by `eterna login` when ETERNA_MCP_KEY is set.
 *
 * After linking, the existing Bybit subaccount is preserved — mcp-gateway
 * resolves the OAuth JWT to the same agent row instead of creating a new one.
 */
export async function linkLegacyKey(
  accessToken: string,
  legacyApiKey: string,
): Promise<void> {
  const mcpEndpoint = getMcpEndpoint();

  let res: Response;
  try {
    res = await fetch(`${mcpEndpoint}/migrate/link-legacy-key`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ legacyApiKey }),
      signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
    });
  } catch {
    console.warn(
      "Warning: Could not reach mcp-gateway to link legacy key — your existing Bybit subaccount may not be preserved.",
    );
    return;
  }

  if (res.ok) {
    const result = LinkResultSchema.safeParse(await res.json());
    if (!result.success) {
      console.warn(
        "Warning: Unexpected response from mcp-gateway link endpoint",
      );
      return;
    }
    if (result.data.linked) {
      console.log(
        `✓ Legacy account linked — existing Bybit subaccount preserved`,
      );
    } else {
      console.log(`✓ Account already linked`);
    }
    return;
  }

  if (res.status === 409) {
    console.warn(
      "Warning: Legacy key is already linked to a different OAuth account",
    );
    return;
  }

  const errText = await res.text().catch(() => res.statusText);
  console.warn(`Warning: Could not link legacy key (${res.status}): ${errText}`);
}

export type AuthFlowType = "localhost" | "device";

export function detectAuthFlow(noBrowser: boolean): AuthFlowType {
  if (noBrowser) return "device";
  if (process.env.SSH_CLIENT || process.env.SSH_TTY) return "device";
  return "localhost";
}

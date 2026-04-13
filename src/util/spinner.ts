import ora, { type Ora } from "ora";

let activeSpinner: Ora | null = null;

export function startSpinner(text: string): Ora {
  activeSpinner = ora(text).start();
  return activeSpinner;
}

export function stopSpinner(success?: boolean, text?: string): void {
  if (!activeSpinner) return;
  if (success === true) {
    activeSpinner.succeed(text);
  } else if (success === false) {
    activeSpinner.fail(text);
  } else {
    activeSpinner.stop();
  }
  activeSpinner = null;
}

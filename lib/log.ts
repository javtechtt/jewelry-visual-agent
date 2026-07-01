// Single hook point for error reporting. Today it logs to the console so
// failures aren't swallowed silently; swap the body to forward to a monitoring
// backend (Sentry/Datadog/etc.) in production — one place to wire it.

export function reportError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  // eslint-disable-next-line no-console
  console.error(`[aurelis:${scope}]`, message);
  // TODO(production): forward to Sentry/Datadog/your monitoring backend.
}

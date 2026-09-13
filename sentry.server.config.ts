import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: dsn || undefined,
  // No DSN = SDK installed but inert. Nothing leaves the machine.
  tracesSampleRate: 0.1,
  debug: false,
});

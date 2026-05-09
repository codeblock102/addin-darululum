import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const env = (import.meta.env.MODE || "development") as string;

export function initSentry() {
  if (!dsn) {
    if (env === "production") {
      console.warn("Sentry DSN not configured — production errors will not be captured");
    }
    return;
  }
  Sentry.init({
    dsn,
    environment: env,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send dev errors
      if (env === "development") return null;
      return event;
    },
  });
}

export { Sentry };

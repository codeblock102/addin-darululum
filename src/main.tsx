/**
 * @file src/main.tsx
 * @summary This is the main entry point for the React application.
 *
 * It sets up the root of the React application by:
 * 1. Importing the main `App` component.
 * 2. Importing global styles from `index.css`.
 * 3. Importing and wrapping the `App` component with necessary context providers:
 *    - `QueryClientProvider`: For `react-query`, enabling server state management (caching, refetching, etc.).
 *    - `AuthProvider`: For managing authentication state and user information across the application.
 * 4. Rendering the root component into the DOM element with the ID "root" (typically in `index.html`).
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/contexts/AuthContext.tsx";
import { I18nProvider } from "@/contexts/I18nContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Apply the React patch to filter out data-lov-id attributes
import "@/lib/reactPatches.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AuthProvider>
  </QueryClientProvider>,
);

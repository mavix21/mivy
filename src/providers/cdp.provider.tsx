"use client";

import { CDPReactProvider, type Config, type Theme } from "@coinbase/cdp-react";
import { env } from "@/lib/env";
import { CDPHooksProvider } from "@coinbase/cdp-hooks";
import { authClient } from "@/lib/auth-client";

const config: Config = {
  projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID,
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "Mivy",
  appLogoUrl: "",
  showCoinbaseFooter: true,
  customAuth: {
    getJwt: async () => {
      const { data, error } = await authClient.token();
      console.log("Fetched auth token", { data, error });
      if (error || !data?.token) {
        console.error("Error fetching auth token", error);
        throw new Error("Unable to fetch auth token", { cause: error });
      }
      return data.token;
    },
  },
};

const theme: Partial<Theme> = {
  "colors-bg-default": "#0a0b0d",
  "colors-bg-alternate": "#22252d",
  "colors-bg-primary": "#ec8c68",
  "colors-bg-secondary": "#22252d",
  "colors-fg-default": "#ffffff",
  "colors-fg-muted": "#8a919e",
  "colors-fg-primary": "#ec8c68",
  "colors-fg-onPrimary": "#0a0b0d",
  "colors-fg-onSecondary": "#ffffff",
  "colors-fg-positive": "#27ad75",
  "colors-fg-negative": "#f0616d",
  "colors-fg-warning": "#ed702f",
  "colors-line-default": "#252629",
  "colors-line-heavy": "#5a5d6a",
  "borderRadius-cta": "var(--cdp-web-borderRadus-full)",
  "borderRadius-link": "var(--cdp-web-borderRadius-full)",
  "borderRadius-input": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-trigger": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-select-list": "var(--cdp-web-borderRadius-lg)",
  "borderRadius-modal": "var(--cdp-web-borderRadius-xl)",
  "font-family-sans": "'Rethink Sans', 'Rethink Sans Fallback'",
};

export function CDPProvider({ children }: { children: React.ReactNode }) {
  return (
    <CDPReactProvider config={config} theme={theme}>
      <CDPHooksProvider
        config={{
          projectId: env.NEXT_PUBLIC_CDP_PROJECT_ID,
        }}
      >
        {children}
      </CDPHooksProvider>
    </CDPReactProvider>
  );
}

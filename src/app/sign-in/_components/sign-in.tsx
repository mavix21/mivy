"use client";

import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";

/**
 * Sign in screen
 */
export default function SignInScreen() {
  return (
    <main className="flex w-full max-w-[30rem] flex-col items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-8 text-center text-card-foreground">
      <h1 className="sr-only">Sign in</h1>
      <p className="text-xl font-medium leading-tight">Welcome!</p>
      <p>Please sign in to continue.</p>
      <AuthButton />
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser, useSignInWithOAuth } from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";

/**
 * Sign in screen
 */
export default function SignInScreen() {
  const { signInWithOAuth } = useSignInWithOAuth();
  const { currentUser } = useCurrentUser();

  const handleGoogleSignIn = async () => {
    // User will be redirected to Google to complete their login
    // After login, they will be redirected back to your app, and the login
    // process will be completed automatically by the SDK
    await signInWithOAuth("google");

    console.log("Current user");
    console.log({ currentUser });
  };

  return (
    <main className="flex w-full max-w-[30rem] flex-col items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-8 text-center text-card-foreground">
      <h1 className="sr-only">Sign in</h1>
      <p className="text-xl font-medium leading-tight">Welcome!</p>
      <p>Please sign in to continue.</p>
      <AuthButton />
      <Button onClick={handleGoogleSignIn}>Sign In With Google</Button>
    </main>
  );
}

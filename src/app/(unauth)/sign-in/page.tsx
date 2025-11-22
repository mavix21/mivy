"use client";

import { useIsSignedIn } from "@coinbase/cdp-hooks";
import SignInScreen from "./_components/sign-in";

export default function AuthComponent() {
  const { isSignedIn } = useIsSignedIn();

  return (
    <div className="flex h-svh w-full items-center justify-center p-4">
      {isSignedIn ? <div>Welcome! You're signed in.</div> : <SignInScreen />}
    </div>
  );
}

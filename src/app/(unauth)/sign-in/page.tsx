"use client";

import { useCurrentUser, useIsSignedIn } from "@coinbase/cdp-hooks";
import SignInScreen from "./_components/sign-in";

export default function AuthComponent() {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      {isSignedIn ? <div>Welcome! You're signed in.</div> : <SignInScreen />}
    </div>
  );
}

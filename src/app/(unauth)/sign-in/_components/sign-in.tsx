"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import {
  useAuthenticateWithJWT,
  useCurrentUser,
  useSignInWithOAuth,
} from "@coinbase/cdp-hooks";
import { AuthButton } from "@coinbase/cdp-react/components/AuthButton";
import { Wallet } from "lucide-react";
import { useEffect } from "react";

/**
 * Sign in screen
 */
export default function SignInScreen() {
  const { authenticateWithJWT } = useAuthenticateWithJWT();
  const { signIn, useSession } = authClient;
  const { isPending, data: session } = useSession();

  const handleGoogleSignIn = async () => {
    // User will be redirected to Google to complete their login
    // After login, they will be redirected back to your app, and the login
    // process will be completed automatically by the SDK
    // await signInWithOAuth("google");
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  useEffect(() => {
    if (session) {
      authenticateWithJWT().catch((error) => {
        console.error("Error authenticating with JWT", error);
      });
    }
  }, [session, authenticateWithJWT]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to mivy
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              The web3 platform for creators
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="[&>button]:w-full [&>button]:h-10 [&>button]:rounded-md [&>button]:font-medium">
              {/* <AuthButton /> */}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full h-10 gap-2"
            >
              <svg
                className="h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <p>
            By connecting your wallet, you agree to our{" "}
            <a href="#" className="underline hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

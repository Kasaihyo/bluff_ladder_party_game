"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useEffect, useState } from "react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto sign in anonymously
  useEffect(() => {
    if (!isSigningIn) {
      setIsSigningIn(true);
      console.log('🎮 Starting anonymous sign-in...');
      
      signIn("anonymous")
        .then(() => {
          console.log('✅ Anonymous sign-in successful!');
        })
        .catch((error) => {
          console.error("❌ Failed to sign in anonymously:", error);
          setIsSigningIn(false);
        });
    }
  }, [signIn, isSigningIn]);

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="text-6xl animate-bounce">🎮</div>
      <h2 className="text-2xl font-bold text-gray-700">Signing you in...</h2>
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-75"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse delay-150"></div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        No login required - just jump in and play!
      </p>
    </div>
  );
}

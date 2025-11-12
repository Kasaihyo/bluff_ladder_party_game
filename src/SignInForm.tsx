"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    console.log('🎮 Starting anonymous sign-in...');
    
    try {
      await signIn("anonymous");
      console.log('✅ Anonymous sign-in successful!');
    } catch (error) {
      console.error("❌ Failed to sign in anonymously:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="text-6xl">🎮</div>
      <h2 className="text-2xl font-bold text-gray-700">Welcome to Bluff Ladder!</h2>
      <p className="text-sm text-gray-500 text-center">
        No login required - just jump in and play!
      </p>
      <button
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSigningIn ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Signing in...
          </span>
        ) : (
          "Start Playing"
        )}
      </button>
    </div>
  );
}

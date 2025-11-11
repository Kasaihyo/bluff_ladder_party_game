import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { MainMonitor } from "./components/MainMonitor";
import { PhoneController } from "./components/PhoneController";
import { useState } from "react";

export default function App() {
  const [view, setView] = useState<"main" | "phone">("main");
  const urlParams = new URLSearchParams(window.location.search);
  const joinCode = urlParams.get("code");

  if (joinCode) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Authenticated>
          <PhoneController joinCode={joinCode} />
        </Authenticated>
        <Unauthenticated>
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <h1 className="text-3xl font-bold text-center mb-6">Join Game</h1>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">Bluff Ladder</h2>
        <div className="flex items-center gap-4">
          <Authenticated>
            <div className="flex gap-2">
              <button
                onClick={() => setView("main")}
                className={`px-3 py-1 rounded text-sm ${
                  view === "main"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Main Monitor
              </button>
              <button
                onClick={() => setView("phone")}
                className={`px-3 py-1 rounded text-sm ${
                  view === "phone"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Phone View
              </button>
            </div>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <Authenticated>
          {view === "main" ? <MainMonitor /> : <PhoneController />}
        </Authenticated>
        <Unauthenticated>
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-primary mb-4">
                Bluff Ladder
              </h1>
              <p className="text-xl text-secondary">
                The party game where you can win by being right... or by lying convincingly
              </p>
            </div>
            <SignInForm />
          </div>
        </Unauthenticated>
      </main>
      <Toaster />
    </div>
  );
}

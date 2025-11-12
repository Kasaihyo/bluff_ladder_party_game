import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ VITE_CONVEX_URL is not defined!");
  console.error("Environment variables:", import.meta.env);
  throw new Error(
    "Missing VITE_CONVEX_URL environment variable. " +
    "Please set it in your Cloudflare Pages build settings to: https://colorless-swordfish-74.convex.cloud"
  );
}

const convex = new ConvexReactClient(CONVEX_URL);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>,
);

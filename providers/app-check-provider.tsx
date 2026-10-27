// providers/app-check-provider.tsx
"use client";

import { useEffect } from "react";
import { initAppCheck } from "@/lib/client/firebase-app-check";

export function AppCheckProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialise App Check en tenant compte de la variable d'activation
    initAppCheck();
  }, []);

  return <>{children}</>;
}
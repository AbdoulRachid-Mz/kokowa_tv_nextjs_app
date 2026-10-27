// components/providers/app-check-provider.tsx
"use client";

import { useEffect } from "react";
import { initAppCheck } from "@/lib/client/firebase-app-check";

export function AppCheckProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialisation après le montage client (DOM et window disponibles)
    initAppCheck();
  }, []);

  return <>{children}</>;
}

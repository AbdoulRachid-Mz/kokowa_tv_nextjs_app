"use client";

import React from "react";
import { useRouter } from "next/router";

const NotFound: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-textPrimary">404</h1>
        <p className="mt-4 text-xl text-textSecondary">Page non trouvée</p>
        <p className="mt-2 text-textTertiary">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-block px-6 p`y-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export default NotFound;

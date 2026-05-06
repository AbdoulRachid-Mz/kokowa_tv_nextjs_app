import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { getCompleteUserData } from "@/lib/server/auth-utils";

const COOKIE_NAME = "firebase_session";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    // ❌ pas de cookie → user null proprement
    if (!sessionCookie) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { user: null, error: "Firebase admin non initialisé" },
        { status: 500 }
      );
    }

    // 🔐 Vérification Firebase session
    const decoded = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // 👤 user Firebase minimal
    const firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };

    // 🧠 user métier (Postgres + merge Firebase)
    const user = await getCompleteUserData(decoded.uid, firebaseUser);

    return NextResponse.json({
      authenticated: true,
      user,
      firebase: firebaseUser,
      role: user?.role || "user",
      success: true,
    });
  } catch (error) {
    console.error("SESSION API ERROR:", error);

    // 🔥 cookie invalide → on nettoie implicitement côté client
    return NextResponse.json(
      {
        user: null,
        authenticated: false,
        error: "SESSION_INVALID",
      },
      { status: 200 }
    );
  }
}
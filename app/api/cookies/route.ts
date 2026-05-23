// API Route
// https://nextjs.org/docs/api-routes/introduction
import { getAllCookies } from "@/actions/cookies";
import { NextResponse } from "next/server";

export async function GET() {
    const cookies = await getAllCookies();
  return NextResponse.json({ cookies });
}

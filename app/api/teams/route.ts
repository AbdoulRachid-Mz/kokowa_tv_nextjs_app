import { NextRequest, NextResponse } from "next/server";
import { getTeamMembers, createTeamMember } from "@/actions/teams";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const is_active = searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined;
    const is_lead = searchParams.get("is_lead") === "true" ? true : undefined;
    const role = searchParams.get("role") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getTeamMembers({
      search,
      is_active,
      is_lead,
      role,
      page,
      limit,
      with_achievements: searchParams.get("with_achievements") === "true"
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Teams GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createTeamMember(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API Teams POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

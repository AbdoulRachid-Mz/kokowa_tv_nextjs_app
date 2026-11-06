import { withLightInstrumentation } from "@/lib/server/api-handler";
import { NextResponse } from "next/server";
import { getMobileTeamMembers } from "@/actions/mobile/teams";

export const GET = withLightInstrumentation(async () => {
  try {
    const result = await getMobileTeamMembers();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    return NextResponse.json(result, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
  } catch (error) {
    console.error("API Mobile Teams GET error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error",
      data: null 
    }, { status: 500 });
  }
});

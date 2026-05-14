import { NextResponse } from "next/server";
import { getMobileTeamMembers } from "@/actions/mobile/teams";

export async function GET() {
  try {
    const result = await getMobileTeamMembers();
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Mobile Teams GET error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error",
      data: null 
    }, { status: 500 });
  }
}

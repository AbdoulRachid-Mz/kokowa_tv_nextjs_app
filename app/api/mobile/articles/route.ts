// @/api/mobile/articles
import { getArticles } from "@/actions/mobile/articles";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const filters = {
    status: searchParams.get("status") as
      | "draft"
      | "published"
      | "archived"
      | undefined,
    language: searchParams.get("language") as "fr" | "ha" | "en" | undefined,
    author_id: searchParams.get("author_id")
      ? Number(searchParams.get("author_id"))
      : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    search: searchParams.get("search") || undefined,
  };

  // Validate numeric parameters
  if (filters.author_id && isNaN(filters.author_id)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: "Invalid author_id parameter",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  if (isNaN(filters.page) || filters.page < 1) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: "Invalid page parameter",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  if (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: "Invalid limit parameter (must be between 1 and 100)",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  const result = await getArticles(filters);
  return NextResponse.json(result, {
    status: result.success ? 200 : result.error?.code || 500,
  });
}

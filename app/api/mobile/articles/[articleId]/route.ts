// @/api/mobile/articles/[articleId]
import { getArticleById } from "@/actions/mobile/articles";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  const { articleId } = await params;
  const articleIdNum = Number(articleId);

  if (isNaN(articleIdNum)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 400,
          message: "Invalid articleId",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 400 }
    );
  }

  const result = await getArticleById(articleIdNum);
  return NextResponse.json(result, {
    status: result.success ? 200 : result.error?.code || 500,
  });
}

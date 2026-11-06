import { withLightInstrumentation } from "@/lib/server/api-handler";
// @/api/mobile/articles/[articleId]
import { getArticleById } from "@/actions/mobile/articles";
import { getUserIdFromAuthId } from "@/actions/users";
import { NextRequest, NextResponse } from "next/server";

export const GET = withLightInstrumentation(async (
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) => {
  const { articleId } = await params;
  const articleIdNum = Number(articleId);
  const searchParams = request.nextUrl.searchParams;
  const authId = searchParams.get("authId");
  const userId = authId ? await getUserIdFromAuthId(authId) : undefined;

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

  const result = await getArticleById(articleIdNum, userId);
  return NextResponse.json(result, {
    status: result.success ? 200 : result.error?.code || 500,
  });
});

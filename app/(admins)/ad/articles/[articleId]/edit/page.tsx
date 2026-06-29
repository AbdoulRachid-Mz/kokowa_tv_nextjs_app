// app/(admin)/ad/articles/[articleId]/edit/page.tsx
"use client";

import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/articles/article-form";

export default function EditArticlePage() {
  const params = useParams();
  const articleId = params?.articleId as string;

  // Vérifier si c'est "create" ou un ID numérique
  if (articleId === "create" || !articleId) {
    return (
      <div className="container mx-auto py-6">
        <ArticleForm mode="create" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ArticleForm mode="edit" articleId={articleId} />
    </div>
  );
}
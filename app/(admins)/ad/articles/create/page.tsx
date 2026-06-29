// app/(admin)/ad/articles/create/page.tsx
import { ArticleForm } from "@/components/articles/article-form";

export default function CreateArticlePage() {
  return (
    <div className="container mx-auto py-6">
      <ArticleForm mode="create" />
    </div>
  );
}
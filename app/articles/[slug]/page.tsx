// app/articles/[slug]/page.tsx
import { getArticleBySlug } from '@/actions/articles';
import { getArticles } from '@/actions/articles';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import ArticlePage from '@/components/pages/articles/article-page';
import { incrementArticleViewCount } from '@/actions/articles';

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const article = await getArticleBySlug(slug, { with_relations: true });
    
    return {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      keywords: ['lutte', 'traditionnelle', article.title.toLowerCase(), 'sport'],
      authors: article.author ? [{ name: `${article.author.first_name} ${article.author.last_name}` }] : undefined,
      openGraph: {
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt,
        type: 'article',
        publishedTime: article.published_at,
        authors: article.author ? [`${article.author.first_name} ${article.author.last_name}`] : undefined,
        images: article.featured_image ? [article.featured_image] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.meta_title || article.title,
        description: article.meta_description || article.excerpt,
        images: article.featured_image ? [article.featured_image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Article non trouvé',
      description: 'L\'article que vous cherchez n\'existe pas ou a été déplacé.',
    };
  }
}

// export async function generateStaticParams() {
//   try {
//     const articles = await getArticles({ 
//       status: 'published', 
//       limit: 100 
//     });
    
//     return articles.data.map((article) => ({
//       slug: article.slug,
//     }));
//   } catch (error) {
//     return [];
//   }
// }

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  
  try {
    const article = await getArticleBySlug(slug, { with_relations: true });
    
    // Incrémenter le compteur de vues
    await incrementArticleViewCount(article.id);
    
    // Récupérer des articles similaires
    const similarArticles = await getArticles({
      status: 'published',
      limit: 4,
      search: article.title.split(' ').slice(0, 2).join(' '),
      with_author: true,
    });

    // Récupérer les articles populaires
    const popularArticles = await getArticles({
      status: 'published',
      limit: 6,
      sortBy: 'view_count',
      sortOrder: 'desc',
      with_author: true,
    });

    return (
      <ArticlePage 
        article={article}
        similarArticles={similarArticles.data.filter(a => a.id !== article.id).slice(0, 3)}
        popularArticles={popularArticles.data.filter(a => a.id !== article.id).slice(0, 6)}
      />
    );
  } catch (error) {
    notFound();
  }
}
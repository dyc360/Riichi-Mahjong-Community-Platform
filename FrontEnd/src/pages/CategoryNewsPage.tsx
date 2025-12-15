// src/pages/CategoryNewsPage.tsx
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HomePageHeader, MainNavigation, ProNews } from '../components/homePageComp';
import { useCategories, getCategoryDisplayName } from '../contexts/CategoriesContext';
import { useNews } from '../contexts/NewsContext';

export default function CategoryNewsPage() {
  const { category } = useParams<{ category: string }>();
  const { categories } = useCategories();
  const { getNewsByCategory, loading, error } = useNews();

  // 根据 slug 获取分类显示名称（优先使用标签）
  const categoryDisplayName = useMemo(() => {
    if (!category) return '';
    const foundCategory = categories.find(cat => cat.slug === category);
    return foundCategory ? getCategoryDisplayName(foundCategory) : category;
  }, [category, categories]);

  // 从 NewsContext 获取该分类的新闻
  const articles = useMemo(() => {
    if (!category) return [];
    return getNewsByCategory(category).map(news => ({
      id: news.id,
      title: news.title,
      timestamp: news.timestamp,
      category: news.category
    }));
  }, [category, getNewsByCategory]);


  if (loading) {
    return (
      <>
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-slate-600 dark:text-slate-400">加载中...</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <HomePageHeader />
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/news" className="text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
            ← 返回新闻中心
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          {categoryDisplayName}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          查看所有相关文章
        </p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {articles.map(article => (
            <ProNews 
              key={article.id}
              id={article.id}
              title={article.title} 
              timestamp={article.timestamp}
              category={article.category}
            />
          ))}
          {articles.length === 0 && !error && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              暂无文章
            </div>
          )}
        </div>
      </main>
    </>
  );
}
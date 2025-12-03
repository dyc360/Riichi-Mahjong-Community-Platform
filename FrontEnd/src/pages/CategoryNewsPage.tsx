// src/pages/CategoryNewsPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { HomePageHeader, MainNavigation, ProNews } from '../components/homePageComp';

const API_BASE_URL = 'http://localhost:8000/api';

interface Article {
  id: number;
  title: string;
  summary: string;
  cover_image: string | null;
  category_name: string;
  author_name: string;
  published_at: string;
  views: number;
  status: string;
}

export default function CategoryNewsPage() {
  const { category } = useParams<{ category: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get<Article[]>(`${API_BASE_URL}/news/category/${category}/`);
        setArticles(response.data);
      } catch (err) {
        console.error('获取分类文章失败:', err);
        setError('获取文章列表失败');
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchCategoryArticles();
    }
  }, [category]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '刚刚';
    if (diffInHours < 24) return `${diffInHours}小时前`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}天前`;
  };

  const getCategoryName = (slug: string) => {
    const categoryMap: { [key: string]: string } = {
      'industry': '行业资讯',
      'majsoul': '雀魂动态',
      'm-league': 'M-League'
    };
    return categoryMap[slug] || slug;
  };

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
          {getCategoryName(category!)}
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
            <Link key={article.id} to={`/news/article/${article.id}`}>
              <ProNews 
                title={article.title} 
                timestamp={formatTime(article.published_at)} 
              />
            </Link>
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
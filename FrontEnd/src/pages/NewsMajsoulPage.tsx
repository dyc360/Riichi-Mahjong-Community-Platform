import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HomePageHeader, ModuleContainer, GameInfoCard } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// API接口
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 雀魂新闻接口
interface MajsoulNews {
  id: number;
  title: string;
  content: string;
  summary: string;
  cover_image: string;
  category: string;
  status: string;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  source_url: string;
  source_id: string;
}

export default function NewsMajsoulPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentCategory, setCurrentCategory] = useState('all');
  const [news, setNews] = useState<MajsoulNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取新闻数据
  useEffect(() => {
    fetchNews();
  }, [currentCategory]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoryParam = currentCategory !== 'all' ? `?category=${currentCategory}` : '';
      const response = await fetch(`${API_BASE_URL}/api/mahjong/majsoul-news/${categoryParam}`);

      if (!response.ok) {
        throw new Error('获取新闻失败');
      }

      const data = await response.json();
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取分类显示名称
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'update': '更新',
      'event': '活动',
      'maintenance': '维护',
      'other': '其他'
    };
    return categoryMap[category] || category;
  };

  return (
    <>
      <HomePageHeader />

      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          {/* 返回按钮 */}
          <button
            onClick={handleGoBack}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回上一页
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">雀魂游戏资讯</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">最新游戏更新、活动与赛事信息</p>

        {/* 雀魂新闻分类导航 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              currentCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('all')}
          >
            全部
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              currentCategory === 'event'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('event')}
          >
            活动
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              currentCategory === 'update'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('update')}
          >
            更新
          </button>
          <button
            className={`px-4 py-2 rounded-full text-sm ${
              currentCategory === 'maintenance'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('maintenance')}
          >
            维护
          </button>
        </div>

        {/* 雀魂新闻列表 */}
        <ModuleContainer
          title="最新动态"
          description="雀魂游戏的最新资讯与更新内容"
        >
          {loading ? (
            <div className="py-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-slate-500 dark:text-slate-400">加载中...</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {news.length > 0 ? (
                news.map((newsItem) => (
                  <Link
                    key={newsItem.id}
                    to={`/news/majsoul/${newsItem.id}`}
                    className="block group"
                  >
                    <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                      <img
                        src={newsItem.cover_image || "https://placehold.co/100x70/6366f1/ffffff?text=News"}
                        alt={newsItem.title}
                        className="w-full md:w-48 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                            {getCategoryDisplayName(newsItem.category)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatTime(newsItem.published_at)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {newsItem.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">
                          {newsItem.summary}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                  暂无该分类的新闻资讯
                </div>
              )}
            </div>
          )}
        </ModuleContainer>
      </main>
    </>
  );
}
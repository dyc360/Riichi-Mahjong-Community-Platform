import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GameInfoCard, HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// API接口
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

export default function NewsMajsoulDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [news, setNews] = useState<MajsoulNews | null>(null);
  const [relatedNews, setRelatedNews] = useState<MajsoulNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
      fetchRelatedNews();
    }
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/mahjong/majsoul-news/${id}/`);

      if (!response.ok) {
        throw new Error('获取新闻详情失败');
      }

      const data = await response.json();
      setNews(data);

      // 增加浏览量
      await fetch(`${API_BASE_URL}/api/mahjong/majsoul-news/${id}/view/`, {
        method: 'POST'
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取新闻详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mahjong/majsoul-news/?limit=3`);

      if (response.ok) {
        const data = await response.json();
        // 过滤掉当前新闻
        const filtered = data.filter((item: MajsoulNews) => item.id !== parseInt(id || '0'));
        setRelatedNews(filtered.slice(0, 2));
      }
    } catch (err) {
      // 忽略相关新闻的错误
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'update': '更新',
      'event': '活动',
      'maintenance': '维护',
      'other': '其他'
    };
    return categoryMap[category] || category;
  };

  if (loading) {
    return (
      <>
        <HomePageHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="py-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">加载中...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !news) {
    return (
      <>
        <HomePageHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="py-10 text-center text-red-600 dark:text-red-400">
            {error || '新闻不存在'}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <HomePageHeader />

      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
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
        <article className="max-w-4xl mx-auto">
          {/* 文章头部 */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                {getCategoryDisplayName(news.category)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatTime(news.published_at)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                浏览量: {news.views}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {news.title}
            </h1>

            {news.summary && (
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                {news.summary}
              </p>
            )}

            {news.cover_image && (
              <img
                src={news.cover_image}
                alt={news.title}
                className="w-full max-h-96 object-cover rounded-lg mb-6"
              />
            )}
          </header>

          {/* 文章内容 */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />

          {/* 相关新闻 */}
          {relatedNews.length > 0 && (
            <section className="border-t border-slate-200 dark:border-slate-700 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">相关资讯</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {relatedNews.map((related) => (
                  <Link
                    key={related.id}
                    to={`/news/majsoul/${related.id}`}
                    className="block group"
                  >
                    <div className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                      <img
                        src={related.cover_image || "https://placehold.co/80x60/6366f1/ffffff?text=News"}
                        alt={related.title}
                        className="w-20 h-15 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {related.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                          {related.summary}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
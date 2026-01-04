import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface MajSoulNews {
  id: number;
  title: string;
  description: string;
  link: string;
  image_url: string;
  published_at: string;
  category: string;
  source: string;
  last_updated: string;
}

const NewsMajsoulDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<MajSoulNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchNewsDetail();
    }
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 首先尝试获取所有新闻，然后找到对应的
      const response = await fetch('/api/news/majsoul/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const newsList = Array.isArray(data) ? data : (data.results || data.data || []);
      
      const newsItem = newsList.find((item: MajSoulNews) => item.id === parseInt(id || '0'));
      
      if (newsItem) {
        setNews(newsItem);
      } else {
        setError('未找到该新闻');
      }
    } catch (err) {
      console.error('获取新闻详情失败:', err);
      setError(err instanceof Error ? err.message : '获取新闻详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || '未找到该新闻'}
          </p>
          <button
            onClick={() => navigate('/news/majsoul')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回新闻列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/news/majsoul')}
          className="mb-6 text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          ← 返回新闻列表
        </button>

        {/* 新闻详情卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* 新闻图片 */}
          {news.image_url && (
            <div className="w-full h-64 md:h-96 overflow-hidden">
              <img
                src={news.image_url}
                alt={news.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* 新闻内容 */}
          <div className="p-6 md:p-8">
            {/* 分类和来源 */}
            <div className="flex items-center justify-between mb-4">
              {news.category && (
                <span className="inline-block px-3 py-1 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 rounded">
                  {news.category}
                </span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {news.source}
              </span>
            </div>

            {/* 标题 */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {news.title}
            </h1>

            {/* 发布时间 */}
            <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              发布时间: {formatDate(news.published_at)}
            </div>

            {/* 描述 */}
            {news.description && (
              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {news.description}
                </p>
              </div>
            )}

            {/* 外部链接 */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                查看原文
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsMajsoulDetailPage;


import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 定义文章接口（与 NewsDetailPage 保持一致）
interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  summary: string;
  cover_image: string | null;
  category_name: string;
  author_name: string;
  published_at: string;
  views: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// 相关新闻项接口
interface RelatedNewsItem {
  id: number;
  title: string;
}

// 新闻详情接口（适配原有结构）
interface NewsDetail {
  id: number;
  title: string;
  timestamp: string;
  category: string[];
  author: string;
  avatar: string;
  content: string;
  relatedNews: RelatedNewsItem[];
}

const CATEGORY_CONFIG = {
  'rules': {
    label: '#规则更新',
    light: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    dark: 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40',
    textSize: 'text-sm'
  },
  'tournament': {
    label: '#赛事动态',
    light: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    dark: 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40',
    textSize: 'text-sm'
  },
  'technology': {
    label: '#技术发展',
    light: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    dark: 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40',
    textSize: 'text-sm'
  },
  'communication': {
    label: '#国际交流',
    light: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    dark: 'bg-rose-900/30 text-rose-300 hover:bg-rose-800/40',
    textSize: 'text-sm'
  },
};

// 默认分类
const DEFAULT_CATEGORY = {
  label: '#暂无分类',
  light: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  dark: 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/40',
  textSize: 'text-sm'
};

// 将 category_name 映射到 NewsCategory 类型
const mapCategoryNameToNewsCategory = (categoryName: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    'rules': ['rules'],
    'tournament': ['tournament'],
    'communication': ['communication'],
    'technology': ['technology'],
    //'industry': ['rules'],
    '赛事': ['tournament'],
    '技术': ['technology'],
    '交流': ['communication']
  };
  
  return categoryMap[categoryName.toLowerCase()] || [''];
};

// 生成头像 URL
const generateAvatarUrl = (authorName: string): string => {
  const firstChar = authorName.charAt(0);
  const colors = ['6366f1', '10b981', 'ec4899', 'f59e0b', 'ef4444', '8b5cf6'];
  const color = colors[authorName.length % colors.length];
  return `https://placehold.co/40x40/${color}/ffffff?text=${encodeURIComponent(firstChar)}`;
};

// 模拟相关新闻数据
const getRelatedNews = async (currentArticleId: number, categoryName: string): Promise<RelatedNewsItem[]> => {
  try {
    const response = await axios.get<ArticleDetail[]>(`${API_BASE_URL}/news_api/articles/`);
    
    // 过滤掉当前文章，并按发布时间倒序排列
    const relatedArticles = response.data
      .filter(article => article.id !== currentArticleId && article.status === 'published')
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 3) // 取最近发布的3篇相关文章
      .map(article => ({
        id: article.id,
        title: article.title
      }));
    
    return relatedArticles;
  } catch (error) {
    console.error('获取相关新闻失败:', error);
    // 返回默认的相关新闻
    return [
      { id: 3, title: "日本职业雀士访问中国交流活动圆满结束" },
      { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行" },
      { id: 2, title: "国际麻将协会宣布新增赛事项目" }
    ];
  }
};

export default function NewsProPage() {
  const { theme } = useTheme();
  const { title: encodedTitle } = useParams<{ title: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const newsId = (() => {
    const idStr = searchParams.get('id');
    if (!idStr) return undefined;
    const num = parseInt(idStr, 10);
    return isNaN(num) || num <= 0 ? undefined : num;
  })();

  // 从后端获取新闻详情
  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!newsId) {
        setError('新闻ID无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 获取文章详情
        const response = await axios.get<ArticleDetail>(`${API_BASE_URL}/news_api/articles/${newsId}/`);
        const article = response.data;

        // 获取相关新闻
        const relatedNews = await getRelatedNews(article.id, article.category_name);

        // 格式化时间为相对时间
        const formatRelativeTime = (publishedAt: string): string => {
          const publishedDate = new Date(publishedAt);
          const now = new Date();
          const diffInMs = now.getTime() - publishedDate.getTime();
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInHours < 1) {
            return '刚刚';
          } else if (diffInHours < 24) {
            return `${diffInHours}小时前`;
          } else if (diffInDays < 7) {
            return `${diffInDays}天前`;
          } else {
            return publishedDate.toLocaleDateString('zh-CN', {
              month: 'numeric',
              day: 'numeric'
            });
          }
        };

        // 转换数据结构
        const transformedNews: NewsDetail = {
          id: article.id,
          title: article.title,
          timestamp: formatRelativeTime(article.published_at),
          category: mapCategoryNameToNewsCategory(article.category_name),
          author: article.author_name,
          avatar: generateAvatarUrl(article.author_name),
          content: article.content || '文章内容加载中...',
          relatedNews: relatedNews
        };

        setNews(transformedNews);
      } catch (err: any) {
        console.error('获取新闻详情失败:', err);
        if (err.response?.status === 404) {
          setError('文章不存在或已被删除');
        } else {
          setError('获取文章详情失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [newsId]);

  const handleGoBack = () => {
    navigate(-1);
  };

  // 解码路径中的title
  const decodedTitle = (() => {
    if (!encodedTitle) return "未知新闻";
    try {
      const decoded = decodeURIComponent(encodedTitle);
      const withSpaces = decoded.replace(/-/g, " ");
      return withSpaces.replace(/percent/g, "%");
    } catch (e) {
      return "未知新闻";
    }
  })();

  // 加载状态
  if (loading) {
    return (
      <>
        <HomePageHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📰 加载中...</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              正在加载新闻内容，请稍候
            </p>
          </div>
        </div>
      </>
    );
  }

  // 错误状态
  if (error || !news) {
    return (
      <>
        <HomePageHeader />
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📰 {error || '新闻不存在'}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              你访问的新闻可能已被删除、链接错误，或参数无效
            </p>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HomePageHeader />

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 新闻主体内容（占2列） */}
          <div className="lg:col-span-2">
            <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 md:p-8">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">{news.title}</h1>

              {/* 作者信息 */}
              <div className="flex items-center gap-3 mb-6 text-sm text-slate-500 dark:text-slate-400">
                <img src={news.avatar} alt={news.author} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{news.author}</p>
                  <p>{news.timestamp}</p>
                </div>
              </div>

              {/* 分类标签组 */}
              <div className="flex flex-wrap gap-2.5 py-1">
                {news.category.map((cat) => {
                  const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]|| DEFAULT_CATEGORY;
                  if(config === DEFAULT_CATEGORY){
                    news.category = ['default'];
                  }
                  console.log(news.category);
                  const colorClass = theme === 'dark' ? config.dark : config.light;
                  
                  if(!cat){
                    cat = 'default';
                  }
                  return (
                    <Link
                      key={cat}
                      to={`/news/category/${cat}`}
                      className={`
                        px-3.5 py-1.5 rounded-full 
                        font-medium transition-all duration-200
                        ${config.textSize}
                        ${colorClass}
                        shadow-sm hover:shadow-md
                      `}
                    >
                      {config.label}
                    </Link>
                  );
                })}
              </div>

              {/* 新闻内容 */}
              <div
                className="prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 pt-5"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </article>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <ModuleContainer
              title="相关新闻"
              description="你可能也感兴趣的内容"
              className="sticky top-8"
            >
              <div className="space-y-3">
                {news.relatedNews.map(item => (
                  <Link
                    key={item.id}
                    to={`/news/pro/${encodeURIComponent(item.title.replace(/\s+/g, '-').replace(/%/g, 'percent'))}?id=${item.id}`}
                    className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="mt-6">
                <ModuleContainer title="新闻分类" description="浏览更多相关内容">
                  <div className="space-y-2">
                    <CategoryItem label="赛事动态" count="42" path="/news/category/tournament" />
                    <CategoryItem label="规则更新" count="15" path="/news/category/rules" />
                    <CategoryItem label="技术发展" count="23" path="/news/category/technology" />
                    <CategoryItem label="国际交流" count="18" path="/news/category/communication" />
                  </div>
                </ModuleContainer>
              </div>
            </ModuleContainer>
          </div>
        </div>
      </main>
    </>
  );
}

// 新闻分类项组件
const CategoryItem = ({ label, count, path }: { label: string; count: string; path: string }) => {
  return (
    <Link
      to={path}
      className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-slate-800 dark:text-slate-200">{label}</span>
      <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
        {count}
      </span>
    </Link>
  );
};
// src/pages/NewsDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE_URL = 'http://localhost:8000/api';

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

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  console.log('id:',id);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get<ArticleDetail>(`${API_BASE_URL}/news_api/articles/${id}/`);
        setArticle(response.data);
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
        if (err.response?.status === 404) {
          setError('文章不存在或已被删除');
        } else {
          setError('获取文章详情失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticleDetail();
    }
  }, [id]);

  // 格式化时间
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 返回按钮处理
  const handleBack = () => {
    navigate(-1);
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

  if (error) {
    return (
      <>
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</div>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              返回上一页
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-lg text-slate-600 dark:text-slate-400 mb-4">文章不存在</div>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              返回上一页
            </button>
          </div>
        </main>
      </>
    );
  }
  console.log("article:",article);
  console.log("category:",article.category_name);
  return (
    <>
      <HomePageHeader />
      
      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 返回按钮 */}
        <button
          onClick={handleBack}
          className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        {/* 文章内容 */}
        <article className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* 封面图 */}
          {article.cover_image && (
            <div className="w-full h-64 overflow-hidden">
              <img 
                src={article.cover_image} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 文章头部 */}
          <div className="p-6">
            {/* 分类标签 */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-medium">
                {article.category_name}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {article.views} 阅读
              </span>
            </div>

            {/* 标题 */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {article.title}
            </h1>

            {/* 摘要 */}
            {article.summary && (
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {article.summary}
              </p>
            )}

            {/* 文章信息 */}
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 border-t border-b border-slate-200 dark:border-slate-700 py-4 mb-6">
              <div className="flex items-center space-x-4">
                <span>作者：{article.author_name}</span>
                <span>发布时间：{formatDate(article.published_at)}</span>
              </div>
              {article.updated_at !== article.created_at && (
                <span>更新于：{formatDate(article.updated_at)}</span>
              )}
            </div>

            {/* 文章内容 */}
            <div 
              className="prose prose-lg max-w-none dark:prose-invert
                         prose-headings:text-slate-900 dark:prose-headings:text-white
                         prose-p:text-slate-700 dark:prose-p:text-slate-300
                         prose-strong:text-slate-900 dark:prose-strong:text-white
                         prose-a:text-indigo-600 dark:prose-a:text-indigo-400
                         prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                         prose-li:text-slate-700 dark:prose-li:text-slate-300"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </div>
        </article>

        {/* 相关文章推荐（可选） */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">相关文章</h2>

            <Link 
              to={`/news/category/${article.category_name}`}
              className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400"
            >
              查看更多 →
            </Link>
          </div>
          {/* 这里可以添加相关文章列表 */}
        </div>
      </main>
    </>
  );
}

// 格式化内容（如果需要的话）
const formatContent = (content: string): string => {
  // 这里可以添加内容格式化逻辑，比如将换行符转换为<br>等
  return content;
  //return content.replace(/\n/g, '<br>');//暂时注释掉验证功能，以后可能需要进一步修改
};
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, ProNews, MainNavigation } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { INDUSTRY_NEWS } from './NewsPage';

// 新闻分类标签映射
const CATEGORY_LABELS = {
  'rules': '规则更新',
  'tournament': '赛事动态',
  'technology': '技术发展',
  'communication': '国际交流'
};

export default function NewsCategoryPage() {
  const { theme } = useTheme();
  const { category } = useParams<{ category: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  // 验证分类是否有效
  const isValidCategory = Object.keys(CATEGORY_LABELS).includes(category || '');
  
  // 根据分类筛选新闻
  const filteredNews = INDUSTRY_NEWS.filter(news => 
    news.category.includes(category as any)
  );

  // 分页
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  const handleGoBack = () => {
    navigate(-1); 
  };

  const categoryLabel = isValidCategory 
    ? CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]
    : '未知分类';

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          分类资讯
        </h1>
        
        {isValidCategory ? (
          <>
            <ModuleContainer
              title={`${categoryLabel}`}
              description={`关于立直麻将${categoryLabel}的最新动态与资讯`}
              className="mb-8"
            >
              {currentNews.length > 0 ? (
                <div className="space-y-3">
                  {currentNews.map(news => (
                    <ProNews 
                      key={news.id}
                      id={news.id} 
                      title={news.title} 
                      timestamp={news.timestamp} 
                      category={news.category}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 dark:text-slate-400">
                  暂无相关分类的新闻资讯
                </div>
              )}
            </ModuleContainer>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button 
                      key={page}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                        page === currentPage 
                          ? 'bg-indigo-500 text-white' 
                          : 'border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <ModuleContainer
            title="分类不存在"
            description="您访问的新闻分类不存在或已被移除"
          >
            <div className="py-10 text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-6">请检查您访问的URL是否正确</p>
              <Link 
                to="/news/archive" 
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                返回全部资讯
              </Link>
            </div>
          </ModuleContainer>
        )}
      </main>
    </>
  );
}
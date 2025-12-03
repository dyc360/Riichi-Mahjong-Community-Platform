import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, ProNews, TeamRank, GameInfoCard, MainNavigation } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 导入新闻数据
import { INDUSTRY_NEWS } from './NewsPage';

// 新闻分类
const NEWS_CATEGORIES = [
  { value: 'all', label: '全部新闻' },
  { value: 'industry', label: '行业资讯' },
  { value: 'm-league', label: 'M-League' },
  { value: 'majsoul', label: '雀魂游戏' },
];

// 每页显示的新闻数量
const NEWS_PER_PAGE = 5;

export default function NewsArchivePage() {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1); // 当前页码状态
  const location = useLocation();
  const navigate = useNavigate();
 
  const handleGoBack = () =>{
    navigate(-1)
  };

  // 根据分类筛选新闻
  const filteredNews = activeCategory === 'all' || activeCategory === 'industry' 
    ? INDUSTRY_NEWS 
    : []; 

  // 计算总页数
  const totalPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE);

  // 获取当前页显示的新闻
  const getCurrentPageNews = () => {
    const startIndex = (currentPage - 1) * NEWS_PER_PAGE;
    return filteredNews.slice(startIndex, startIndex + NEWS_PER_PAGE);
  };

  // 处理页码变更
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 滚动到页面顶部
      window.scrollTo(0, 0);
    }
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

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">全部资讯</h1>
        

        {/* 行业资讯存档 */}
        {activeCategory === 'all' || activeCategory === 'industry' ? (
          <ModuleContainer
            title="全部动态"
            description="立直麻将相关的所有行业动态与赛事信息"
            className="mb-8"
          >
            <div className="space-y-3">
              {getCurrentPageNews().map(news => (
                <ProNews 
                  id={news.id} 
                  title={news.title} 
                  timestamp={news.timestamp} 
                  category={news.category}
                />
              ))}
            </div>
          </ModuleContainer>
        ) : null}

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              {/* 上一页按钮 */}
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 页码按钮*/}
              {currentPage > 2 && <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handlePageChange(1)}>1</button>}
              {currentPage > 3 && <span className="text-slate-500 dark:text-slate-400">...</span>}
              
              {currentPage > 1 && (
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handlePageChange(currentPage - 1)}>
                  {currentPage - 1}
                </button>
              )}
              
              {/* 当前页码 */}
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-500 text-white" onClick={() => handlePageChange(currentPage)}>
                {currentPage}
              </button>
              
              {currentPage < totalPages && (
                <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handlePageChange(currentPage + 1)}>
                  {currentPage + 1}
                </button>
              )}
              
              {currentPage < totalPages - 2 && <span className="text-slate-500 dark:text-slate-400">...</span>}
              {currentPage < totalPages - 1 && <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>}
              
              {/* 下一页按钮 */}
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
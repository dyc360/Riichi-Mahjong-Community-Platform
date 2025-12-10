import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { HomePageHeader, ModuleContainer, GameInfoCard } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 雀魂新闻数据
export const MAJSOUL_NEWS_DETAILED = [
  { 
    id: 1,
    title: "新活动登场：姬川响的游戏机", 
    subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
    imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event",
    timestamp: "2小时前",
    category: ["event"]
  },
  { 
    id: 2,
    title: "版本更新公告 v2.0.1", 
    subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
    imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update",
    timestamp: "1天前",
    category: ["update"]
  },
  { 
    id: 3,
    title: "夏季锦标赛报名启动", 
    subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
    imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney",
    timestamp: "2天前",
    category: ["tournament"]
  },
  { 
    id: 4,
    title: "新角色「望月凛」上线", 
    subtitle: "全新角色加入雀魂大家庭，自带专属语音和特殊动作",
    imageUrl: "https://placehold.co/100x70/f59e0b/ffffff?text=Character",
    timestamp: "3天前",
    category: ["character"]
  },
  { 
    id: 5,
    title: "雀魂职业联赛S4赛季即将开幕",
    subtitle: "16支顶尖战队将角逐年度总冠军，总奖金高达500万元",
    imageUrl: "https://placehold.co/100x70/8b5cf6/ffffff?text=League",
    timestamp: "1周前",
    category: ["tournament"]
  }
];

export default function NewsMajsoulPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  // 添加分类状态管理
  const [currentCategory, setCurrentCategory] = useState('all');

  const handleGoBack = () => {
    navigate(-1);
  };

  // 根据当前分类筛选新闻
  const filteredNews = currentCategory === 'all' 
    ? MAJSOUL_NEWS_DETAILED 
    : MAJSOUL_NEWS_DETAILED.filter(news => news.category.includes(currentCategory));

  // 分类按钮点击处理函数
  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
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
              currentCategory === 'tournament' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('tournament')}
          >
            赛事
          </button>
          <button 
            className={`px-4 py-2 rounded-full text-sm ${
              currentCategory === 'character' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            } transition-colors`}
            onClick={() => handleCategoryChange('character')}
          >
            角色
          </button>
        </div>
        
        {/* 雀魂新闻列表 */}
        <ModuleContainer
          title="最新动态"
          description="雀魂游戏的最新资讯与更新内容"
        >
          <div className="space-y-6">
            {filteredNews.length > 0 ? (
              filteredNews.map((news) => (
                <Link 
                  key={news.id}
                  to={`/news/majsoul/${encodeURIComponent(news.title)}`}
                  className="block group"
                >
                  <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                    <img 
                      src={news.imageUrl} 
                      alt={news.title} 
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {news.category[0]}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {news.timestamp}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {news.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                        {news.subtitle}
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
        </ModuleContainer>
      </main>
    </>
  );
}
// NewsPage.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, NewsSubModule, ProNews, TeamRank, GameInfoCard, MainNavigation } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api';

// 定义数据类型
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

interface TeamRankData {
  id: number;
  rank: number;
  team_name: string;
  score: string;
  season: string;
  last_updated: string;
}

interface NewsHomeData {
  success: boolean;
  industry_news: Article[];
  majsoul_news: Article[];
  rankings: TeamRankData[];
}

export default function NewsPage() {
  const { theme } = useTheme();
  const [newsData, setNewsData] = useState<NewsHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get<NewsHomeData>(`${API_BASE_URL}/news/home/`);
        
        if (response.data.success) {
          setNewsData(response.data);
        } else {
          setError('获取数据失败');
        }
      } catch (err) {
        console.error('获取新闻数据失败:', err);
        setError('连接服务器失败，请检查后端服务是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();
  }, []);

  // 格式化时间显示
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
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
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-red-600 dark:text-red-400">
              {error}
              <div className="text-sm mt-2 text-slate-600 dark:text-slate-400">
                请确保后端服务正在运行：python manage.py runserver
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!newsData) {
    return (
      <>
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-slate-600 dark:text-slate-400">暂无数据</div>
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
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">新闻中心</h1>
        
        {/* 行业资讯模块 */}
        <ModuleContainer
          title="行业资讯"
          description="立直麻将相关的最新行业动态与赛事信息"
          className="mb-8"
        >
          <div className="space-y-3">
            {newsData.industry_news.map(news => (
              <Link key={news.id} to={`/news/article/${news.id}`} className="block">
                <ProNews
                  title={news.title}
                  timestamp={formatTime(news.published_at)}
                />
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/news/category/industry" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
              查看全部资讯 →
            </Link>
          </div>
        </ModuleContainer>

        {/* M-League联赛积分榜 */}
        <ModuleContainer
          title="M-League联赛积分榜"
          description="2023赛季最新积分排名情况"
          className="mb-8"
        >
          <div className="space-y-2">
            {newsData.rankings.map(team => (
              <TeamRank
                key={team.id}
                rank={team.rank}
                teamName={team.team_name}
                score={team.score}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              数据更新时间：{newsData.rankings.length > 0 ?
                new Date(newsData.rankings[0].last_updated).toLocaleString('zh-CN') :
                '暂无数据'}
            </p>
            <Link to="/news/m-league/details" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
              查看详细赛程 →
            </Link>
          </div>
        </ModuleContainer>

        {/* 雀魂游戏信息 */}
        <ModuleContainer
          title="雀魂游戏信息"
          description="最新游戏更新、活动与赛事信息"
        >
          <div className="space-y-4">
            {newsData.majsoul_news.map((news) => (
              <Link key={news.id} to={`/news/article/${news.id}`}>
                <GameInfoCard
                  title={news.title}
                  subtitle={news.summary}
                  imageUrl={news.cover_image || "https://placehold.co/100x70/6366f1/ffffff?text=News"}
                  link={`/news/article/${news.id}`}
                />
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/news/category/majsoul" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
              查看全部游戏动态 →
            </Link>
          </div>
        </ModuleContainer>
      </main>
    </>
  );
}
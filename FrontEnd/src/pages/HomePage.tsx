import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { HomePageHeader } from '../components/homePageComp'
import { useTheme } from '../contexts/ThemeContext';
import { NewsSubModule, ModuleContainer, ProNews, TeamRank, GameInfoCard, ForumTopicRank, PracticeCard, MainNavigation } from '../components/homePageComp'

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

export default function HomePage() {
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
        setError('连接服务器失败');
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

  return (
    <>
      <HomePageHeader />
      {/* 顶部引导导航 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 新闻浏览模块  */}
          <NewsModule
            newsData={newsData}
            loading={loading}
            error={error}
            formatTime={formatTime}
          />

          {/* 论坛交流模块*/}
          <ForumModule />
        </div>
        {/* 何切练习模块*/}
        <div className="mt-6">
          <PracticeModule />
        </div>
      </main>
    </>
  )
}

// 导航项组件
const NavItem = ({
  label,
  path
}: {
  label: string;
  path: string
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  const { theme } = useTheme();

  return (
    <Link
      to={path}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? 'bg-indigo-500 text-white'
          : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
    >
      {label}
    </Link>
  );
};

// 新闻浏览模块
interface NewsModuleProps {
  newsData: NewsHomeData | null;
  loading: boolean;
  error: string | null;
  formatTime: (timestamp: string) => string;
}

const NewsModule = ({ newsData, loading, error, formatTime }: NewsModuleProps) => {
  if (loading) {
    return (
      <ModuleContainer
        title="新闻浏览"
        description="立直麻将相关的最新动态与数据"
        className="col-span-1 lg:col-span-2"
      >
        <div className="flex justify-center items-center h-32">
          <div className="text-slate-600 dark:text-slate-400">加载中...</div>
        </div>
      </ModuleContainer>
    );
  }

  if (error) {
    return (
      <ModuleContainer
        title="新闻浏览"
        description="立直麻将相关的最新动态与数据"
        className="col-span-1 lg:col-span-2"
      >
        <div className="flex justify-center items-center h-32">
          <div className="text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        </div>
      </ModuleContainer>
    );
  }

  if (!newsData) {
    return (
      <ModuleContainer
        title="新闻浏览"
        description="立直麻将相关的最新动态与数据"
        className="col-span-1 lg:col-span-2"
      >
        <div className="flex justify-center items-center h-32">
          <div className="text-slate-600 dark:text-slate-400">暂无数据</div>
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer
      title="新闻浏览"
      description="立直麻将相关的最新动态与数据"
      className="col-span-1 lg:col-span-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 行业资讯子模块 */}
        <NewsSubModule title="行业资讯">
          <div className="space-y-3">
            {newsData.industry_news.slice(0, 4).map(news => (
              <ProNews
                key={news.id}
                title={news.title}
                timestamp={formatTime(news.published_at)}
              />
            ))}
            {newsData.industry_news.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                暂无行业资讯
              </div>
            )}
          </div>
          <div className="mt-3 text-right">
            <Link to="/news/industry" className="text-xs text-indigo-500 hover:text-indigo-300">
              更多资讯 →
            </Link>
          </div>
        </NewsSubModule>

        {/* M-League联赛积分榜子模块 */}
        <NewsSubModule title="M-League联赛积分榜">
          <div className="space-y-2">
            {newsData.rankings.slice(0, 5).map(team => (
              <TeamRank
                key={team.id}
                rank={team.rank}
                teamName={team.team_name}
                score={team.score}
              />
            ))}
            {newsData.rankings.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                暂无排名数据
              </div>
            )}
          </div>
          <div className="mt-3 text-right">
            <Link to="/news/m-league" className="text-xs text-indigo-500 hover:text-indigo-300">
              完整排名 →
            </Link>
          </div>
        </NewsSubModule>

        {/* 雀魂游戏信息子模块 */}
        <NewsSubModule title="雀魂游戏信息">
          <div className="space-y-3">
            {newsData.majsoul_news.slice(0, 2).map(news => (
              <GameInfoCard
                key={news.id}
                title={news.title}
                subtitle={news.summary}
                imageUrl={news.cover_image || "https://placehold.co/100x70/6366f1/ffffff?text=News"}
                link={`/news/majsoul/${news.id}`}
              />
            ))}
            {newsData.majsoul_news.length === 0 && (
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                暂无游戏动态
              </div>
            )}
          </div>
          <div className="mt-3 text-right">
            <Link to="/news/majsoul" className="text-xs text-indigo-500 hover:text-indigo-300">
              游戏动态 →
            </Link>
          </div>
        </NewsSubModule>
      </div>
    </ModuleContainer>
  );
};

// 论坛交流模块
const ForumModule = () => (
  <ModuleContainer
    title="论坛交流"
    description="与其他麻将爱好者分享心得与技巧"
  >
    <div className="space-y-1">
      <ForumTopicRank rank={1} title="【讨论】大家觉得这次新角色如何？" replies={128} time="10分钟前" />
      <ForumTopicRank rank={2} title="求助：这个牌型应该怎么防守？" replies={85} time="35分钟前" />
      <ForumTopicRank rank={3} title="分享一个刚刚打出的役满！" replies={64} time="1小时前" />
      <ForumTopicRank rank={4} title="关于立直麻将的一些基础理论探讨" replies={42} time="2小时前" />
      <ForumTopicRank rank={5} title="萌新入坑，请问有什么推荐的教学视频吗？" replies={36} time="3小时前" />
    </div>
    <div className="mt-3 text-right">
      <Link to="/forum" className="text-sm font-medium text-indigo-500 hover:text-indigo-300">
        进入论坛 →
      </Link>
    </div>
  </ModuleContainer>
);

// 何切练习模块
const PracticeModule = () => (
  <ModuleContainer
    title="何切练习"
    description="通过实战案例提升你的打牌决策能力"
  >
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PracticeCard 
            title="手牌算点" 
            description="计算给出的手牌的点数，提升算分速度。" 
            difficulty="Medium" 
            count={85} 
            link='/practice/point-calculation'
        />
        <PracticeCard 
            title="清一色训练" 
            description="针对多面听的清一色牌型进行专项训练。" 
            difficulty="Hard" 
            count={40} 
        />
        <PracticeCard 
            title="何切300" 
            description="来自《何切300问》的精选题目，涵盖多种复杂局面。" 
            difficulty="Medium" 
            count={300} 
        />
        <PracticeCard 
            title="牌效率何切" 
            description="适合新手的牌效练习，学习如何最大化进张。" 
            difficulty="Easy" 
            count={150} 
        />
    </div>
    <div className="mt-6 text-center">
       <Link to="/practice" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
            浏览全部题库
       </Link>
    </div>
  </ModuleContainer>
);
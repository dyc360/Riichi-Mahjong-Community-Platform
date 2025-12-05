import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, NewsSubModule, ProNews, TeamRank, GameInfoCard, MainNavigation, type NewsCategory } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 定义文章接口
interface Article {
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

interface IndustryNewsItem {
  id: number;
  title: string;
  timestamp: string;
  category: NewsCategory[];
}

// 将 category_name映射到NewsCategory类型
const mapCategoryNameToNewsCategory = (categoryName: string): NewsCategory[] => {
  const categoryMap: Record<string, NewsCategory> = {
    'rules': 'rules',
    'tournament': 'tournament',
    'communication': 'communication',
    'technology': 'technology',
    '赛事': 'tournament',
    '技术': 'technology',
    '交流': 'communication',
  };
  
  const matchedCategory = categoryMap[categoryName.toLowerCase()] || '';
  return matchedCategory ? [matchedCategory] : ['default'];
};

// 将发布时间转换为相对时间
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

//默认数据
const DEFAULT_INDUSTRY_NEWS: IndustryNewsItem[] = [
  { id: 1, title: "立直麻将职业联赛新赛季规则调整", timestamp: "2小时前", category: ['rules'] },
  { id: 2, title: "国际麻将协会宣布新增赛事项目", timestamp: "3小时前", category: ['tournament'] },
  { id: 3, title: "日本职业雀士访问中国交流活动圆满结束", timestamp: "5小时前", category: ['communication'] },
  { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%", timestamp: "1天前", category: ['technology'] },
  { id: 5, title: "新一代麻将教学系统发布，采用VR技术", timestamp: "1天前", category: ['technology'] },
  { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行", timestamp: "2天前", category: ['tournament'] },
];

// 导出INDUSTRY_NEWS
export let INDUSTRY_NEWS: IndustryNewsItem[] = [...DEFAULT_INDUSTRY_NEWS];

// 从后端获取新闻数据
export const fetchIndustryNews = async (): Promise<IndustryNewsItem[]> => {
  try {
    const response = await axios.get<Article[]>(`${API_BASE_URL}/news_api/articles/`);
    
    const transformedNews: IndustryNewsItem[] = response.data
      .map(article => ({
        id: article.id,
        title: article.title,
        timestamp: formatRelativeTime(article.published_at),
        category: mapCategoryNameToNewsCategory(article.category_name)
      }));
    
    // 更新INDUSTRY_NEWS
    INDUSTRY_NEWS = transformedNews;
    return transformedNews;
  } catch (err: any) {
    console.error('获取文章列表失败:', err);
    return DEFAULT_INDUSTRY_NEWS;
  }
};

const M_LEAGUE_TEAMS = [
  { rank: 1, teamName: "風林火山", score: "+602.5" },
  { rank: 2, teamName: "麻雀格闘倶楽部", score: "+495.8" },
  { rank: 3, teamName: "BEAST", score: "+54.1" },
  { rank: 4, teamName: "ドリブンズ", score: "+8.2" },
  { rank: 5, teamName: "Pirates", score: "-92.6" },
  { rank: 6, teamName: "ROYAL", score: "-156.3" },
  { rank: 7, teamName: "e-MA", score: "-210.7" },
  { rank: 8, teamName: "AGAINST", score: "-701.0" },
];

export const MAJSOUL_NEWS = [
  { 
    id: 1,
    title: "新活动登场：姬川响的游戏机", 
    subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
    imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
  },
  { 
    id: 2,
    title: "版本更新公告 v2.0.1", 
    subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
    imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update"
  },
  { 
    id: 3,
    title: "夏季锦标赛报名启动", 
    subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
    imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
  },
  { 
    id: 4,
    title: "新角色「望月凛」上线", 
    subtitle: "全新角色加入雀魂大家庭，自带专属语音和特殊动作",
    imageUrl: "https://placehold.co/100x70/f59e0b/ffffff?text=Character"
  },
];

export default function NewsPage() {
    const { theme } = useTheme();
    const location = useLocation();
    const [industryNews, setIndustryNews] = useState<IndustryNewsItem[]>(INDUSTRY_NEWS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 获取文章列表
    useEffect(() => {
      const fetchArticles = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const news = await fetchIndustryNews();
          setIndustryNews(news);
        } catch (err: any) {
          console.error('获取文章列表失败:', err);
          setError('获取文章列表失败，请稍后重试');
          setIndustryNews(DEFAULT_INDUSTRY_NEWS);
        } finally {
          setLoading(false);
        }
      };

      fetchArticles();
    }, []);

    // 锚点滚动效果
    useEffect(() => {
      const timer = setTimeout(() => {
          if (location.hash) {
              const id = location.hash.replace('#', '');
              const element = document.getElementById(id);
              if (element) {
                  element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                  });
              }
          }
      }, 100);
      
      return () => clearTimeout(timer);
    }, [location.hash]);

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
            id="industry-news"
            title="行业资讯"
            description="立直麻将相关的最新行业动态与赛事信息"
            className="mb-8"
          >
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-slate-600 dark:text-slate-400">加载中...</div>
              </div>
            ) : error ? (
              <div className="text-red-600 dark:text-red-400 text-center py-4">{error}</div>
            ) : (
              <>
                <div className="space-y-3">
                  {industryNews.slice(0,6).map(news => (
                    <ProNews 
                      key={news.id}
                      id={news.id} 
                      title={news.title} 
                      timestamp={news.timestamp} 
                      category={news.category}
                    />
                  ))}
                </div>
                <div className="mt-4 text-right">
                  {/* 跳转时添加页码参数 */}
                  <Link 
                    to="/news/archive?page=1"  // 添加page参数
                    className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400"
                  >
                    查看全部资讯 →
                  </Link>
                </div>
              </>
            )}
          </ModuleContainer>
          
          {/* M-League联赛积分榜 */}
          <ModuleContainer
            id="m-league"
            title="M-League联赛积分榜"
            description="2023赛季最新积分排名情况"
            className="mb-8"
          >
            <div className="space-y-2">
              {M_LEAGUE_TEAMS.map(team => (
                <TeamRank 
                  key={team.rank} 
                  rank={team.rank} 
                  teamName={team.teamName} 
                  score={team.score} 
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                数据更新时间：2025-11-26 10:30
              </p>
              <Link to="/news/m-league" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
                查看详细数据 →
              </Link>
            </div>
          </ModuleContainer>
          
          {/* 雀魂游戏信息 */}
          <ModuleContainer
            id="majsoul"
            title="雀魂游戏信息"
            description="最新游戏更新、活动与赛事信息"
          >
            <div className="space-y-4">
              {MAJSOUL_NEWS.map((news, index) => (
                <GameInfoCard 
                  key={index}
                  title={news.title}
                  subtitle={news.subtitle}
                  imageUrl={news.imageUrl}
                />
              ))}
            </div>
            <div className="mt-4 text-right">
              <Link to="/news/majsoul" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
                查看全部游戏动态 →
              </Link>
            </div>
          </ModuleContainer>
        </main>
      </>
    );
}
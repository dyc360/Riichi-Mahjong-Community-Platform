import { Link, useLocation } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, NewsSubModule, ProNews, TeamRank, GameInfoCard, MainNavigation } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 模拟更多新闻数据
const INDUSTRY_NEWS = [
  { id: 1, title: "立直麻将职业联赛新赛季规则调整", timestamp: "2小时前" },
  { id: 2, title: "国际麻将协会宣布新增赛事项目", timestamp: "3小时前" },
  { id: 3, title: "日本职业雀士访问中国交流活动圆满结束", timestamp: "5小时前" },
  { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%", timestamp: "1天前" },
  { id: 5, title: "新一代麻将教学系统发布，采用VR技术", timestamp: "1天前" },
  { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行", timestamp: "2天前" },
];

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

const MAJSOUL_NEWS = [
  { 
    title: "新活动登场：姬川响的游戏机", 
    subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
    imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
  },
  { 
    title: "版本更新公告 v2.0.1", 
    subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
    imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update"
  },
  { 
    title: "夏季锦标赛报名启动", 
    subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
    imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
  },
  { 
    title: "新角色「望月凛」上线", 
    subtitle: "全新角色加入雀魂大家庭，自带专属语音和特殊动作",
    imageUrl: "https://placehold.co/100x70/f59e0b/ffffff?text=Character"
  },
];

export default function NewsPage() {
    const { theme } = useTheme();
    
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
              {INDUSTRY_NEWS.map(news => (
                <ProNews 
                  key={news.id} 
                  title={news.title} 
                  timestamp={news.timestamp} 
                />
              ))}
            </div>
            <div className="mt-4 text-right">
              <Link to="/news/archive" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
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
                数据更新时间：2023-06-15 18:30
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
              {MAJSOUL_NEWS.map((news, index) => (
                <GameInfoCard 
                  key={index}
                  title={news.title}
                  subtitle={news.subtitle}
                  imageUrl={news.imageUrl}
                  link={`/news/majsoul/${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-4 text-right">
              <Link to="/news/majsoul/all" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
                查看全部游戏动态 →
              </Link>
            </div>
          </ModuleContainer>
        </main>
      </>
    );
}



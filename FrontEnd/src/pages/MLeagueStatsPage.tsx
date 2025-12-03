import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 队伍详细统计数据
const TEAM_STATS = [
  {
    teamName: "風林火山",
    logo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
    总场次: 40,
    胜场: 28,
    负场: 12,
    胜率: "70.0%",
    总得分: 602.5,
    场均得分: 15.06,
    满贯率: 15.2,
    立直率: 21.3,
    和牌率: 28.7,
    放铳率: 12.3,
    流局率: 18.5
  },
  {
    teamName: "麻雀格闘倶楽部",
    logo: "https://placehold.co/40x40/10b981/ffffff?text=格",
    总场次: 40,
    胜场: 25,
    负场: 15,
    胜率: "62.5%",
    总得分: 495.8,
    场均得分: 12.39,
    满贯率: 14.5,
    立直率: 20.1,
    和牌率: 26.4,
    放铳率: 13.1,
    流局率: 19.2
  },
  {
    teamName: "BEAST",
    logo: "https://placehold.co/40x40/6366f1/ffffff?text=猛",
    总场次: 40,
    胜场: 20,
    负场: 20,
    胜率: "50.0%",
    总得分: 54.1,
    场均得分: 1.35,
    满贯率: 13.8,
    立直率: 19.7,
    和牌率: 24.8,
    放铳率: 14.5,
    流局率: 17.8
  },
  {
    teamName: "ドリブンズ",
    logo: "https://placehold.co/40x40/ec4899/ffffff?text=駆",
    总场次: 40,
    胜场: 19,
    负场: 21,
    胜率: "47.5%",
    总得分: 8.2,
    场均得分: 0.21,
    满贯率: 14.2,
    立直率: 20.5,
    和牌率: 23.9,
    放铳率: 15.2,
    流局率: 18.1
  },
  {
    teamName: "Pirates",
    logo: "https://placehold.co/40x40/fbbf24/ffffff?text=海",
    总场次: 40,
    胜场: 17,
    负场: 23,
    胜率: "42.5%",
    总得分: -92.6,
    场均得分: -2.32,
    满贯率: 13.4,
    立直率: 19.2,
    和牌率: 22.7,
    放铳率: 16.4,
    流局率: 19.7
  },
  {
    teamName: "ROYAL",
    logo: "https://placehold.co/40x40/8b5cf6/ffffff?text=王",
    总场次: 40,
    胜场: 16,
    负场: 24,
    胜率: "40.0%",
    总得分: -156.3,
    场均得分: -3.91,
    满贯率: 12.8,
    立直率: 18.4,
    和牌率: 21.5,
    放铳率: 17.1,
    流局率: 20.3
  },
  {
    teamName: "e-MA",
    logo: "https://placehold.co/40x40/14b8a6/ffffff?text=电",
    总场次: 40,
    胜场: 14,
    负场: 26,
    胜率: "35.0%",
    总得分: -210.7,
    场均得分: -5.27,
    满贯率: 12.3,
    立直率: 18.9,
    和牌率: 20.8,
    放铳率: 17.8,
    流局率: 21.1
  },
  {
    teamName: "AGAINST",
    logo: "https://placehold.co/40x40/ef4444/ffffff?text=抗",
    总场次: 40,
    胜场: 11,
    负场: 29,
    胜率: "27.5%",
    总得分: -701.0,
    场均得分: -17.53,
    满贯率: 11.2,
    立直率: 17.6,
    和牌率: 19.3,
    放铳率: 19.5,
    流局率: 22.4
  }
];

// 选手排名数据
const PLAYER_RANKINGS = {
  平均得点: [
    { rank: 1, name: "風林火山-选手一", team: "風林火山", value: 12.5 },
    { rank: 2, name: "麻雀格闘倶楽部-选手一", team: "麻雀格闘倶楽部", value: 10.3 },
    { rank: 3, name: "BEAST-选手一", team: "BEAST", value: 9.7 },
    { rank: 4, name: "ドリブンズ-选手一", team: "ドリブンズ", value: 7.6 },
    { rank: 5, name: "Pirates-选手一", team: "Pirates", value: 6.8 },
  ],
  满贯率: [
    { rank: 1, name: "風林火山-选手一", team: "風林火山", value: 18.3 },
    { rank: 2, name: "BEAST-选手一", team: "BEAST", value: 17.2 },
    { rank: 3, name: "麻雀格闘倶楽部-选手一", team: "麻雀格闘倶楽部", value: 16.7 },
    { rank: 4, name: "ドリブンズ-选手一", team: "ドリブンズ", value: 15.9 },
    { rank: 5, name: "麻雀格闘倶楽部-选手二", team: "麻雀格闘倶楽部", value: 15.2 },
  ],
  立直率: [
    { rank: 1, name: "風林火山-选手一", team: "風林火山", value: 25.7 },
    { rank: 2, name: "BEAST-选手一", team: "BEAST", value: 24.6 },
    { rank: 3, name: "麻雀格闘倶楽部-选手一", team: "麻雀格闘倶楽部", value: 23.4 },
    { rank: 4, name: "ドリブンズ-选手一", team: "ドリブンズ", value: 22.8 },
    { rank: 5, name: "風林火山-选手二", team: "風林火山", value: 22.1 },
  ],
  和牌率: [
    { rank: 1, name: "風林火山-选手一", team: "風林火山", value: 32.4 },
    { rank: 2, name: "BEAST-选手一", team: "BEAST", value: 30.1 },
    { rank: 3, name: "麻雀格闘倶楽部-选手一", team: "麻雀格闘倶楽部", value: 28.7 },
    { rank: 4, name: "ドリブンズ-选手二", team: "ドリブンズ", value: 27.5 },
    { rank: 5, name: "麻雀格闘倶楽部-选手二", team: "麻雀格闘倶楽部", value: 26.8 },
  ]
};

export default function MLeagueStatsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeRanking, setActiveRanking] = useState("平均得点");

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <HomePageHeader />
      
      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回M-League首页
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League详细数据统计</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">2025赛季队伍与选手全面数据分析</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 数据概览卡片 */}
          <div className="lg:col-span-1 space-y-4">
            <ModuleContainer title="联赛概览" description="M-League联赛基本情况">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">参赛队伍</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">8支</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">总比赛场数</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">120场</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">已完成场数</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">40场</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">剩余场数</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">80场</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">平均每场得分</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">42.8点</span>
                </div>
              </div>
            </ModuleContainer>
            
            {/* 最高得分队伍 */}
            <ModuleContainer title="最高得分队伍" description="">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://placehold.co/40x40/f59e0b/ffffff?text=風" alt="風林火山" className="w-10 h-10 rounded-full" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">風林火山</h4>
                    <p className="text-sm text-green-600 dark:text-green-400">+602.5点</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </ModuleContainer>
          </div>
          
          {/* 队伍统计表格 */}
          <div className="lg:col-span-2">
            <ModuleContainer title="队伍详细统计" description="各队伍技术指标对比">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-indigo-50 dark:bg-slate-700">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">队伍</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">总场次</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">胜率</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">总得分</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">满贯率(%)</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">立直率(%)</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">和牌率(%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                    {TEAM_STATS.map((team, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img src={team.logo} alt={team.teamName} className="w-6 h-6 rounded-full" />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{team.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.总场次}</td>
                        <td className="py-3 px-4 text-center text-sm font-medium">{team.胜率}</td>
                        <td className={`py-3 px-4 text-center text-sm font-medium ${
                          team.总得分 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                        }`}>
                          {team.总得分 >= 0 ? '+' : ''}{team.总得分}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.满贯率}</td>
                        <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.立直率}</td>
                        <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.和牌率}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ModuleContainer>
          </div>
        </div>
        
        {/* 选手排名 */}
        <ModuleContainer title="选手排行榜" description="按不同技术指标的选手排名">
          <div className="mb-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-1">
              {Object.keys(PLAYER_RANKINGS).map((rankType) => (
                <button
                  key={rankType}
                  onClick={() => setActiveRanking(rankType)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeRanking === rankType
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 border-b-0'
                      : 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {rankType}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-indigo-50 dark:bg-slate-700">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">排名</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">选手</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">所属队伍</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {activeRanking === "平均得点" ? "平均得点" : `${activeRanking}(%)`}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {PLAYER_RANKINGS[activeRanking as keyof typeof PLAYER_RANKINGS].map((player) => (
                  <tr 
                    key={player.rank} 
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer"
                    onClick={() => navigate(`/players/${player.rank}`)}
                  >
                    <td className="py-3 px-4 text-sm font-medium">
                      <span className="inline-block w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-1"
                        style={{
                          backgroundColor: player.rank === 1 ? '#f59e0b' : 
                                        player.rank === 2 ? '#94a3b8' : 
                                        player.rank === 3 ? '#d97706' : '#e5e7eb'
                        }}>
                        {player.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{player.name}</td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{player.team}</td>
                    <td className={`py-3 px-4 text-right text-sm font-medium ${
                      activeRanking === "平均得点" 
                        ? player.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {activeRanking === "平均得点" ? (player.value >= 0 ? '+' : '') + player.value : player.value + '%'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ModuleContainer>
      </main>
    </>
  );
}
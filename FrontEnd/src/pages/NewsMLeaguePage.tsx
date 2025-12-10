import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer, TeamRank } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// M-League队伍详细数据
const M_LEAGUE_TEAMS_DETAILED = [
    { 
      rank: 1, 
      teamName: "風林火山", 
      score: "+602.5",
      wins: 28,
      losses: 12,
      winRate: "70.0%",
      logo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
      players: [
        { id: 101, name: "風林火山-选手一", avgScore: 12.5, manganRate: 18.3, riichiRate: 25.7 },
        { id: 102, name: "風林火山-选手二", avgScore: 8.2, manganRate: 15.6, riichiRate: 22.1 },
        { id: 103, name: "風林火山-选手三", avgScore: 5.7, manganRate: 14.2, riichiRate: 19.8 },
        { id: 104, name: "風林火山-选手四", avgScore: -2.1, manganRate: 12.8, riichiRate: 17.5 }
      ]
    },
    { 
      rank: 2, 
      teamName: "麻雀格闘倶楽部", 
      score: "+495.8",
      wins: 25,
      losses: 15,
      winRate: "62.5%",
      logo: "https://placehold.co/40x40/10b981/ffffff?text=格",
      players: [
        { id: 201, name: "麻雀格闘倶楽部-选手一", avgScore: 10.3, manganRate: 16.7, riichiRate: 23.4 },
        { id: 202, name: "麻雀格闘倶楽部-选手二", avgScore: 7.8, manganRate: 15.2, riichiRate: 21.3 },
        { id: 203, name: "麻雀格闘倶楽部-选手三", avgScore: 4.2, manganRate: 13.5, riichiRate: 18.9 },
        { id: 204, name: "麻雀格闘倶楽部-选手四", avgScore: -1.5, manganRate: 11.9, riichiRate: 16.2 }
      ]
    },
    { 
      rank: 3, 
      teamName: "BEAST", 
      score: "+54.1",
      wins: 20,
      losses: 20,
      winRate: "50.0%",
      logo: "https://placehold.co/40x40/6366f1/ffffff?text=猛",
      players: [
        { id: 301, name: "BEAST-选手一", avgScore: 9.7, manganRate: 17.2, riichiRate: 24.6 },
        { id: 302, name: "BEAST-选手二", avgScore: 3.5, manganRate: 14.8, riichiRate: 20.5 },
        { id: 303, name: "BEAST-选手三", avgScore: -2.3, manganRate: 12.4, riichiRate: 17.8 },
        { id: 304, name: "BEAST-选手四", avgScore: -4.8, manganRate: 10.9, riichiRate: 15.3 }
      ]
    },
    { 
      rank: 4, 
      teamName: "ドリブンズ", 
      score: "+8.2",
      wins: 19,
      losses: 21,
      winRate: "47.5%",
      logo: "https://placehold.co/40x40/ec4899/ffffff?text=駆",
      players: [
        { id: 401, name: "ドリブンズ-选手一", avgScore: 7.6, manganRate: 15.9, riichiRate: 22.8 },
        { id: 402, name: "ドリブンズ-选手二", avgScore: 5.2, manganRate: 14.5, riichiRate: 20.1 },
        { id: 403, name: "ドリブンズ-选手三", avgScore: -3.1, manganRate: 13.2, riichiRate: 18.4 },
        { id: 404, name: "ドリブンズ-选手四", avgScore: -9.5, manganRate: 11.3, riichiRate: 16.7 }
      ]
    },
    { 
      rank: 5, 
      teamName: "Pirates", 
      score: "-92.6",
      wins: 17,
      losses: 23,
      winRate: "42.5%",
      logo: "https://placehold.co/40x40/fbbf24/ffffff?text=海",
      players: [
        { id: 501, name: "Pirates-选手一", avgScore: 6.8, manganRate: 14.7, riichiRate: 21.5 },
        { id: 502, name: "Pirates-选手二", avgScore: 2.1, manganRate: 13.3, riichiRate: 19.2 },
        { id: 503, name: "Pirates-选手三", avgScore: -5.4, manganRate: 11.8, riichiRate: 17.1 },
        { id: 504, name: "Pirates-选手四", avgScore: -12.1, manganRate: 9.6, riichiRate: 14.9 }
      ]
    },
    { 
      rank: 6, 
      teamName: "ROYAL", 
      score: "-156.3",
      wins: 16,
      losses: 24,
      winRate: "40.0%",
      logo: "https://placehold.co/40x40/8b5cf6/ffffff?text=王",
      players: [
        { id: 601, name: "ROYAL-选手一", avgScore: 5.3, manganRate: 13.9, riichiRate: 20.7 },
        { id: 602, name: "ROYAL-选手二", avgScore: 1.2, manganRate: 12.5, riichiRate: 18.3 },
        { id: 603, name: "ROYAL-选手三", avgScore: -6.8, manganRate: 10.7, riichiRate: 16.5 },
        { id: 604, name: "ROYAL-选手四", avgScore: -17.0, manganRate: 8.9, riichiRate: 13.8 }
      ]
    },
    { 
      rank: 7, 
      teamName: "e-MA", 
      score: "-210.7",
      wins: 14,
      losses: 26,
      winRate: "35.0%",
      logo: "https://placehold.co/40x40/14b8a6/ffffff?text=电",
      players: [
        { id: 701, name: "e-MA-选手一", avgScore: 4.5, manganRate: 13.1, riichiRate: 19.9 },
        { id: 702, name: "e-MA-选手二", avgScore: -0.8, manganRate: 11.6, riichiRate: 17.4 },
        { id: 703, name: "e-MA-选手三", avgScore: -8.2, manganRate: 9.9, riichiRate: 15.6 },
        { id: 704, name: "e-MA-选手四", avgScore: -21.2, manganRate: 8.1, riichiRate: 12.9 }
      ]
    },
    { 
      rank: 8, 
      teamName: "AGAINST", 
      score: "-701.0",
      wins: 11,
      losses: 29,
      winRate: "27.5%",
      logo: "https://placehold.co/40x40/ef4444/ffffff?text=抗",
      players: [
        { id: 801, name: "AGAINST-选手一", avgScore: 3.2, manganRate: 12.3, riichiRate: 18.8 },
        { id: 802, name: "AGAINST-选手二", avgScore: -3.5, manganRate: 10.8, riichiRate: 16.3 },
        { id: 803, name: "AGAINST-选手三", avgScore: -15.7, manganRate: 9.1, riichiRate: 14.5 },
        { id: 804, name: "AGAINST-选手四", avgScore: -57.2, manganRate: 7.3, riichiRate: 11.8 }
      ]
    }
  ];

// 最近比赛结果
const RECENT_MATCHES = [
  { id: 1, date: "2025-11-25", time: "14:00", teamA: "風林火山", scoreA: 2, teamB: "AGAINST", scoreB: 1 },
  { id: 2, date: "2025-11-24", time: "14:00", teamA: "麻雀格闘倶楽部", scoreA: 2, teamB: "ROYAL", scoreB: 1 },
  { id: 3, date: "2025-11-23", time: "19:00", teamA: "BEAST", scoreA: 3, teamB: "AGAINST", scoreB: 0 },
  { id: 4, date: "2025-11-22", time: "14:00", teamA: "BEAST", scoreA: 1, teamB: "e-MA", scoreB: 2 },
  { id: 5, date: "2025-11-21", time: "14:00", teamA: "風林火山", scoreA: 2, teamB: "麻雀格闘倶楽部", scoreB: 1 }
];

// 即将到来的比赛
const UPCOMING_MATCHES = [
  { id: 101, date: "2025-11-27", time: "14:00", teamA: "Pirates", teamB: "BEAST" },
  { id: 102, date: "2025-11-28", time: "19:00", teamA: "ドリブンズ", teamB: "ROYAL" },
  { id: 103, date: "2025-11-29", time: "14:00", teamA: "e-MA", teamB: "風林火山" },
  { id: 104, date: "2025-11-30", time: "19:00", teamA: "AGAINST", teamB: "麻雀格闘倶楽部" }
];

export default function MLeaguePage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  const handleGoBack = () => {
    navigate(-1);
  };

  // 切换队伍详情显示
  const toggleTeamDetails = (rank: number) => {
    setSelectedTeam(selectedTeam === rank ? null : rank);
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League联赛</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">2025赛季最新数据与选手表现分析</p>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              数据更新时间：2025-11-26 10:30
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/news/m-league/schedule" 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              完整赛程
            </Link>
            <Link 
              to="/news/m-league/stats" 
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              详细数据统计
            </Link>
          </div>
        </div>

        {/* 联赛积分榜 */}
        <ModuleContainer
          title="2025赛季积分榜"
          description="各队累计得分排名（正分为胜分，负分为失分）"
          className="mb-8"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-indigo-50 dark:bg-slate-700">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">排名</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">队伍</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">总分</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">胜场</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">负场</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">胜率</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {M_LEAGUE_TEAMS_DETAILED.map(team => (
                  <Fragment key={team.rank}>
                    <tr 
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer"
                      onClick={() => toggleTeamDetails(team.rank)}
                    >
                      <td className="py-3 px-4 text-sm font-medium">
                        <span className={team.rank <= 3 ? "inline-block w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mr-1" : ""}
                          style={{
                            backgroundColor: team.rank === 1 ? '#f59e0b' : 
                                          team.rank === 2 ? '#94a3b8' : 
                                          team.rank === 3 ? '#d97706' : 'transparent'
                          }}>
                          {team.rank <= 3 ? team.rank : ""}
                        </span>
                        {team.rank > 3 ? team.rank : ""}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img src={team.logo} alt={team.teamName} className="w-6 h-6 rounded-full" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{team.teamName}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right text-sm font-medium ${
                        team.score.startsWith('-') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {team.score}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.wins}</td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{team.losses}</td>
                      <td className="py-3 px-4 text-center text-sm font-medium">{team.winRate}</td>
                      <td className="py-3 px-4 text-center">
                        <svg className={`w-4 h-4 text-slate-500 transition-transform ${selectedTeam === team.rank ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </td>
                    </tr>
                    
                    {/* 选手详情 */}
                    {selectedTeam === team.rank && (
                      <tr>
                        <td colSpan={7} className="p-0 border-t-0">
                          <div className="bg-gray-50 dark:bg-slate-800/60 p-4 border-t border-gray-200 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">队伍选手数据</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {team.players.map(player => (
                                <div key={player.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{player.name}</p>
                                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                    <p>平均得点: <span className={player.avgScore >= 0 ? 'text-green-600' : 'text-red-500'}>{player.avgScore}</span></p>
                                    <p>满贯率: {player.manganRate}%</p>
                                    <p>立直率: {player.riichiRate}%</p>
                                  </div>
                                  <Link to={`/players/${player.name}`} className="mt-2 inline-block text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
                                    查看详情 →
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ModuleContainer>

        {/* 最近比赛结果 */}
        <ModuleContainer
          title="最近比赛结果"
          description="过去5场比赛的胜负情况"
          className="mb-8"
        >
          <div className="space-y-3">
            {RECENT_MATCHES.map(match => (
              <div key={match.id} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mb-2 sm:mb-0">
                  {match.date}
                </div>
                <div className="flex items-center justify-center flex-1">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamA}</p>
                  </div>
                  <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded text-sm font-medium border border-gray-200 dark:border-slate-600 min-w-[60px] text-center">
                    {match.scoreA} - {match.scoreB}
                  </div>
                  <div className="text-left ml-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamB}</p>
                  </div>
                </div>
                <div className="w-full sm:w-auto mt-2 sm:mt-0 text-right">
                  <button onClick={() => navigate(`/matches/${match.date}/${match.teamA}VS${match.teamB}`, {
                    state: {
                      scoreA: match.scoreA,
                      scoreB: match.scoreB,
                      time: match.time,
                    }
                    })} className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
                    查看详情 →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ModuleContainer>

        {/* 即将到来的比赛 */}
        <ModuleContainer
          title="即将到来的比赛"
          description="未来4场赛程安排"
        >
          <div className="space-y-3">
            {UPCOMING_MATCHES.map(match => (
              <div key={match.id} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mb-2 sm:mb-0">
                  {match.date} {match.time}
                </div>
                <div className="flex items-center justify-center flex-1">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamA}</p>
                  </div>
                  <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 min-w-[60px] text-center">
                    VS
                  </div>
                  <div className="text-left ml-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamB}</p>
                  </div>
                </div>
        
                {/* <div className="w-full sm:w-auto mt-2 sm:mt-0 text-right">
                  <button className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
                    预约提醒
                  </button>
                </div>*/}
              </div> 
            ))}
          </div>
        </ModuleContainer>
      </main>
    </>
  );
}
import { useState } from 'react';
import { Link, useNavigate, type PathMatch } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 完整赛程数据
const COMPLETE_SCHEDULE = [
  {
    date: "2025-11-21",
    day: "周五",
    matches: [
      { id: 1001, time: "14:00", teamA: "風林火山", teamB: "麻雀格闘倶楽部", status: "completed", scoreA: 2, scoreB: 1 },
      { id: 1002, time: "19:00", teamA: "Pirates", teamB: "AGAINST", status: "completed", scoreA: 2, scoreB: 1 }
    ]
  },
  {
    date: "2025-11-22",
    day: "周六",
    matches: [
      { id: 1003, time: "14:00", teamA: "BEAST", teamB: "e-MA", status: "completed", scoreA: 1, scoreB: 2 },
      { id: 1004, time: "19:00", teamA: "ROYAL", teamB: "ドリブンズ", status: "completed", scoreA: 1, scoreB: 2 }
    ]
  },
  {
    date: "2025-11-23",
    day: "周日",
    matches: [
      { id: 1005, time: "14:00", teamA: "風林火山", teamB: "Pirates", status: "completed", scoreA: 3, scoreB: 0 },
      { id: 1006, time: "19:00", teamA: "BEAST", teamB: "AGAINST", status: "completed", scoreA: 3, scoreB: 0 }
    ]
  },
  {
    date: "2025-11-24",
    day: "周一",
    matches: [
      { id: 1007, time: "14:00", teamA: "麻雀格闘倶楽部", teamB: "ROYAL", status: "completed", scoreA: 2, scoreB: 1 },
      { id: 1008, time: "19:00", teamA: "ドリブンズ", teamB: "e-MA", status: "completed", scoreA: 2, scoreB: 1 }
    ]
  },
  {
    date: "2025-11-25",
    day: "周二",
    matches: [
      { id: 1009, time: "14:00", teamA: "風林火山", teamB: "AGAINST", status: "completed", scoreA: 2, scoreB: 1 },
      { id: 1010, time: "19:00", teamA: "麻雀格闘倶楽部", teamB: "ドリブンズ", status: "completed", scoreA: 2, scoreB: 1 }
    ]
  },
  {
    date: "2025-11-27",
    day: "周四",
    matches: [
      { id: 1011, time: "14:00", teamA: "Pirates", teamB: "BEAST", status: "upcoming", scoreA: 0, scoreB: 0 },
      { id: 1012, time: "19:00", teamA: "e-MA", teamB: "ROYAL", status: "upcoming", scoreA: 0, scoreB: 0 }
    ]
  },
  {
    date: "2025-11-28",
    day: "周五",
    matches: [
      { id: 1013, time: "14:00", teamA: "風林火山", teamB: "e-MA", status: "upcoming", scoreA: 0, scoreB: 0 },
      { id: 1014, time: "19:00", teamA: "ドリブンズ", teamB: "ROYAL", status: "upcoming", scoreA: 0, scoreB: 0 }
    ]
  },
  {
    date: "2025-11-29",
    day: "周六",
    matches: [
      { id: 1015, time: "14:00", teamA: "麻雀格闘倶楽部", teamB: "Pirates", status: "upcoming", scoreA: 0, scoreB: 0 },
      { id: 1016, time: "19:00", teamA: "AGAINST", teamB: "BEAST", status: "upcoming", scoreA: 0, scoreB: 0 }
    ]
  },
  {
    date: "2025-11-30",
    day: "周日",
    matches: [
      { id: 1017, time: "14:00", teamA: "ROYAL", teamB: "風林火山", status: "upcoming", scoreA: 0, scoreB: 0 },
      { id: 1018, time: "19:00", teamA: "AGAINST", teamB: "麻雀格闘倶楽部", status: "upcoming", scoreA: 0, scoreB: 0 }
    ]
  },
  {
    date: "2025-12-01",
    day: "周一",
    matches: [
      { id: 1019, time: "14:00", teamA: "e-MA", teamB: "Pirates", status: "upcoming", scoreA: 0, scoreB: 0 },
      { id: 1020, time: "19:00", teamA: "BEAST", teamB: "ドリブンズ", status: "upcoming", scoreA: 0, scoreB: 0 }
    ]
  }
];

// 队伍列表
const TEAMS = [
  "全部队伍", "風林火山", "麻雀格闘倶楽部", "BEAST", "ドリブンズ", "Pirates", "ROYAL", "e-MA", "AGAINST"
];

export default function MLeagueSchedulePage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState("全部队伍");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleGoBack = () => {
    navigate(-1);
  };

  // 筛选赛程
  const filteredSchedule = COMPLETE_SCHEDULE.map(day => {
    // 筛选比赛
    const filteredMatches = day.matches.filter(match => {
      // 队伍筛选
      if (selectedTeam !== "全部队伍" && 
          match.teamA !== selectedTeam && 
          match.teamB !== selectedTeam) {
        return false;
      }
      
      // 状态筛选
      if (statusFilter === "completed" && match.status !== "completed") return false;
      if (statusFilter === "upcoming" && match.status !== "upcoming") return false;
      
      return true;
    });
    
    // 返回包含筛选后比赛的日期对象
    return {
      ...day,
      matches: filteredMatches
    };
  }).filter(day => day.matches.length > 0); 

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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League完整赛程</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">2025赛季所有比赛安排与结果</p>
        
        {/* 筛选器 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">队伍筛选</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                {TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">比赛状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                <option value="all">全部比赛</option>
                <option value="completed">已完成</option>
                <option value="upcoming">即将开始</option>
              </select>
            </div>
          </div>
        </div>

        {/* 赛程列表 */}
        <ModuleContainer title="比赛安排" description="按日期排序的完整赛程表">
          {filteredSchedule.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">没有找到符合条件的比赛</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSchedule.map(day => (
                <div key={day.date} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="bg-indigo-50 dark:bg-slate-700 py-3 px-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {day.date} ({day.day})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {day.matches.map(match => (
                      <div 
                        key={match.id} 
                        className="flex flex-wrap items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <span className={`text-xs font-medium py-1 px-2 rounded-full mr-4 ${
                            match.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {match.status === 'completed' ? '已结束' : '未开始'}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[60px]">{match.time}</span>
                        </div>
                        <div className="flex items-center justify-center flex-1 mx-4">
                          <div className="text-right mr-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamA}</p>
                          </div>
                          <div className="px-3 py-1 bg-white dark:bg-slate-700 rounded text-sm font-medium border border-gray-200 dark:border-slate-600 min-w-[80px] text-center">
                            {match.status === 'completed' 
                              ? `${match.scoreA} - ${match.scoreB}` 
                              : 'VS'}
                          </div>
                          <div className="text-left ml-4">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{match.teamB}</p>
                          </div>
                        </div>
                        {match.status === 'completed' ? 
                        <div className="mt-2 sm:mt-0">
                          <button onClick={() => navigate(`/matches/${day.date}/${match.teamA}VS${match.teamB}`, {
                            state: {
                              scoreA: match.scoreA,
                              scoreB: match.scoreB,
                              time: match.time,
                            }
                          })} className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
                            查看详情 →
                          </button>
                        </div> :
                        <div />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModuleContainer>
        
        {/* 赛程说明 */}
        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mt-6 border border-gray-100 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">赛程说明</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <li>• 常规赛每场比赛为3局制，先获得2局胜利的队伍获胜</li>
            <li>• 下午场比赛开始时间为14:00，晚间场比赛开始时间为19:00</li>
            <li>• 比赛结果将在比赛结束后1小时内更新</li>
            <li>• 点击比赛条目可查看详细战报和技术统计</li>
          </ul>
        </div>
      </main>
    </>
  );
}
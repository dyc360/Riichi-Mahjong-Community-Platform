import { useNavigate, useParams, useLocation } from 'react-router-dom'; // 新增 useLocation
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 默认比赛
const DEFAULT_EMPTY_MATCH = {
  date: "--",
  teamA: "暂无数据",
  teamB: "暂无数据",
  time: "--",
  status: "unknown",
  scoreA: 0,
  scoreB: 0, 
  venue: "--",
  referee: "--",
  audience: "--",
  matchStats: {
    总对局数: "--",
    平均局長戦時間: "--",
    总手役数: "--",
    满贯以上手役: "--",
    役满数: "--",
    流局数: "--",
    平均符数: "--",
    平均番数: "--"
  },
  teamAStats: {
    立直率: "--",
    和牌率: "--",
    放铳率: "--",
    自摸率: "--",
    荣和率: "--",
    流局率: "--",
    役牌使用率: "--",
    断幺率: "--"
  },
  teamBStats: {
    立直率: "--",
    和牌率: "--",
    放铳率: "--",
    自摸率: "--",
    荣和率: "--",
    流局率: "--",
    役牌使用率: "--",
    断幺率: "--"
  },
  playerPerformances: [
    { name: "暂无-选手一", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手二", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手三", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手四", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手五", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手六", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手七", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" },
    { name: "暂无-选手八", position: "--", 得点: "--", 和牌数: "--", 放铳数: "--", 立直数: "--", 役满数: "--", 最大连庄: "--" }
  ],
  gameRecords: [
    { 局数: "--", 局長: "--", 和牌者: "--", 手役: "--", 符数: "--", 番数: "--", 得分: "--" },
    { 局数: "--", 局長: "--", 和牌者: "--", 手役: "--", 符数: "--", 番数: "--", 得分: "--" },
    { 局数: "--", 局長: "--", 和牌者: "--", 手役: "--", 符数: "--", 番数: "--", 得分: "--" }
  ],
  isEmpty: true // 标记为空数据比赛
};

// 比赛详情数据
const MATCH_DETAILS = [
  {
    date: "2025-11-21",
    teamA: "風林火山",
    teamB: "麻雀格闘倶楽部",
    time: "14:00",
    status: "completed",
    scoreA: 2,
    scoreB: 1,
    venue: "東京マーブルガーデン",
    referee: "山田 健太",
    audience: "3,245人",
    matchStats: {
      总对局数: 3,
      平均局長戦時間: "12分35秒",
      总手役数: 18,
      满贯以上手役: 4,
      役满数: 1,
      流局数: 2,
      平均符数: 42.3,
      平均番数: 2.8
    },
    teamAStats: {
      立直率: 24.3,
      和牌率: 31.2,
      放铳率: 10.5,
      自摸率: 18.7,
      荣和率: 12.5,
      流局率: 16.8,
      役牌使用率: 28.3,
      断幺率: 35.7
    },
    teamBStats: {
      立直率: 21.8,
      和牌率: 27.5,
      放铳率: 13.2,
      自摸率: 15.3,
      荣和率: 12.2,
      流局率: 19.7,
      役牌使用率: 31.5,
      断幺率: 32.4
    },
    playerPerformances: [
      { name: "風林火山-选手一", position: "主将", 得点: "+45.3", 和牌数: 5, 放铳数: 1, 立直数: 4, 役满数: 1, 最大连庄: 3 },
      { name: "風林火山-选手二", position: "副将", 得点: "+28.7", 和牌数: 4, 放铳数: 2, 立直数: 3, 役满数: 0, 最大连庄: 2 },
      { name: "風林火山-选手三", position: "先锋", 得点: "+12.5", 和牌数: 3, 放铳数: 1, 立直数: 2, 役满数: 0, 最大连庄: 1 },
      { name: "風林火山-选手四", position: "副将", 得点: "-8.3", 和牌数: 2, 放铳数: 3, 立直数: 1, 役满数: 0, 最大连庄: 0 },
      
 
      { name: "麻雀格闘倶楽部-选手一", position: "主将", 得点: "+18.5", 和牌数: 4, 放铳数: 2, 立直数: 3, 役满数: 0, 最大连庄: 2 },
      { name: "麻雀格闘倶楽部-选手二", position: "副将", 得点: "+12.3", 和牌数: 3, 放铳数: 1, 立直数: 2, 役满数: 0, 最大连庄: 1 },
      { name: "麻雀格闘倶楽部-选手三", position: "先锋", 得点: "-6.7", 和牌数: 2, 放铳数: 3, 立直数: 1, 役满数: 0, 最大连庄: 0 },
      { name: "麻雀格闘倶楽部-选手四", position: "副将", 得点: "-24.1", 和牌数: 1, 放铳数: 4, 立直数: 1, 役满数: 0, 最大连庄: 1 }
    ],
    gameRecords: [
      { 局数: "1局", 局長: "風林火山-选手三", 和牌者: "風林火山-选手一", 手役: "断幺九・役牌", 符数: 30, 番数: 2, 得分: "+1500" },
      { 局数: "2局", 局長: "麻雀格闘倶楽部-选手三", 和牌者: "麻雀格闘倶楽部-选手一", 手役: "役牌・二飜", 符数: 25, 番数: 2, 得分: "+1200" },
      { 局数: "3局", 局長: "風林火山-选手四", 和牌者: "風林火山-选手二", 手役: "混一色・役牌", 符数: 40, 番数: 3, 得分: "+2600" },
      { 局数: "4局", 局長: "麻雀格闘倶楽部-选手四", 和牌者: "麻雀格闘倶楽部-选手二", 手役: "断幺九・役牌", 符数: 30, 番数: 2, 得分: "+1500" },
      { 局数: "5局", 局長: "風林火山-选手一", 和牌者: "風林火山-选手一", 手役: "大四喜（役满）", 符数: "役满", 番数: "役满", 得分: "+13000" },
      { 局数: "6局", 局長: "麻雀格闘倶楽部-选手一", 和牌者: "風林火山-选手三", 手役: "平和・一飜", 符数: 30, 番数: 1, 得分: "+800" },
      { 局数: "7局", 局長: "風林火山-选手二", 和牌者: "麻雀格闘倶楽部-选手一", 手役: "断幺九・役牌", 符数: 30, 番数: 2, 得分: "+1500" },
      { 局数: "8局", 局長: "麻雀格闘倶楽部-选手二", 和牌者: "風林火山-选手二", 手役: "清一色・役牌", 符数: 60, 番数: 5, 得分: "+6400" }
    ],
    isEmpty: false
  },
  {
    date: "2025-11-21",
    teamA: "Pirates",
    teamB: "AGAINST",
    time: "19:00",
    status: "completed",
    scoreA: 2,
    scoreB: 1,
    venue: "東京マーブルガーデン",
    referee: "佐藤 明",
    audience: "2,876人",
    matchStats: {
      总对局数: 3,
      平均局長戦時間: "11分42秒",
      总手役数: 15,
      满贯以上手役: 3,
      役满数: 0,
      流局数: 3,
      平均符数: 38.7,
      平均番数: 2.5
    },
    teamAStats: {
      立直率: 22.5,
      和牌率: 29.3,
      放铳率: 11.8,
      自摸率: 16.4,
      荣和率: 12.9,
      流局率: 18.3,
      役牌使用率: 26.7,
      断幺率: 33.2
    },
    teamBStats: {
      立直率: 19.7,
      和牌率: 25.8,
      放铳率: 14.5,
      自摸率: 14.2,
      荣和率: 11.6,
      流局率: 21.5,
      役牌使用率: 29.8,
      断幺率: 30.1
    },
    playerPerformances: [
      { name: "Pirates-选手一", position: "主将", 得点: "+32.7", 和牌数: 4, 放铳数: 2, 立直数: 3, 役满数: 0, 最大连庄: 2 },
      { name: "Pirates-选手二", position: "副将", 得点: "+24.5", 和牌数: 3, 放铳数: 1, 立直数: 2, 役满数: 0, 最大连庄: 1 },
      { name: "Pirates-选手三", position: "先锋", 得点: "+8.3", 和牌数: 2, 放铳数: 2, 立直数: 1, 役满数: 0, 最大连庄: 1 },
      { name: "Pirates-选手四", position: "副将", 得点: "-15.4", 和牌数: 1, 放铳数: 3, 立直数: 1, 役满数: 0, 最大连庄: 0 },

      { name: "AGAINST-选手一", position: "主将", 得点: "+12.8", 和牌数: 3, 放铳数: 2, 立直数: 2, 役满数: 0, 最大连庄: 1 },
      { name: "AGAINST-选手二", position: "副将", 得点: "-8.7", 和牌数: 2, 放铳数: 3, 立直数: 1, 役满数: 0, 最大连庄: 0 },
      { name: "AGAINST-选手三", position: "先锋", 得点: "-14.3", 和牌数: 1, 放铳数: 2, 立直数: 1, 役满数: 0, 最大连庄: 1 },
      { name: "AGAINST-选手四", position: "副将", 得点: "-12.4", 和牌数: 2, 放铳数: 3, 立直数: 0, 役满数: 0, 最大连庄: 0 }
    ],
    gameRecords: [
      { 局数: "1局", 局長: "Pirates-选手三", 和牌者: "Pirates-选手一", 手役: "断幺九", 符数: 20, 番数: 1, 得分: "+700" },
      { 局数: "2局", 局長: "AGAINST-选手三", 和牌者: "AGAINST-选手一", 手役: "役牌・一飜", 符数: 25, 番数: 1, 得分: "+500" },
      { 局数: "3局", 局長: "Pirates-选手四", 和牌者: "Pirates-选手二", 手役: "混一色", 符数: 40, 番数: 2, 得分: "+1600" },
      { 局数: "4局", 局長: "AGAINST-选手四", 和牌者: "AGAINST-选手二", 手役: "断幺九・役牌", 符数: 30, 番数: 2, 得分: "+1500" },
      { 局数: "5局", 局長: "Pirates-选手一", 和牌者: "Pirates-选手一", 手役: "满贯・断幺九", 符数: 40, 番数: 3, 得分: "+2000" },
      { 局数: "6局", 局長: "AGAINST-选手一", 和牌者: "Pirates-选手三", 手役: "平和", 符数: 30, 番数: 1, 得分: "+800" },
      { 局数: "7局", 局長: "Pirates-选手二", 和牌者: "AGAINST-选手一", 手役: "役牌・二飜", 符数: 25, 番数: 2, 得分: "+1200" },
      { 局数: "8局", 局長: "AGAINST-选手二", 和牌者: "Pirates-选手二", 手役: "混一色・役牌", 符数: 40, 番数: 3, 得分: "+2600" }
    ],
    isEmpty: false
  },
  // 其他比赛数据
];

// 解析队伍参数
const parseTeams = (teamsStr: string) => {
  const decodedStr = decodeURIComponent(teamsStr);
  const vsIndex = decodedStr.toLowerCase().indexOf('vs');
  if (vsIndex === -1) return { team1: '', team2: '' };
  const team1 = decodedStr.substring(0, vsIndex).trim();
  const team2 = decodedStr.substring(vsIndex + 2).trim();
  return { team1, team2 };
};

// 根据日期和队伍查找比赛
const getMatchByDateAndTeams = (date: string, teamsStr: string) => {
  const { team1, team2 } = parseTeams(teamsStr);
  if (!team1 || !team2) {
    return {
      ...DEFAULT_EMPTY_MATCH,
      teamA: team1 || "无效队名",
      teamB: team2 || "无效队名",
      date: date || "无效日期"
    };
  }
  const match = MATCH_DETAILS.find(m => 
    m.date === date && 
    ((m.teamA === team1 && m.teamB === team2) || (m.teamA === team2 && m.teamB === team1))
  );
  if (!match) {
    return {
      ...DEFAULT_EMPTY_MATCH,
      teamA: team1,
      teamB: team2,
      date: date
    };
  }
  return match;
};

type MatchDetailState = {
  scoreA: number;
  scoreB: number;
  time: string;
};

export default function MatchDetailPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { date, teams } = useParams<{ date: string; teams: string }>();
  // 获取上一页面传递的state数据
  const location = useLocation();
  const locationState = location.state as MatchDetailState | undefined;

  // 基础匹配
  let match = getMatchByDateAndTeams(date || "", teams || "");

  // 用上一页面传递的 state 覆盖默认值
  if (match.isEmpty && locationState) {
    match = {
      ...match,
      scoreA: locationState.scoreA ?? match.scoreA,
      scoreB: locationState.scoreB ?? match.scoreB,
      time: locationState.time ?? match.time,
    };
  }

  const handleGoBack = () => navigate(-1);

  // 生成选手所属队伍的样式类
  const getPlayerTeamClass = (playerName: string) => {
    if (match.isEmpty) return "text-slate-500 dark:text-slate-400";
    if (playerName.startsWith(match.teamA)) return "text-indigo-600 dark:text-indigo-400";
    if (playerName.startsWith(match.teamB)) return "text-rose-600 dark:text-rose-400";
    return "text-slate-700 dark:text-slate-300";
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
            返回上一页
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 比赛基本信息 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
          {/* 空数据提示 */}
          {match.isEmpty && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                该比赛的详细统计信息暂未收录，以下为基础赛事信息
              </p>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {match.teamA} vs {match.teamB}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {match.date} {match.date !== "--" && match.date !== "无效日期" ? `(${new Date(match.date).toLocaleDateString('zh-CN', { weekday: 'long' })})` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {match.time} 
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {match.venue}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{match.teamA}</p>
                <p className={`text-3xl font-bold ${match.isEmpty ? 'text-slate-700 dark:text-slate-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
                  {match.scoreA}
                </p>
              </div>
              
              <div className="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {match.status === "completed" ? "已结束" : match.status === "upcoming" ? "未开始" : match.status === "live" ? "进行中" : "暂无状态"}
                </span>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{match.teamB}</p>
                <p className={`text-3xl font-bold ${match.isEmpty ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 dark:text-rose-400'}`}>
                  {match.scoreB}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-slate-600 dark:text-slate-400">裁判：{match.referee}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-slate-600 dark:text-slate-400">观众人数：{match.audience}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-slate-600 dark:text-slate-400">
                {match.isEmpty ? (
                  match.status === "completed" ? `比赛结果：${match.scoreA > match.scoreB ? match.teamA : match.teamB} 获胜` : "比赛结果：暂无"
                ) : (
                  `比赛结果：${match.scoreA > match.scoreB ? match.teamA : match.teamB} 获胜`
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 比赛整体统计 */}
          <ModuleContainer title="比赛整体统计" className="lg:col-span-1">
            <div className="space-y-4">
              {Object.entries(match.matchStats).map(([key, value], index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{key}</span>
                  <span className={`text-lg font-bold ${match.isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </ModuleContainer>
          
          {/* 队伍技术统计对比 */}
          <ModuleContainer title="队伍技术统计对比" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-indigo-50 dark:bg-slate-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">技术指标</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-indigo-700 dark:text-indigo-300">{match.teamA}</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-rose-700 dark:text-rose-300">{match.teamB}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {Object.entries(match.teamAStats).map(([key, valueA], index) => {
                    const valueB = match.teamBStats[key as keyof typeof match.teamBStats];
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                        <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{key}</td>
                        <td className={`py-3 px-4 text-center text-sm font-medium ${match.isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          {valueA}
                          {valueA !== "--" ? "%" : ""}
                        </td>
                        <td className={`py-3 px-4 text-center text-sm font-medium ${match.isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {valueB}
                          {valueB !== "--" ? "%" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ModuleContainer>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 选手个人表现 */}
          <ModuleContainer title="选手个人表现" description={match.isEmpty ? "暂无选手数据" : "所有参赛选手的详细数据统计"}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-indigo-50 dark:bg-slate-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">选手</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">位置</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">得点</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">和牌数</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">立直数</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">役满数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {match.playerPerformances.map((player, index) => (
                    <tr 
                      key={index} 
                      className={`hover:bg-gray-50 dark:hover:bg-slate-800/60 ${match.isEmpty ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => !match.isEmpty && navigate(`/players/${encodeURIComponent(player.name)}`)}
                    >
                      <td className="py-3 px-4 text-sm font-medium">
                        <span className={getPlayerTeamClass(player.name)}>{player.name}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-600 dark:text-slate-400">{player.position}</td>
                      <td className={`py-3 px-4 text-center text-sm font-medium ${
                        match.isEmpty ? 'text-slate-500 dark:text-slate-400' :
                        player.得点.startsWith('+') ? 'text-green-600 dark:text-green-400' : 
                        player.得点.startsWith('-') ? 'text-red-500 dark:text-red-400' :
                        'text-slate-700 dark:text-slate-300'
                      }`}>
                        {player.得点}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{player.和牌数}</td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{player.立直数}</td>
                      <td className={`py-3 px-4 text-center text-sm font-medium ${match.isEmpty ? 'text-slate-500 dark:text-slate-400' : 'text-amber-500'}`}>
                        {player.役满数}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleContainer>
          
          {/* 局次记录 */}
          <ModuleContainer title="详细局次记录" description={match.isEmpty ? "暂无局次数据" : "每一局的具体对战结果"}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-indigo-50 dark:bg-slate-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">局数</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">局長</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">和牌者</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">手役</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">符数</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">番数</th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">得分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {match.gameRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{record.局数}</td>
                      <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">
                        <span className={getPlayerTeamClass(record.局長)}>{record.局長}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                        <span className={getPlayerTeamClass(record.和牌者)}>{record.和牌者}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{record.手役}</td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{record.符数}</td>
                      <td className="py-3 px-4 text-center text-sm text-slate-700 dark:text-slate-300">{record.番数}</td>
                      <td className={`py-3 px-4 text-right text-sm font-medium ${
                        match.isEmpty ? 'text-slate-500 dark:text-slate-400' :
                        record.得分.startsWith('+') ? 'text-green-600 dark:text-green-400' : 
                        record.得分.startsWith('-') ? 'text-red-500 dark:text-red-400' :
                        'text-slate-700 dark:text-slate-300'
                      }`}>
                        {record.得分}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleContainer>
        </div>
        
        {/* 比赛总结 */}
        <ModuleContainer title="比赛总结" description={match.isEmpty ? "暂无总结数据" : "专业解说分析"}>
          <div className="bg-gray-50 dark:bg-slate-800 p-6 rounded-lg border border-gray-100 dark:border-slate-700">
            {match.isEmpty ? (
              <p className="text-slate-700 dark:text-slate-300 text-center py-8">
                暂无该比赛的总结分析数据，我们将持续关注并更新相关内容
              </p>
            ) : (
              <>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  本场比赛{match.teamA}以{match.scoreA}-{match.scoreB}击败{match.teamB}，表现出了更强的整体实力。
                  {match.playerPerformances.find(p => p.得点 === Math.max(...match.playerPerformances.filter(p => p.name.startsWith(match.teamA)).map(p => parseFloat(p.得点.toString()))).toString())?.name}
                  表现尤为出色，以{match.playerPerformances.find(p => p.得点 === Math.max(...match.playerPerformances.filter(p => p.name.startsWith(match.teamA)).map(p => parseFloat(p.得点.toString()))).toString())?.得点}的得分成为全场最佳。
                </p>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  技术统计方面，{match.teamA}的和牌率（{match.teamAStats.和牌率}%）和立直率（{match.teamAStats.立直率}%）均高于{match.teamB}，
                  而放铳率（{match.teamAStats.放铳率}%）则低于对手，展现了更稳定的攻防表现。
                  本场比赛共出现{match.matchStats.满贯以上手役}个满贯以上手役，其中包括1个役满，比赛观赏性极高。
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  接下来{match.teamA}将迎战{match.teamA === "風林火山" ? "e-MA" : "Pirates"}，而{match.teamB}则将对阵{match.teamB === "麻雀格闘倶楽部" ? "Pirates" : "AGAINST"}，
                  敬请关注后续比赛表现。
                </p>
              </>
            )}
          </div>
        </ModuleContainer>
      </main>
    </>
  );
}
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';

// 定义选手类型接口
interface Player {
  id: number;
  name: string;
  team: string;
  teamLogo: string;
  avatar: string;
  birthDate: string | number;
  age: string | number;
  debutYear: string | number;
  position: string;
  signatureStyle: string;
  careerStats: {
    总场次: string | number;
    胜场数: string | number;
    胜率: string;
    总得分: string | number;
    平均得点: string | number;
  };
  seasonStats: {
    出场次数: string | number;
    平均得点: string | number;
    满贯率: string | number;
    立直率: string | number;
    和牌率: string | number;
    放铳率: string | number;
    流局率: string | number;
    役满次数: string | number;
    最大连庄数: string | number;
  };
  recentPerformances: {
    date: string;
    opponent: string;
    score: string;
    result: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  isEmpty?: boolean; //标记空数据选手
}

// 默认选手
const DEFAULT_EMPTY_PLAYER: Player = {
  id: 0,
  name: "暂无信息-选手",
  team: "暂无数据",
  teamLogo: "https://placehold.co/40x40/cccccc/ffffff?text=无",
  avatar: "https://placehold.co/120x120/eeeeee/999999?text=暂无",
  birthDate: "--",
  age: "--",
  debutYear: "--",
  position: "暂无",
  signatureStyle: "暂无",
  careerStats: {
    总场次: "--",
    胜场数: "--",
    胜率: "--",
    总得分: "--",
    平均得点: "--"
  },
  seasonStats: {
    出场次数: "--",
    平均得点: "--",
    满贯率: "--",
    立直率: "--",
    和牌率: "--",
    放铳率: "--",
    流局率: "--",
    役满次数: "--",
    最大连庄数: "--"
  },
  recentPerformances: [
    { date: "--", opponent: "暂无", score: "--", result: "暂无" },
    { date: "--", opponent: "暂无", score: "--", result: "暂无" },
    { date: "--", opponent: "暂无", score: "--", result: "暂无" }
  ],
  strengths: ["暂无相关数据"],
  weaknesses: ["暂无相关数据"],
  isEmpty: true // 标记为空数据选手
};

// 选手详细数据
const ALL_PLAYERS: Omit<Player, 'isEmpty'>[] = [
  {
    id: 101,
    name: "風林火山-选手一",
    team: "風林火山",
    teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
    avatar: "https://placehold.co/120x120/6366f1/ffffff?text=風一",
    birthDate: "1985-03-15",
    age: 40,
    debutYear: 2008,
    position: "主将",
    signatureStyle: "进攻型",
    careerStats: {
      总场次: 320,
      胜场数: 186,
      胜率: "58.1%",
      总得分: 2856.3,
      平均得点: 8.93
    },
    seasonStats: {
      出场次数: 40,
      平均得点: 12.5,
      满贯率: 18.3,
      立直率: 25.7,
      和牌率: 32.4,
      放铳率: 10.2,
      流局率: 16.8,
      役满次数: 3,
      最大连庄数: 5
    },
    recentPerformances: [
      { date: "2025-11-25", opponent: "Pirates", score: "+18.7", result: "胜利" },
      { date: "2025-11-23", opponent: "AGAINST", score: "+24.3", result: "胜利" },
      { date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+12.5", result: "胜利" },
      { date: "2025-11-19", opponent: "ROYAL", score: "+8.9", result: "胜利" },
      { date: "2025-11-17", opponent: "e-MA", score: "-4.2", result: "失败" }
    ],
    strengths: ["进攻能力强", "立直判断精准", "满贯以上手役概率高", "终局处理优秀"],
    weaknesses: ["防守相对薄弱", "流局时表现一般", "对特殊役种把握不足"]
  },
  {
    id: 102,
    name: "風林火山-选手二",
    team: "風林火山",
    teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
    avatar: "https://placehold.co/120x120/10b981/ffffff?text=風二",
    birthDate: "1988-07-22",
    age: 37,
    debutYear: 2010,
    position: "副将",
    signatureStyle: "均衡型",
    careerStats: {
      总场次: 286,
      胜场数: 154,
      胜率: "53.8%",
      总得分: 1987.6,
      平均得点: 6.95
    },
    seasonStats: {
      出场次数: 38,
      平均得点: 8.2,
      满贯率: 15.6,
      立直率: 22.1,
      和牌率: 29.7,
      放铳率: 11.5,
      流局率: 17.3,
      役满次数: 2,
      最大连庄数: 4
    },
    recentPerformances: [
      { date: "2025-11-25", opponent: "Pirates", score: "+9.3", result: "胜利" },
      { date: "2025-11-23", opponent: "AGAINST", score: "+15.7", result: "胜利" },
      { date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+6.8", result: "胜利" },
      { date: "2025-11-19", opponent: "ROYAL", score: "-2.1", result: "胜利" },
      { date: "2025-11-17", opponent: "e-MA", score: "+11.4", result: "失败" }
    ],
    strengths: ["攻守均衡", "判断稳定", "心理素质好", "团队配合优秀"],
    weaknesses: ["缺乏爆发力", "关键时刻决策偏保守", "稀有役种敏感度一般"]
  },
  {
    id: 103,
    name: "風林火山-选手三",
    team: "風林火山",
    teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
    avatar: "https://placehold.co/120x120/8b5cf6/ffffff?text=風三",
    birthDate: "1992-11-30",
    age: 33,
    debutYear: 2014,
    position: "先锋",
    signatureStyle: "防守型",
    careerStats: {
      总场次: 245,
      胜场数: 128,
      胜率: "52.2%",
      总得分: 1456.8,
      平均得点: 5.95
    },
    seasonStats: {
      出场次数: 36,
      平均得点: 5.7,
      满贯率: 14.2,
      立直率: 19.8,
      和牌率: 26.3,
      放铳率: 9.7,
      流局率: 18.2,
      役满次数: 1,
      最大连庄数: 3
    },
    recentPerformances: [
      { date: "2025-11-25", opponent: "Pirates", score: "+5.6", result: "胜利" },
      { date: "2025-11-23", opponent: "AGAINST", score: "+8.9", result: "胜利" },
      { date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+3.2", result: "胜利" },
      { date: "2025-11-19", opponent: "ROYAL", score: "+7.4", result: "胜利" },
      { date: "2025-11-17", opponent: "e-MA", score: "-1.8", result: "失败" }
    ],
    strengths: ["防守稳固", "流局处理优秀", "读牌能力强", "心态稳定"],
    weaknesses: ["进攻欲望不足", "满贯以上手役较少", "立直时机把握一般"]
  },
  {
    id: 104,
    name: "風林火山-选手四",
    team: "風林火山",
    teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
    avatar: "https://placehold.co/120x120/ec4899/ffffff?text=風四",
    birthDate: "1995-05-18",
    age: 30,
    debutYear: 2018,
    position: "副将",
    signatureStyle: "技术型",
    careerStats: {
      总场次: 198,
      胜场数: 98,
      胜率: "49.5%",
      总得分: 876.3,
      平均得点: 4.43
    },
    seasonStats: {
      出场次数: 34,
      平均得点: -2.1,
      满贯率: 12.8,
      立直率: 17.5,
      和牌率: 23.1,
      放铳率: 11.8,
      流局率: 19.5,
      役满次数: 0,
      最大连庄数: 2
    },
    recentPerformances: [
      { date: "2025-11-25", opponent: "Pirates", score: "-3.2", result: "胜利" },
      { date: "2025-11-23", opponent: "AGAINST", score: "+2.1", result: "胜利" },
      { date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "-1.5", result: "胜利" },
      { date: "2025-11-19", opponent: "ROYAL", score: "+4.2", result: "胜利" },
      { date: "2025-11-17", opponent: "e-MA", score: "-8.7", result: "失败" }
    ],
    strengths: ["技术全面", "细节处理到位", "团队配合默契", "学习能力强"],
    weaknesses: ["大赛经验不足", "关键局表现不稳定", "平均得点偏低"]
  },
  
  {
    id: 201,
    name: "麻雀格闘倶楽部-选手一",
    team: "麻雀格闘倶楽部",
    teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
    avatar: "https://placehold.co/120x120/6366f1/ffffff?text=格一",
    birthDate: "1983-09-07",
    age: 42,
    debutYear: 2006,
    position: "主将",
    signatureStyle: "进攻型",
    careerStats: {
      总场次: 356,
      胜场数: 201,
      胜率: "56.5%",
      总得分: 3124.7,
      平均得点: 8.78
    },
    seasonStats: {
      出场次数: 40,
      平均得点: 10.3,
      满贯率: 16.7,
      立直率: 23.4,
      和牌率: 30.2,
      放铳率: 11.5,
      流局率: 17.3,
      役满次数: 4,
      最大连庄数: 6
    },
    recentPerformances: [
      { date: "2025-11-24", opponent: "ドリブンズ", score: "+16.8", result: "胜利" },
      { date: "2025-11-22", opponent: "ROYAL", score: "+12.3", result: "胜利" },
      { date: "2025-11-20", opponent: "e-MA", score: "+8.7", result: "胜利" },
      { date: "2025-11-18", opponent: "Pirates", score: "-3.2", result: "胜利" },
      { date: "2025-11-16", opponent: "BEAST", score: "+5.6", result: "失败" }
    ],
    strengths: ["进攻犀利", "满贯率高", "立直判断精准", "大赛经验丰富"],
    weaknesses: ["防守一般", "流局率偏高", "关键时刻容易急躁"]
  },
  {
    id: 202,
    name: "麻雀格闘倶楽部-选手二",
    team: "麻雀格闘倶楽部",
    teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
    avatar: "https://placehold.co/120x120/10b981/ffffff?text=格二",
    birthDate: "1987-04-23",
    age: 38,
    debutYear: 2009,
    position: "副将",
    signatureStyle: "均衡型",
    careerStats: {
      总场次: 302,
      胜场数: 162,
      胜率: "53.6%",
      总得分: 2156.9,
      平均得点: 7.14
    },
    seasonStats: {
      出场次数: 39,
      平均得点: 7.8,
      满贯率: 15.2,
      立直率: 21.3,
      和牌率: 27.5,
      放铳率: 10.8,
      流局率: 16.5,
      役满次数: 2,
      最大连庄数: 4
    },
    recentPerformances: [
      { date: "2025-11-24", opponent: "ドリブンズ", score: "+9.5", result: "胜利" },
      { date: "2025-11-22", opponent: "ROYAL", score: "+7.2", result: "胜利" },
      { date: "2025-11-20", opponent: "e-MA", score: "+4.3", result: "胜利" },
      { date: "2025-11-18", opponent: "Pirates", score: "+2.1", result: "胜利" },
      { date: "2025-11-16", opponent: "BEAST", score: "-1.8", result: "失败" }
    ],
    strengths: ["攻守平衡", "发挥稳定", "团队配合好", "心态成熟"],
    weaknesses: ["缺乏亮点", "关键局表现平平", "创新不足"]
  },
  {
    id: 203,
    name: "麻雀格闘倶楽部-选手三",
    team: "麻雀格闘倶楽部",
    teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
    avatar: "https://placehold.co/120x120/8b5cf6/ffffff?text=格三",
    birthDate: "1990-08-15",
    age: 35,
    debutYear: 2012,
    position: "先锋",
    signatureStyle: "技术型",
    careerStats: {
      总场次: 278,
      胜场数: 146,
      胜率: "52.5%",
      总得分: 1789.3,
      平均得点: 6.44
    },
    seasonStats: {
      出场次数: 37,
      平均得点: 4.2,
      满贯率: 13.5,
      立直率: 18.9,
      和牌率: 25.1,
      放铳率: 10.2,
      流局率: 18.7,
      役满次数: 1,
      最大连庄数: 3
    },
    recentPerformances: [
      { date: "2025-11-24", opponent: "ドリブンズ", score: "+3.7", result: "胜利" },
      { date: "2025-11-22", opponent: "ROYAL", score: "+5.4", result: "胜利" },
      { date: "2025-11-20", opponent: "e-MA", score: "-1.2", result: "胜利" },
      { date: "2025-11-18", opponent: "Pirates", score: "+3.6", result: "胜利" },
      { date: "2025-11-16", opponent: "BEAST", score: "-4.5", result: "失败" }
    ],
    strengths: ["技术细腻", "读牌准确", "防守稳固", "细节处理好"],
    weaknesses: ["进攻不足", "满贯率偏低", "节奏偏慢"]
  },
  {
    id: 204,
    name: "麻雀格闘倶楽部-选手四",
    team: "麻雀格闘倶楽部",
    teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
    avatar: "https://placehold.co/120x120/ec4899/ffffff?text=格四",
    birthDate: "1993-02-10",
    age: 32,
    debutYear: 2015,
    position: "副将",
    signatureStyle: "防守型",
    careerStats: {
      总场次: 235,
      胜场数: 118,
      胜率: "50.2%",
      总得分: 1245.6,
      平均得点: 5.30
    },
    seasonStats: {
      出场次数: 35,
      平均得点: -1.5,
      满贯率: 11.9,
      立直率: 16.2,
      和牌率: 22.8,
      放铳率: 9.5,
      流局率: 20.1,
      役满次数: 0,
      最大连庄数: 2
    },
    recentPerformances: [
      { date: "2025-11-24", opponent: "ドリブンズ", score: "-2.3", result: "胜利" },
      { date: "2025-11-22", opponent: "ROYAL", score: "+1.8", result: "胜利" },
      { date: "2025-11-20", opponent: "e-MA", score: "-3.4", result: "胜利" },
      { date: "2025-11-18", opponent: "Pirates", score: "+2.7", result: "胜利" },
      { date: "2025-11-16", opponent: "BEAST", score: "-6.2", result: "失败" }
    ],
    strengths: ["防守出色", "放铳率低", "心理素质好", "抗压能力强"],
    weaknesses: ["平均得点偏低", "进攻欲望弱", "立直率不高"]
  },
  
  // 其他队伍的选手数据...
];

// 根据选手名称获取选手数据
const getPlayerByName = (name: string): Player => {
  // 解码URL中的特殊字符
  const decodedName = decodeURIComponent(name);
  //尝试匹配
  const matchedPlayer = ALL_PLAYERS.find(player => player.name === decodedName);
  
  if (matchedPlayer) {
    return {
      ...matchedPlayer,
      isEmpty: false
    };
  }
  
  return {
    ...DEFAULT_EMPTY_PLAYER,
    name: decodedName || DEFAULT_EMPTY_PLAYER.name,
    isEmpty: true
  };
};

export default function PlayerDetailPage() {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>(); 
  const player = getPlayerByName(name || "");

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
            返回上一页
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 选手基本信息 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <img src={player.avatar} alt={player.name} className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 dark:border-slate-700" />
              <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-800 p-1 rounded-full border border-gray-200 dark:border-slate-700">
                <img src={player.teamLogo} alt={player.team} className="w-10 h-10 rounded-full" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{player.name}</h1>
              
              {/* 为空数据选手显示提示信息 */}
              {player.isEmpty === true && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    该选手的详细信息暂未收录，我们将尽快更新
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
                  {player.team}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
                  {player.position}
                </span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
                  {player.signatureStyle}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center md:text-left">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">出生日期</p>
                  <p className="text-slate-900 dark:text-white">{player.birthDate}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">年龄</p>
                  <p className="text-slate-900 dark:text-white">{player.age}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">出道年份</p>
                  <p className="text-slate-900 dark:text-white">{player.debutYear}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-slate-500 dark:text-slate-400 mb-1">平均得点</p>
                  <p className={`text-sm font-medium ${
                    player.seasonStats.平均得点 === "--" 
                      ? "text-slate-500 dark:text-slate-400" 
                      : typeof player.seasonStats.平均得点 === 'number' && player.seasonStats.平均得点 >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-500 dark:text-red-400"
                  }`}>
                    {player.seasonStats.平均得点}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 本赛季数据 */}
          <ModuleContainer title="2025赛季数据" className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(player.seasonStats).map(([key, value], index) => (
                <div key={index} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {key === "平均得点" ? "平均得点" : 
                     key === "满贯率" ? "满贯率(%)" : 
                     key === "立直率" ? "立直率(%)" : 
                     key === "和牌率" ? "和牌率(%)" : 
                     key === "放铳率" ? "放铳率(%)" : 
                     key === "流局率" ? "流局率(%)" : 
                     key === "最大连庄数" ? "最大连庄" : key}
                  </p>
                  <p className={`text-xl font-bold ${
                    value === "--" ? "text-slate-500 dark:text-slate-400" :
                    key === "平均得点" ? (typeof value === 'number' && value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400") :
                    key === "放铳率" ? "text-red-500 dark:text-red-400" :
                    "text-slate-900 dark:text-white"
                  }`}>
                    {value}
                    {["满贯率", "立直率", "和牌率", "放铳率", "流局率"].includes(key) && value !== "--" ? "%" : ""}
                    {key === "最大连庄数" && value !== "--" ? "巡" : ""}
                  </p>
                </div>
              ))}
            </div>
          </ModuleContainer>
          
          {/* 职业生涯数据 */}
          <ModuleContainer title="职业生涯数据">
            <div className="space-y-4">
              {Object.entries(player.careerStats).map(([key, value], index) => (
                <React.Fragment key={index}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{key}</span>
                    <span className={`text-lg font-bold ${
                      value === "--" ? "text-slate-500 dark:text-slate-400" :
                      key === "胜率" ? "text-slate-900 dark:text-white" :
                      key === "平均得点" ? (typeof value === 'number' && value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400") :
                      "text-slate-900 dark:text-white"
                    }`}>
                      {value}
                      {key === "胜率" && value !== "--" ? "%" : ""}
                    </span>
                  </div>
                  
                  {/* 只为胜率显示进度条 */}
                  {key === "胜率" && value !== "--" && typeof value === 'string' && (
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: value.replace('%', '') + '%' }}></div>
                    </div>
                  )}
                  
                  {/* 为空数据或非胜率字段显示分隔线 */}
                  {key !== "胜率" && (
                    <div className="w-full h-px bg-gray-200 dark:bg-slate-700"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </ModuleContainer>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 近期表现 */}
          <ModuleContainer title="近期表现" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-indigo-50 dark:bg-slate-700">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">日期</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">对手</th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">得分</th>
                    <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {player.recentPerformances.map((perf, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
                      <td className="py-3 px-4 text-sm text-slate-700 dark:text-slate-300">{perf.date}</td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{perf.opponent}</td>
                      <td className={`py-3 px-4 text-right text-sm font-medium ${
                        perf.score === "--" ? "text-slate-500 dark:text-slate-400" :
                        perf.score.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {perf.score}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {perf.result === "暂无" ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                            {perf.result}
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            perf.result === '胜利' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {perf.result}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleContainer>
          
          {/* 技术特点分析 */}
          <ModuleContainer title="技术特点分析">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">优势</h4>
                <ul className="space-y-2">
                  {player.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        strength === "暂无相关数据" ? "text-gray-400" : "text-green-500"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {strength === "暂无相关数据" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        )}
                      </svg>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">待改进</h4>
                <ul className="space-y-2">
                  {player.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        weakness === "暂无相关数据" ? "text-gray-400" : "text-red-500"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {weakness === "暂无相关数据" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">综合评价</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {player.isEmpty === true 
                    ? "该选手的技术特点分析暂未收录，我们将持续关注并更新相关数据。" 
                    : `${player.name}是一位${player.signatureStyle}选手，${typeof player.seasonStats.平均得点 === 'number' && player.seasonStats.平均得点 >= 10 ? '本赛季表现极为出色，' : '本赛季表现稳定，'}
                      ${player.strengths[0]}是其最大优势。在${player.weaknesses[0]}方面仍有提升空间。`}
                </p>
              </div>
            </div>
          </ModuleContainer>
        </div>
      </main>
    </>
  );
}
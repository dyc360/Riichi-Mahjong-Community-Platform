import React from 'react';
import { Link } from 'react-router-dom';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';

// 定义练习数据，方便管理
const practiceModes = [
  {
    id: 'points',
    title: "手牌算点",
    description: "计算给出的手牌的点数，提升算分速度与准确度。",
    difficulty: "Medium",
    count: "无限畅玩",
    link: "/practice/point-calculation",
    themeColor: "bg-blue-500", // 卡片顶部的装饰色条
    badgeColor: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30"
  },
  {
    id: 'chinitsu',
    title: "清一色何切",
    description: "针对清一色多面听和复杂牌型的专项特训。",
    difficulty: "Hard",
    count: "无限畅玩",
    link: "/practice/chinitsu-calculation",
    themeColor: "bg-rose-500",
    badgeColor: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30"
  },
  {
    id: 'naze300',
    title: "何切 300",
    description: "来自《何切300问》的精选题目，涵盖多种复杂局面。",
    difficulty: "Medium",
    count: "300题",
    link: "/practice/naze300",
    themeColor: "bg-indigo-600",
    badgeColor: "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-900/30",
    isRecommended: true
  },
  {
    id: 'efficiency',
    title: "牌效率何切",
    description: "牌效基础练习，学习如何最大化进张概率。",
    difficulty: "Easy",
    count: "无限畅玩",
    link: "/practice/efficiency-calculation",
    themeColor: "bg-emerald-500",
    badgeColor: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30"
  }
];

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <HomePageHeader />
      
      {/* 导航栏：增加 sticky 效果方便操作 */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <MainNavigation />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10 max-w-6xl">
        {/* 页面标题区 */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            练习模式
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            选择一个专项进行针对性训练，提升麻将水平。
          </p>
        </div>

        {/* 卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {practiceModes.map((mode) => (
            <Link 
              key={mode.id}
              to={mode.link}
              className="group relative flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              {/* 顶部彩色装饰条 */}
              <div className={`h-1.5 w-full ${mode.themeColor}`} />

              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  {/* 难度标签 */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${mode.badgeColor}`}>
                    {mode.difficulty}
                  </span>
                  
                  {/* 推荐标记 (仅何切300显示) */}
                  {mode.isRecommended && (
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800">
                      推荐
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {mode.title}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-grow">
                  {mode.description}
                </p>

                {/* 底部信息 */}
                <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-mono">
                    {mode.count}
                  </span>
                  <span className="text-slate-900 dark:text-white font-medium group-hover:translate-x-1 transition-transform">
                    开始 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
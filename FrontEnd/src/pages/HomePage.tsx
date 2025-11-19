import { Link, useLocation } from 'react-router-dom'
// import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {HomePageHeader} from '../components/homePageComp'
import { useTheme } from '../contexts/ThemeContext';

export default function HomePage() {
  return (
    <>
      <HomePageHeader />
      {/* Add more content for the home page here */}
      {/* 顶部引导导航 */}
      <nav className="container mx-auto px-4 py-4 border-b dark:border-slate-700 light:border-gray-200">
        <div className="flex flex-wrap gap-2">
          <NavItem label="首页" path="/homepage" />
          <NavItem label="新闻浏览" path="/news" />
          <NavItem label="论坛交流" path="/forum" />
          <NavItem label="何切练习" path="/practice" />
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 新闻浏览模块  */}
          <NewsModule />
          
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
          : 'hover:bg-slate-200 dark:hover:bg-slate-700 light:text-slate-800 dark:text-slate-200'
        }`}
    >
      {label}
    </Link>
  );
};

// 模块通用容器组件
const ModuleContainer = ({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { theme } = useTheme();
  return (
  <div className={`rounded-2xl border border-slate-800/60 bg-slate-900/30 p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl dark:border-slate-700 light:border-gray-200 light:bg-white ${className}`}>
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-1 dark:text-white light:text-slate-900">{title}</h2>
      <p className="text-sm dark:text-slate-400 light:text-slate-600">{description}</p>
    </div>
    <div className="mt-4">{children}</div>
  </div>
  );
};

// 新闻子模块组件
const NewsSubModule = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-700/40 p-4 dark:border-slate-600/40 light:border-gray-200/80">
    <h3 className="text-base font-medium mb-3 dark:text-slate-200 light:text-slate-800">{title}</h3>
    <div>{children}</div>
  </div>
);

// 新闻浏览模块
const NewsModule = () => (
  <ModuleContainer
    title="新闻浏览"
    description="立直麻将相关的最新动态与数据"
    className="col-span-1 lg:col-span-2"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 行业资讯子模块 */}
      <NewsSubModule title="行业资讯">
        <div className="space-y-3">
          <div className="h-16 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-16 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-16 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
        </div>
        <div className="mt-3 text-right">
          <Link to="/news/industry" className="text-xs text-indigo-500 hover:text-indigo-300">
            更多资讯 →
          </Link>
        </div>
      </NewsSubModule>

      {/*M-League联赛积分榜子模块*/}
      <NewsSubModule title="M-League联赛积分榜">
        <div className="space-y-2">
          <div className="h-10 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-10 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-10 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-10 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-10 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
        </div>
        <div className="mt-3 text-right">
          <Link to="/news/m-league" className="text-xs text-indigo-500 hover:text-indigo-300">
            完整排名 →
          </Link>
        </div>
      </NewsSubModule>

      {/*雀魂游戏信息子模块*/}
      <NewsSubModule title="雀魂游戏信息">
        <div className="space-y-3">
          <div className="h-20 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
          <div className="h-12 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
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

// 论坛交流模块
const ForumModule = () => (
  <ModuleContainer
    title="论坛交流"
    description="与其他麻将爱好者分享心得与技巧"
  >
    <div className="space-y-2">
      <div className="h-12 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
      <div className="h-12 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
      <div className="h-12 rounded-lg bg-slate-800/30 animate-pulse dark:bg-slate-700/30 light:bg-gray-200"></div>
    </div>
    <div className="mt-3 text-right">
      <Link to="/forum" className="text-sm font-medium text-indigo-500 hover:text-indigo-300">
        进入论坛 →
      </Link>
    </div>
  </ModuleContainer>
);

//何切练习模块
const PracticeModule = () => (
  <ModuleContainer
    title="何切练习"
    description="通过实战案例提升你的打牌决策能力"
  >
    <div className="flex flex-col items-center justify-center py-4">
      <div className="w-full max-w-xs h-32 rounded-xl bg-slate-800/30 animate-pulse mb-4 dark:bg-slate-700/30 light:bg-gray-200"></div>
      <button className="px-5 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors">
        开始练习
      </button>
    </div>
    <div className="mt-2 text-center text-xs dark:text-slate-400 text-slate-600">
      包含超过1000+实战何切案例
    </div>
  </ModuleContainer>
);
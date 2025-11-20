import { type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from './widgets/ThemeToggle'

// 新闻子模块组件
export const NewsSubModule = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border p-4 border-gray-200/80 dark:border-slate-600/40">
    <h3 className="text-base font-medium mb-3 text-slate-800 dark:text-slate-200">{title}</h3>
    <div>{children}</div>
  </div>
);

// 模块通用容器组件
export const ModuleContainer = ({
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
  return (
  <div className={`rounded-2xl border p-6 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}>
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
    <div className="mt-4">{children}</div>
  </div>
  );
};

export function HomePageHeader() {
  return (
    <header className="py-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md transition-colors duration-300">
        <div className="container mx-auto px-4 flex justify-between items-center">
            <Link to="/home" className="text-2xl font-bold">MajHub</Link>
            <nav>
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/profile" className="hover:underline">个人中心</Link>
                    </li>
                    <li>
                        <Link to="/settings" className="hover:underline">设置</Link>
                    </li>
                    {/* 主题切换按钮 */}
                    <li>
                        <ThemeToggle />
                    </li>
                </ul>
            </nav>
        </div>
    </header>
  )
}

export type ProNewsProps = {
    title: string;
    timestamp: string;
};


export function ProNews({ title, timestamp }: ProNewsProps) {
    return (
    <Link 
        to={`/news/pro/${title}`} 
        className="group flex items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
    >
        <div className="flex items-center gap-3 overflow-hidden">
            <span className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                {title}
            </span>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400">
            {timestamp}
        </span>
    </Link>
  );
}

export type TeamRankProps = {
  rank: number;
  teamName: string;
  score: string;
};

export function TeamRank({ rank, teamName, score }: TeamRankProps) {
  const getRankStyle = (r: number) => {
    switch(r) {
      case 1: return "text-yellow-500 font-bold";
      case 2: return "text-slate-400 font-bold";
      case 3: return "text-amber-600 font-bold";
      default: return "text-slate-500 dark:text-slate-400";
    }
  };

  const scoreClass = score.startsWith('-') 
    ? "text-red-500 dark:text-red-400" 
    : "text-green-600 dark:text-green-400";

  return (
    <div className="h-10 rounded-lg flex items-center justify-between px-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors">
      <div className="flex items-center gap-3">
        <span className={`w-5 text-center text-sm ${getRankStyle(rank)}`}>
          {rank}
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {teamName}
        </span>
      </div>
      <span className={`text-sm font-mono font-medium ${scoreClass}`}>
        {score}
      </span>
    </div>
  );
}

export type GameInfoCardProps = {
  title: string;
  subtitle: string;
  imageUrl?: string;
  link?: string;
};

export function GameInfoCard({ title, subtitle, imageUrl, link = "#" }: GameInfoCardProps) {
  return (
    <Link 
      to={link}
      className="group flex items-start gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all dark:bg-slate-800/30 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:hover:border-indigo-900/50"
    >
      <div className="flex-1 min-w-0 py-1">
        <h4 className="text-sm font-bold text-slate-800 mb-1 truncate dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
          {title}
        </h4>
        <p className="text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      <div className="w-20 h-14 shrink-0 rounded-md bg-slate-200 overflow-hidden dark:bg-slate-700">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  );
}

export type ForumTopicRankProps = {
  rank: number;
  title: string;
  replies: number;
  time: string;
  link?: string;
};

export function ForumTopicRank({ rank, title, replies, time, link = "#" }: ForumTopicRankProps) {
  const getRankStyle = (r: number) => {
    switch(r) {
      case 1: return "bg-red-500 text-white shadow-red-200 dark:shadow-none";
      case 2: return "bg-orange-500 text-white shadow-orange-200 dark:shadow-none";
      case 3: return "bg-amber-500 text-white shadow-amber-200 dark:shadow-none";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <Link 
      to={link}
      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold shadow-sm ${getRankStyle(rank)}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="truncate text-sm font-medium text-slate-700 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400 transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            {replies}
          </span>
          <span>•</span>
          <span>{time}</span>
        </div>
      </div>
    </Link>
  );
}

export type PracticeCardProps = {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  count: number;
  link?: string;
};

export function PracticeCard({ title, description, difficulty, count, link = "#" }: PracticeCardProps) {
    const getDifficultyColor = (d: string) => {
        switch(d) {
            case 'Easy': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            case 'Medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
            case 'Hard': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            default: return 'text-slate-500 bg-slate-50';
        }
    }

    return (
        <Link to={link} className="group flex flex-col p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-indigo-500/50">
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                    {difficulty}
                </span>
                <span className="text-xs text-slate-400">{count} 题</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-400">
                {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {description}
            </p>
        </Link>
    )
}
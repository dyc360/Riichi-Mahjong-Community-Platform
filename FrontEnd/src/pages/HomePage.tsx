import { Link, useLocation } from 'react-router-dom'
// import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {HomePageHeader} from '../components/homePageComp'
import { useTheme } from '../contexts/ThemeContext';
import { NewsSubModule, ModuleContainer, ProNews, TeamRank, GameInfoCard, ForumTopicRank, PracticeCard } from '../components/homePageComp'

export default function HomePage() {
  return (
    <>
      <HomePageHeader />
      {/* Add more content for the home page here */}
      {/* 顶部引导导航 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-2">
          <NavItem label="首页" path="/home" />
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
          : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
    >
      {label}
    </Link>
  );
};





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
          <ProNews title='新闻一' timestamp='2小时前'/>
          <ProNews title='新闻二' timestamp='3小时前'/>
          <ProNews title='新闻三' timestamp='5小时前'/>
          <ProNews title='新闻四' timestamp='1天前'/>
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
          <TeamRank rank={1} teamName="風林火山" score="+602.5" />
          <TeamRank rank={2} teamName="麻雀格闘倶楽部" score="+495.8" />
          <TeamRank rank={3} teamName="BEAST" score="+54.1" />
          <TeamRank rank={4} teamName="ドリブンズ" score="+8.2" />
          <TeamRank rank={5} teamName="Pirates" score="-92.6" />
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
          <GameInfoCard 
            title="新活动登场：姬川响的游戏机" 
            subtitle="多款新皮肤登场以及老皮肤返场"
            imageUrl="https://placehold.co/100x70/6366f1/ffffff?text=Event"
          />
          <GameInfoCard 
            title="版本更新公告" 
            subtitle="v2.0.1版本更新内容说明，修复已知问题"
          />
          {/* <GameInfoCard 
            title="夏季锦标赛报名" 
            subtitle="总奖金池100万，欢迎各路高手报名参加"
            imageUrl="https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
          /> */}
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
    <div className="space-y-1">
      <ForumTopicRank rank={1} title="【讨论】大家觉得这次新角色如何？" replies={128} time="10分钟前" />
      <ForumTopicRank rank={2} title="求助：这个牌型应该怎么防守？" replies={85} time="35分钟前" />
      <ForumTopicRank rank={3} title="分享一个刚刚打出的役满！" replies={64} time="1小时前" />
      <ForumTopicRank rank={4} title="关于立直麻将的一些基础理论探讨" replies={42} time="2小时前" />
      <ForumTopicRank rank={5} title="萌新入坑，请问有什么推荐的教学视频吗？" replies={36} time="3小时前" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PracticeCard 
            title="手牌算点" 
            description="计算给出的手牌的点数，提升算分速度。" 
            difficulty="Medium" 
            count={85} 
            link='/practice/point-calculation'
        />
        <PracticeCard 
            title="清一色训练" 
            description="针对多面听的清一色牌型进行专项训练。" 
            difficulty="Hard" 
            count={40} 
        />
        <PracticeCard 
            title="何切300" 
            description="来自《何切300问》的精选题目，涵盖多种复杂局面。" 
            difficulty="Medium" 
            count={300} 
        />
        <PracticeCard 
            title="牌效率何切" 
            description="适合新手的牌效练习，学习如何最大化进张。" 
            difficulty="Easy" 
            count={150} 
        />
    </div>
    <div className="mt-6 text-center">
       <Link to="/practice" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
            浏览全部题库
       </Link>
    </div>
  </ModuleContainer>
);
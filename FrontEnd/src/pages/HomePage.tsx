import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'
// import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import {HomePageHeader} from '../components/homePageComp'
import { useTheme } from '../contexts/ThemeContext';
import { NewsSubModule, ModuleContainer, ProNews, TeamRank, GameInfoCard, ForumTopicRank, PracticeCard, MainNavigation } from '../components/homePageComp'
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 定义文章接口
interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  cover_image: string | null;
  category_name: string;
  author_name: string;
  published_at: string;
  views: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// 将 category_name映射到NewsCategory类型
const mapCategoryNameToNewsCategory = (categoryName: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    'rules': ['rules'],
    'tournament': ['tournament'],
    'communication': ['communication'],
    'technology': ['technology'],
    'industry': ['rules'],
    '赛事': ['tournament'],
    '技术': ['technology'],
    '交流': ['communication']
  };
  
  return categoryMap[categoryName.toLowerCase()] || ['default'];
};

// 将发布时间转换为相对时间
const formatRelativeTime = (publishedAt: string): string => {
  const publishedDate = new Date(publishedAt);
  const now = new Date();
  const diffInMs = now.getTime() - publishedDate.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInHours < 1) {
    return '刚刚';
  } else if (diffInHours < 24) {
    return `${diffInHours}小时前`;
  } else if (diffInDays < 7) {
    return `${diffInDays}天前`;
  } else {
    return publishedDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  }
};

export default function HomePage() {
  const [industryNews, setIndustryNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取文章列表
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 调用后端 API 获取文章列表
        const response = await axios.get<Article[]>(`${API_BASE_URL}/news_api/articles/`);
        
        // 将Article转换为ProNews组件所需的格式
        const transformedNews = response.data
          .slice(0, 4)
          .map(article => ({
            id: article.id,
            title: article.title,
            timestamp: formatRelativeTime(article.published_at),
            category: mapCategoryNameToNewsCategory(article.category_name)
          }));
        
        setIndustryNews(transformedNews);
      } catch (err: any) {
        console.error('获取首页文章列表失败:', err);
        setError('获取文章列表失败，请稍后重试');
        // 如果获取失败，可以回退到模拟数据
        setIndustryNews([
          { id: 1, title: "立直麻将职业联赛新赛季规则调整", timestamp: "2小时前", category: ['rules'] },
          { id: 2, title: "国际麻将协会宣布新增赛事项目", timestamp: "3小时前", category: ['tournament'] },
          { id: 3, title: "日本职业雀士访问中国交流活动圆满结束", timestamp: "5小时前", category: ['communication'] },
          { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%", timestamp: "1天前", category: ['technology'] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <>
      <HomePageHeader />
      {/* Add more content for the home page here */}
      {/* 顶部引导导航 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 新闻浏览模块  */}
          <NewsModule industryNews={industryNews} loading={loading} error={error} />
          
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

// 新闻浏览模块
interface NewsModuleProps {
  industryNews: any[];
  loading: boolean;
  error: string | null;
}

const NewsModule = ({ industryNews, loading, error }: NewsModuleProps) => (
  <ModuleContainer
    id="news"
    title="新闻浏览"
    description="立直麻将相关的最新动态与数据"
    className="col-span-1 lg:col-span-2"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 行业资讯子模块 */}
      <NewsSubModule title="行业资讯">
          <div className="space-y-3">
              {industryNews.map(news => (
                <ProNews 
                  key={news.id}
                  id={news.id} 
                  title={news.title} 
                  timestamp={news.timestamp} 
                  category={news.category}
                />
              ))}
          </div>
          <div className="mt-3 text-right">
              <Link to="/news#industry-news" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
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
          <Link to="/news#m-league" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
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
            title="版本更新公告 v2.0.1" 
            subtitle="v2.0.1版本更新内容说明，修复已知问题"
            imageUrl="https://placehold.co/100x70/10b981/ffffff?text=Update"
          />
          {/* <GameInfoCard 
            title="夏季锦标赛报名" 
            subtitle="总奖金池100万，欢迎各路高手报名参加"
            imageUrl="https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
          /> */}
        </div>
        <div className="mt-3 text-right">
          <Link to="/news#majsoul" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
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
      <Link to="/forum" className="text-sm font-medium text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
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
            link="/practice/efficiency-calculation"
            count={150} 
        />
    </div>
    <div className="mt-6 text-center">
       <Link to="/practice" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600">
            浏览全部题库
       </Link>
    </div>
  </ModuleContainer>
);
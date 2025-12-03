import { useParams } from 'react-router-dom';
import { GameInfoCard, HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { MAJSOUL_NEWS_DETAILED } from './NewsMajsoulPage';

// 雀魂新闻数据
export const MAJSOUL_NEWS_CONTENT = [
  {
    id: 1,
    title: "新活动登场：姬川响的游戏机",
    timestamp: "2025-11-25 10:00",
    author: "雀魂运营团队",
    avatar: "https://placehold.co/40x40/6366f1/ffffff?text=雀",
    content: `
      <p class="mb-4">亲爱的雀士们，本次更新将推出「姬川响的游戏机」限时活动，活动时间为11月26日至12月10日。</p>
      
      <h3 class="text-xl font-semibold mb-2">活动内容：</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>完成每日任务可获得「游戏币」，用于兑换限定奖励</li>
        <li>累计登录7天可领取「姬川响」限定皮肤</li>
        <li>老皮肤「春日野樱」「夏夜祭」限时返场</li>
      </ul>
      
      <p class="mb-4">活动奖励包括：限定头像框、动态表情、自定义桌布等稀有道具。快来参与活动，与姬川响一起享受游戏乐趣吧！</p>
    `,
    relatedNews: [
      { 
        id: 2,
        title: "版本更新公告 v2.0.1",
        subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
        imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update"
      },
      { 
        id: 4,
        title: "新角色「望月凛」上线",
        subtitle: "全新角色加入雀魂大家庭，自带专属语音和特殊动作",
        imageUrl: "https://placehold.co/100x70/f59e0b/ffffff?text=Character"
      }
    ]
  },
  {
    id: 2,
    title: "版本更新公告 v2.0.1",
    timestamp: "2025-11-24 15:30",
    author: "雀魂技术团队",
    avatar: "https://placehold.co/40x40/10b981/ffffff?text=技",
    content: `
      <p class="mb-4">本次v2.0.1版本更新已于11月24日维护后上线，主要优化内容如下：</p>
      
      <h3 class="text-xl font-semibold mb-2">优化内容：</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>修复了多人联机时偶尔出现的卡顿问题</li>
        <li>提升了牌局结算速度，平均缩短30%等待时间</li>
        <li>新增3种自定义桌布：「星空」「樱花」「水墨」</li>
        <li>优化了移动端操作手感，出牌响应更灵敏</li>
      </ul>
      
      <p class="mb-4">本次更新后，所有玩家将获得1000雀魂币作为补偿，请注意查收邮件。感谢各位雀士的支持与理解！</p>
    `,
    relatedNews: [
      { 
        id: 1,
        title: "新活动登场：姬川响的游戏机",
        subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
        imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
      },
      { 
        id: 3,
        title: "夏季锦标赛报名启动",
        subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
        imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
      }
    ]
  },
  // 补充其他新闻的详情内容（id=3、4）
  {
    id: 3,
    title: "夏季锦标赛报名启动",
    timestamp: "2025-11-23 09:00",
    author: "雀魂赛事组",
    avatar: "https://placehold.co/40x40/ec4899/ffffff?text=赛",
    content: `
      <p class="mb-4">2025雀魂夏季锦标赛正式开启报名，总奖金池100万元，诚邀各路高手参与！</p>
        
      <h3>比赛信息</h3>
      <ul>
        <li>报名时间：2025年11月25日 - 12月10日</li>
        <li>比赛时间：2025年12月15日 - 2026年1月10日</li>
        <li>报名条件：所有雀魂实名认证玩家均可参与</li>
        <li>比赛形式：线上预选赛+线下总决赛</li>
      </ul>
        
      <h3>赛制说明</h3>
      <ul>
        <li>预选赛：瑞士轮积分制，共6轮</li>
        <li>晋级赛：前128名选手分为16组进行循环赛</li>
        <li>总决赛：16名胜出者线下进行单败淘汰赛</li>
      </ul>
        
      <h3>奖励设置</h3>
      <ul>
        <li>冠军：50万元 + 专属冠军皮肤 + 职业选手签约机会</li>
        <li>亚军：20万元 + 限定奖励</li>
        <li>季军：10万元 + 限定奖励</li>
        <li>4-8名：各5万元</li>
        <li>9-16名：各1万元</li>
      </ul>
        
      <p>报名通道已在游戏内开启，点击主界面「赛事」按钮即可参与报名。期待各位雀士的精彩表现！</p>
    `,
    relatedNews: [
      {
        id: 1,
        title: "新活动登场：姬川响的游戏机",
        subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
        imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
      },
      {
        id: 2,
        title: "版本更新公告 v2.0.1",
        subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
        imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update"
      }
    ]
  },
  {
    id: 4,
    title: "新角色「望月凛」上线",
    timestamp: "2025-11-22 14:00",
    author: "雀魂策划组",
    avatar: "https://placehold.co/40x40/f59e0b/ffffff?text=策",
    content: `
      <p>全新角色「望月凛」将于11月30日正式加入雀魂大家庭，这位来自北海道的天才少女将为大家带来不一样的麻将体验。</p>      
        <h3>角色介绍</h3>
        <p>望月凛，17岁，北海道出身，是一位在当地小有名气的高中生雀士。性格冷静沉着，擅长观察对手的习惯和表情，总能在关键时刻做出最佳决策。</p>        
        <h3>角色特点</h3>
        <ul>
            <li>专属语音：由知名声优「佐藤利奈」配音</li>
            <li>特殊动作：立直时会有独特的手势和台词</li>
            <li>角色技能：「冰眼」- 一定概率看穿对手的听牌情况（仅在特定模式生效）</li>
        </ul>   
            
        <h3>获取方式</h3>
        <p>11月30日 - 12月14日期间，可通过以下方式获取：</p>
        <ul>
            <li>角色礼包：980雀魂币直接购买（包含角色+初始皮肤）</li>
            <li>限定卡池：抽取「凛之召唤」卡池有机会获得</li>
            <li>活动兑换：参与「冬日雀宴」活动积累碎片兑换</li>
        </ul>           
        <p>同时推出「望月凛」专属皮肤3款，分别为「制服ver.」、「和服ver.」和「泳装ver.」，满足不同玩家的收藏需求。</p>
    `,
    relatedNews: [
      {
        id: 1,
        title: "新活动登场：姬川响的游戏机",
        subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
        imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
      },
      {
        id: 3,
        title: "夏季锦标赛报名启动",
        subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
        imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
      }
    ]
  }
];

export default function NewsMajsoulDetailPage() {
  const { theme } = useTheme();
  const { title } = useParams<{ title: string }>();
  const decodedTitle = title ? decodeURIComponent(title) : '';
  
  // 通过标题匹配数据
  const NewsItem = MAJSOUL_NEWS_CONTENT.find(
    item => item.title === decodedTitle
  );
  const news = NewsItem ? MAJSOUL_NEWS_DETAILED.find(item => item.title === decodedTitle) : undefined;
  const content = NewsItem ? NewsItem.content : '';

  const navigate = useNavigate();
  

  const handleGoBack = () => {
    navigate(-1);
  };

  // 处理未找到新闻的情况
  if (!NewsItem || !news || !content) {
    return (
      <>
        <HomePageHeader />
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
          <ModuleContainer title="新闻不存在">
            <div className="py-10 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                未找到对应的雀魂新闻信息
              </p>
            </div>
          </ModuleContainer>
        </main>
      </>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 新闻主体内容（占2列） */}
          <div className="lg:col-span-2">
            <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 md:p-8">
              <img 
                src={news.imageUrl} 
                alt={news.title} 
                className="w-full h-64 md:h-80 object-cover rounded-lg mb-6"
              />
              
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">{news.title}</h1>
              
              {/* 信息栏 */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {news.category[0]}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {news.timestamp}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  阅读时间：{Math.ceil(content.length / 500)} 分钟
                </div>
              </div>
              
              {/* 新闻内容 */}
              <div 
                className="prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 pt-5"
                dangerouslySetInnerHTML={{ __html: content }}
              />
              
              {/* 分享按钮 */}
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  分享链接
                </button>
                <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  复制链接
                </button>
              </div>
            </article>
          </div>
          
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <ModuleContainer
              title="相关资讯"
              description="你可能也感兴趣的内容"
              className="sticky top-8"
            >
              <div className="space-y-3">
                {NewsItem.relatedNews.map(item => (
                  <GameInfoCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    imageUrl={item.imageUrl}
                  />
                ))}
              </div>
              
              <div className="mt-6">
                <ModuleContainer title="热门活动" description="正在进行的精彩活动">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border border-pink-100 dark:border-pink-900/30">
                      <p className="font-medium text-pink-700 dark:text-pink-300">累计登录送限定皮肤</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">剩余3天结束</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-900/30">
                      <p className="font-medium text-blue-700 dark:text-blue-300">新手福利升级</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">永久有效</p>
                    </div>
                  </div>
                </ModuleContainer>
              </div>
            </ModuleContainer>
          </div>
        </div>
      </main>
    </>
  );
}
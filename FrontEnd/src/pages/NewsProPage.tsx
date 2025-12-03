import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORY_CONFIG = {
    'rules': {
      label: '#规则更新',
      light: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      dark: 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40',
      textSize: 'text-sm'
    },
    'tournament': {
      label: '#赛事动态',
      light: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      dark: 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40',
      textSize: 'text-sm'
    },
    'technology': {
      label: '#技术发展',
      light: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      dark: 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40',
      textSize: 'text-sm'
    },
    'communication': {
      label: '#国际交流',
      light: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
      dark: 'bg-rose-900/30 text-rose-300 hover:bg-rose-800/40',
      textSize: 'text-sm'
    }
  };
  
  // 默认分类
  const DEFAULT_CATEGORY = {
    label: '未知分类',
    light: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    dark: 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/40',
    textSize: 'text-sm'
  };

// 模拟新闻详情数据
const NEWS_DETAILS = {
  1: {
    id: 1,
    title: "立直麻将职业联赛新赛季规则调整",
    timestamp: "2025-11-26 14:30",
    category: ['rules'],
    author: "职业联赛官方",
    avatar: "https://placehold.co/40x40/6366f1/ffffff?text=官",
    content: `
      <p class="mb-4">经过联赛委员会多轮讨论，2026赛季立直麻将职业联赛将实施以下规则调整，旨在提升比赛观赏性和竞技公平性：</p>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">一、点数计算调整</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>役满役种判定标准优化，新增"四暗刻单骑"与"字一色"的优先级判定规则</li>
        <li>流局罚点规则调整，多家立直流局时的点数分配更趋合理</li>
        <li>累计役满计算方式变更，多役满复合时的点数上限调整为13番</li>
      </ul>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">二、比赛流程优化</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>单局比赛时间限制延长至45分钟，避免过快流局影响竞技质量</li>
        <li>选手思考时间调整，立直时可额外获得15秒思考时间</li>
        <li>新增"暂停申请"机制，每队每轮可申请2次暂停（每次1分钟）</li>
      </ul>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">三、参赛资格更新</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>职业选手资格认证新增"线上积分达标"要求</li>
        <li>允许最多2名外籍选手加入各队伍，促进国际交流</li>
        <li>增设"新秀选拔通道"，业余选手可通过预选赛获得参赛资格</li>
      </ul>
      
      <p class="mb-4">新规则将于2026年1月1日正式实施，联赛委员会将持续收集选手反馈，不断优化比赛规则体系。</p>
      
      <p>如有任何疑问，可通过联赛官方邮箱咨询：support@mahjong-pro-league.com</p>
    `,
    relatedNews: [
      { id: 3, title: "日本职业雀士访问中国交流活动圆满结束" },
      { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行" },
      { id: 2, title: "国际麻将协会宣布新增赛事项目" }
    ]
  },
  2: {
    id: 2,
    title: "国际麻将协会宣布新增赛事项目",
    timestamp: "2025-11-26 11:15",
    category: ['tournament'],
    author: "国际麻将协会",
    avatar: "https://placehold.co/40x40/10b981/ffffff?text=国",
    content: `
      <p class="mb-4">国际麻将协会（IMA）今日正式宣布，将在2026年新增三项国际级麻将赛事，进一步推动麻将运动的全球化发展。</p>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">新增赛事项目：</h3>
      
      <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">1. 世界青年麻将锦标赛</h4>
        <p class="mb-2">参赛年龄：18-25岁</p>
        <p class="mb-2">比赛时间：2026年4月（日本东京）</p>
        <p>赛事亮点：设置团体赛和个人赛，冠军将获得职业联赛参赛资格</p>
      </div>
      
      <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">2. 麻将大师邀请赛</h4>
        <p class="mb-2">参赛资格：各国家/地区排名前16的职业选手</p>
        <p class="mb-2">比赛时间：2026年7月（中国上海）</p>
        <p>赛事亮点：采用双败淘汰制，总奖金池达50万美元</p>
      </div>
      
      <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">3. 线上麻将世界杯</h4>
        <p class="mb-2">参赛方式：线上报名，分地区预选赛</p>
        <p class="mb-2">比赛时间：2026年10月（全球同步）</p>
        <p>赛事亮点：无门槛参赛，总参赛名额1024人</p>
      </div>
      
      <p class="mb-4">国际麻将协会主席表示："新增赛事旨在吸引更多年轻人参与麻将运动，同时为不同水平的选手提供展示平台。我们将持续完善赛事体系，推动麻将成为真正的全球性运动。"</p>
      
      <p>赛事报名通道将于2026年1月1日正式开放，详情可关注国际麻将协会官网更新。</p>
    `,
    relatedNews: [
      { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行" },
      { id: 1, title: "立直麻将职业联赛新赛季规则调整" },
      { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%" }
    ]
  },
  4: { 
    id: 4, 
    title: "麻将AI研究取得新突破，胜率提升至92%", 
    timestamp: "1天前",
    category: ['technology'],
    author: "国际麻将协会",
    avatar: "https://placehold.co/40x40/10b981/ffffff?text=国",
    content: `
      <p class="mb-4">近日，清华大学人工智能研究院与腾讯AI Lab联合发布了新一代麻将AI系统"雀智V4.0"，在与职业选手的对抗测试中，综合胜率达到92%，较上一代提升8个百分点，创下麻将AI领域的新纪录。</p>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">一、核心技术突破</h3>
      <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
        <h4 class="font-semibold mb-2">1. 多模态决策模型</h4>
        <p class="mb-2">融合强化学习与蒙特卡洛树搜索，能够根据牌局进程动态调整策略，兼顾短期收益与长期胜率</p>
        <h4 class="font-semibold mb-2 mt-3">2. 对手行为预测</h4>
        <p class="mb-2">通过分析对手历史出牌习惯、立直时机等数据，构建个性化行为模型，预测准确率达83%</p>
        <h4 class="font-semibold mb-2 mt-3">3. 动态风险评估</h4>
        <p>针对不同局势（领先/落后/胶着）自动调整风险偏好，避免盲目进攻或过度防守</p>
      </div>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">二、测试数据表现</h3>
      <div class="overflow-x-auto mb-6">
        <table class="w-full min-w-[400px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-indigo-50 dark:bg-slate-700">
            <tr>
              <th className="py-2 px-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">测试对象</th>
              <th className="py-2 px-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">对局数</th>
              <th className="py-2 px-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">胜率</th>
              <th className="py-2 px-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">平均排名</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            <tr>
              <td className="py-2 px-3 text-sm text-slate-900 dark:text-white">职业选手（排名前20）</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">100局</td>
              <td className="py-2 px-3 text-center text-sm text-green-600 dark:text-green-400">82%</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">1.5</td>
            </tr>
            <tr>
              <td className="py-2 px-3 text-sm text-slate-900 dark:text-white">业余高手（段位10段+）</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">200局</td>
              <td className="py-2 px-3 text-center text-sm text-green-600 dark:text-green-400">92%</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">1.2</td>
            </tr>
            <tr>
              <td className="py-2 px-3 text-sm text-slate-900 dark:text-white">上一代AI（雀智V3.0）</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">50局</td>
              <td className="py-2 px-3 text-center text-sm text-green-600 dark:text-green-400">96%</td>
              <td className="py-2 px-3 text-center text-sm text-slate-700 dark:text-slate-300">1.1</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">三、应用场景展望</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>职业选手训练辅助：提供个性化战术分析与弱点强化建议</li>
        <li>麻将教学系统：模拟不同水平对手，帮助新手快速成长</li>
        <li>赛事公平性检测：识别异常出牌行为，防范作弊风险</li>
        <li>规则优化研究：通过大数据分析，为联赛规则调整提供参考</li>
      </ul>
      
      <p>据项目负责人介绍，"雀智V4.0"的部分功能将于2026年1月通过腾讯麻将平台向公众开放，职业训练版将与国内外多家麻将协会合作推广。</p>
    `,
    relatedNews: [
        { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行" },
        { id: 1, title: "立直麻将职业联赛新赛季规则调整" },
        { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%" }
      ]
  },
  5:{ 
    id: 5, 
    title: "新一代麻将教学系统发布，采用VR技术", 
    timestamp: "1天前",
    category: ['technology'],
    author: "国际麻将协会",
    avatar: "https://placehold.co/40x40/10b981/ffffff?text=国",
    content: `
      <p class="mb-4">国内知名教育科技公司"智学麻将"今日正式发布新一代VR麻将教学系统"雀境Pro"，该系统通过虚拟现实技术构建沉浸式教学场景，解决传统麻将教学中"抽象规则难理解、实战经验难积累"的痛点。</p>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">一、核心功能亮点</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-center">沉浸式规则教学</h4>
          <p class="text-sm text-center">3D可视化展示牌型组合、役种判定、点数计算过程，支持自由操作演示</p>
        </div>
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-center">AI陪练对战</h4>
          <p class="text-sm text-center">支持从入门到职业级5档难度调节，实时语音讲解出牌逻辑</p>
        </div>
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <h4 class="font-semibold mb-2 text-center">实战场景模拟</h4>
          <p class="text-sm text-center">还原职业联赛、朋友聚会等不同场景，训练应对不同风格对手的能力</p>
        </div>
      </div>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">二、技术优势</h3>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>VR交互体验：支持手势抓牌、打牌、立直操作，还原真实麻将手感</li>
        <li>多语言支持：内置中、日、英、韩四种语言，适配国际用户</li>
        <li>数据化分析：生成个人能力报告，精准定位技术短板（如防守薄弱、役种识别缓慢等）</li>
        <li>多人联机：支持4人VR联机对战，可邀请好友共同练习</li>
      </ul>
      
      <h3 class="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-200">三、产品上市信息</h3>
      <div class="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg mb-4">
        <ul class="list-disc pl-6 space-y-1">
          <li>发布时间：2026年1月15日</li>
          <li>支持设备：Meta Quest 3/Pro、Pico 4、索尼PS VR2</li>
          <li>售价：标准版399元，专业版（含职业选手课程）999元</li>
          <li>早鸟优惠：2025年12月31日前预订可享8折优惠，赠送限定虚拟道具</li>
        </ul>
      </div>
      
      <p class="mb-4">该产品已与中国麻将协会达成合作，将作为"全国青少年麻将推广计划"的指定教学工具，助力麻将运动的规范化、年轻化发展。</p>
      
      <p>目前官网已开放预约通道，首批限量5000套，预计上线后将成为麻将教学领域的标杆产品。</p>
    `,
    relatedNews: [
        { id: 6, title: "亚洲麻将锦标赛将于下月在新加坡举行" },
        { id: 1, title: "立直麻将职业联赛新赛季规则调整" },
        { id: 4, title: "麻将AI研究取得新突破，胜率提升至92%" }
      ]
  }
  //其余新闻
};



export default function NewsProPage() {
  const { theme } = useTheme();
  const { title: encodedTitle } = useParams<{ title: string }>(); // 获取编码后的title
  const [searchParams] = useSearchParams(); 

  const newsId = (() => {
    const idStr = searchParams.get('id'); // 获取id
    if (!idStr) return undefined; 
    const num = parseInt(idStr, 10);
    return isNaN(num) || num <= 0 ? undefined : num; 
  })();

  // 通过id匹配新闻
  const news = newsId ? NEWS_DETAILS[newsId as keyof typeof NEWS_DETAILS] : undefined;

  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1); 
  };
  
    // 解码路径中的title
  const decodedTitle = (() => {
    if (!encodedTitle) return "未知新闻";
    try {
      // 解码URL编码
      const decoded = decodeURIComponent(encodedTitle);
      const withSpaces = decoded.replace(/-/g, " ");
      return withSpaces.replace(/percent/g, "%");
    } catch (e) {
        return "未知新闻";
    }
  })();

  
  //新闻不存在
  if (!news) {
    return (
    <>
      <HomePageHeader />
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">  
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📰 新闻不存在</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            你访问的新闻可能已被删除、链接错误，或参数无效
          </p>
          <button 
            onClick={handleGoBack} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    </>
    );
  }

  return (
    <>
      <HomePageHeader />
      
      
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        {/*<MainNavigation />*/}
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">{news.title}</h1>
              
              {/* 作者信息 */}
              <div className="flex items-center gap-3 mb-6 text-sm text-slate-500 dark:text-slate-400">
                <img src={news.avatar} alt={news.author} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{news.author}</p>
                  <p>{news.timestamp}</p>
                </div>
              </div>
              
              {/* 分类标签组 */}
              <div className="flex flex-wrap gap-2.5 py-1">
                {news.category.map((cat) => {
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG] || DEFAULT_CATEGORY;
                const colorClass = theme === 'dark' ? config.dark : config.light;

                return (
                    <Link
                    key={cat}
                    to={`/news/category/${cat}`}
                    className={`
                        px-3.5 py-1.5 rounded-full 
                        font-medium transition-all duration-200
                        ${config.textSize}  // 放大后的字体（text-sm）
                        ${colorClass}       // 分类专属颜色
                        shadow-sm hover:shadow-md  // hover增强效果
                    `}
                    >
                    {config.label}
                    </Link>
                );
                })}
              </div>
              {/* 新闻内容 */}
              <div 
                className="prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 pt-5"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </article>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <ModuleContainer
              title="相关新闻"
              description="你可能也感兴趣的内容"
              className="sticky top-8"
            >
              <div className="space-y-3">
                {news.relatedNews.map(item => (
                  <Link 
                    key={item.id}
                    to={`/news/pro/${item.title}?id=${item.id}`}
                    className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400">
                      {item.title}
                    </p>
                  </Link>
                ))}
              </div>

              <div className="mt-6">
                <ModuleContainer title="新闻分类" description="浏览更多相关内容">
                  <div className="space-y-2">
                    <CategoryItem label="赛事动态" count="42" path="/news/category/tournament" />
                    <CategoryItem label="规则更新" count="15" path="/news/category/rules" />
                    <CategoryItem label="技术发展" count="23" path="/news/category/technology" />
                    <CategoryItem label="国际交流" count="18" path="/news/category/communication" />
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

// 新闻分类项组件
const CategoryItem = ({ label, count, path }: { label: string; count: string; path: string }) => {
  return (
    <Link
      to={path}
      className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span className="text-slate-800 dark:text-slate-200">{label}</span>
      <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
        {count}
      </span>
    </Link>
  );
};
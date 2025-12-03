import { Link, useLocation } from 'react-router-dom';
import { HomePageHeader, MainNavigation, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 定义帖子基础类型接口
interface BasePost {
  id: number;
  title: string;
  author: string;
  avatar: string;
  time: string;
  views: number;
  replies: number;
  tags: string[];
}

// 热门帖子类型（继承基础类型，新增 lastReply）
interface HotPost extends BasePost {
  lastReply: {
    author: string;
    time: string;
  };
}

// 最新帖子类型（仅基础类型）
interface LatestPost extends BasePost {}

// 模拟论坛板块数据（麻将相关分类）
const FORUM_SECTIONS = [
  {
    id: 1,
    title: "技术交流",
    description: "立直麻将何切讨论、战术分析、牌效研究",
    postCount: 1286,
    icon: "https://placehold.co/40x40/6366f1/ffffff?text=技",
    lastPost: { title: "关于断幺九与立直的选择优先级", author: "雀士A", time: "1小时前" }
  },
  {
    id: 2,
    title: "赛事讨论",
    description: "M-League、雀魂赛事、国际锦标赛相关话题",
    postCount: 854,
    icon: "https://placehold.co/40x40/10b981/ffffff?text=赛",
    lastPost: { title: "今年M-League哪支队伍最有冠军相？", author: "赛事解说员", time: "3小时前" }
  },
  {
    id: 3,
    title: "休闲闲聊",
    description: "麻将相关日常、趣味经历、表情包分享",
    postCount: 2378,
    icon: "https://placehold.co/40x40/ec4899/ffffff?text=聊",
    lastPost: { title: "分享一下我遇到的最离谱的役满", author: "休闲雀士", time: "20分钟前" }
  },
  {
    id: 4,
    title: "新手提问",
    description: "给麻将新手的答疑专区，友好交流",
    postCount: 1562,
    icon: "https://placehold.co/40x40/f59e0b/ffffff?text=新",
    lastPost: { title: "请问符数计算有什么简单的方法？", author: "麻将小白", time: "5小时前" }
  },
  {
    id: 5,
    title: "活动召集",
    description: "线上约战、线下聚会、自定义赛事组织",
    postCount: 439,
    icon: "https://placehold.co/40x40/8b5cf6/ffffff?text=聚",
    lastPost: { title: "本周末线上友谊赛，寻找队友", author: "组织者小明", time: "昨天" }
  }
];

// 模拟热门帖子数据（符合 HotPost 类型）
const HOT_POSTS: HotPost[] = [
  {
    id: 101,
    title: "深度分析：立直麻将中防守的艺术与时机选择",
    author: "职业雀士太郎",
    avatar: "https://placehold.co/32x32/6366f1/ffffff?text=太",
    time: "2天前",
    views: 5892,
    replies: 136,
    lastReply: { author: "战术分析师", time: "30分钟前" },
    tags: ["技术", "防守", "进阶"]
  },
  {
    id: 102,
    title: "M-League最新一轮战报：風林火山队逆转夺冠",
    author: "赛事记者小雅",
    avatar: "https://placehold.co/32x32/ec4899/ffffff?text=雅",
    time: "1天前",
    views: 7231,
    replies: 204,
    lastReply: { author: "风林火山粉丝", time: "15分钟前" },
    tags: ["赛事", "战报", "M-League"]
  },
  {
    id: 103,
    title: "分享一个我打了3年麻将才发现的牌效小技巧",
    author: "老雀士张三",
    avatar: "https://placehold.co/32x32/f59e0b/ffffff?text=张",
    time: "3天前",
    views: 4567,
    replies: 98,
    lastReply: { author: "麻将爱好者", time: "2小时前" },
    tags: ["技巧", "牌效", "经验"]
  }
];

// 模拟最新帖子数据（符合 LatestPost 类型）
const LATEST_POSTS: LatestPost[] = [
  {
    id: 201,
    title: "请问大家都是怎么练习何切的？有什么好的资源推荐吗？",
    author: "新手小李",
    avatar: "https://placehold.co/32x32/10b981/ffffff?text=李",
    time: "20分钟前",
    views: 124,
    replies: 8,
    tags: ["新手", "练习", "资源"]
  },
  {
    id: 202,
    title: "雀魂新角色望月凛的语音也太可爱了吧！",
    author: "萌系雀士",
    avatar: "https://placehold.co/32x32/ec4899/ffffff?text=萌",
    time: "1小时前",
    views: 356,
    replies: 23,
    tags: ["雀魂", "角色", "闲聊"]
  },
  {
    id: 203,
    title: "线下麻将馆推荐：上海这家环境超棒！",
    author: "魔都雀友",
    avatar: "https://placehold.co/32x32/8b5cf6/ffffff?text=魔",
    time: "2小时前",
    views: 289,
    replies: 15,
    tags: ["线下", "推荐", "聚会"]
  },
  {
    id: 204,
    title: "探讨：亲家立直后，子家应该如何选择防守策略？",
    author: "战术研究僧",
    avatar: "https://placehold.co/32x32/6366f1/ffffff?text=研",
    time: "3小时前",
    views: 412,
    replies: 32,
    tags: ["技术", "防守", "立直"]
  },
  {
    id: 205,
    title: "有没有人想周末一起打线上友谊赛？报名啦！",
    author: "活动组织者",
    avatar: "https://placehold.co/32x32/f59e0b/ffffff?text=组",
    time: "5小时前",
    views: 378,
    replies: 45,
    tags: ["活动", "约战", "线上"]
  }
];

// 热门话题标签
const POPULAR_TOPICS = ["何切", "M-League", "雀魂", "役满", "防守", "牌效", "新手教程", "线下聚会"];

export default function ForumPage() {
  const { theme } = useTheme();

  return (
    <>
      {/* 头部组件（复用） */}
      <HomePageHeader />
      
      {/* 导航栏（与其他页面保持一致） */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        < MainNavigation/>
      </nav>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        {/* 页面标题与发帖按钮 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">麻将论坛</h1>
          <CreatePostButton />
        </div>

        {/* 热门话题标签 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {POPULAR_TOPICS.map((topic, index) => (
            <TopicTag key={index} name={topic} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：论坛板块（占1列） */}
          <div className="lg:col-span-1">
            <ModuleContainer
              title="论坛板块"
              description="选择感兴趣的话题分类参与讨论"
              className="sticky top-8"
            >
              <div className="space-y-3">
                {FORUM_SECTIONS.map(section => (
                  <ForumSection key={section.id} section={section} />
                ))}
              </div>
            </ModuleContainer>
          </div>

          {/* 右侧：热门帖子 + 最新帖子（占2列） */}
          <div className="lg:col-span-2 space-y-8">
            {/* 热门推荐帖子 */}
            <ModuleContainer
              title="🔥 热门推荐"
              description="最受关注的优质讨论内容"
            >
              <div className="space-y-4">
                {HOT_POSTS.map(post => (
                  <PostItem key={post.id} post={post} isHot={true} />
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link to="/forum/hot" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
                  查看更多热门帖子 →
                </Link>
              </div>
            </ModuleContainer>

            {/* 最新发布帖子 */}
            <ModuleContainer
              title="⏱️ 最新发布"
              description="刚刚更新的讨论内容"
            >
              <div className="space-y-4">
                {LATEST_POSTS.map(post => (
                  <PostItem key={post.id} post={post} isHot={false} />
                ))}
              </div>
              <div className="mt-4 text-right">
                <Link to="/forum/latest" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
                  查看更多最新帖子 →
                </Link>
              </div>
            </ModuleContainer>
          </div>
        </div>
      </main>
    </>
  );
}

// 发帖按钮组件
const CreatePostButton = () => {
  return (
    <Link
      to="/forum/create-post"
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
    >
      <span className="text-lg">✏️</span>
      <span>发布新帖</span>
    </Link>
  );
};

// 话题标签组件
const TopicTag = ({ name }: { name: string }) => {
  return (
    <Link
      to={`/forum/topic/${name}`}
      className="px-3 py-1 text-sm rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition-colors"
    >
      <span className="inline mr-1">#</span>
      {name}
    </Link>
  );
};

// 论坛板块组件
interface ForumSectionProps {
  section: typeof FORUM_SECTIONS[0];
}
const ForumSection = ({ section }: ForumSectionProps) => {
  return (
    <Link
      to={`/forum/section/${section.id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
        <img src={section.icon} alt={section.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-900 dark:text-white truncate">{section.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{section.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">{section.postCount} 帖子</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
            最后：{section.lastPost.title}
          </span>
        </div>
      </div>
    </Link>
  );
};

// 帖子项组件 props 类型（明确区分两种帖子类型）
interface PostItemProps {
  post: HotPost | LatestPost;
  isHot: boolean;
}

// 类型守卫：判断是否为热门帖子（含 lastReply）
const isHotPost = (post: HotPost | LatestPost): post is HotPost => {
  return 'lastReply' in post;
};

const PostItem = ({ post, isHot }: PostItemProps) => {
  return (
    <Link
      to={`/forum/post/${post.id}`}
      className="flex flex-col md:flex-row gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700"
    >
      {/* 热门标签（仅热门帖子显示） */}
      {isHot && (
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-800 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 rounded">
            <span className="mr-1">🔥</span> 热门
          </span>
        </div>
      )}
      
      {/* 帖子内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 mb-1">
          {post.tags.map((tag, index) => (
            <span key={index} className="text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
          {post.title}
        </h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <div className="flex items-center gap-1">
            <img src={post.avatar} alt={post.author} className="w-4 h-4 rounded-full" />
            <span>{post.author}</span>
          </div>
          <span>{post.time}</span>
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>{post.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💬</span>
            <span>{post.replies}</span>
          </div>
          {/* 最后回复（仅热门帖子且存在 lastReply 时显示） */}
          {isHot && isHotPost(post) && (
            <span className="truncate">最后：{post.lastReply.author}</span>
          )}
        </div>
      </div>
    </Link>
  );
};
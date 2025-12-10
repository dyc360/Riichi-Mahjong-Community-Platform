import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';

// 类型定义
export interface ForumSection {
    id: number;
    title: string;
    name: string;
    description: string;
    icon: string;
    postCount: number;
    lastPost: {
        id: number;
        title: string;
        author: string;
        time: string;
    };
}

export interface ForumPost {
    id: number;
    title: string;
    author: string;
    avatar: string;
    time: string;
    views: number;
    replies: number;
    tags: string[];
    isHot?: boolean;
}

// 板块数据
export const FORUM_SECTIONS: ForumSection[] = [
    {
        id: 1,
        title: "技术交流",
        name: "tech",
        description: "立直麻将何切讨论、战术分析、牌效研究",
        icon: "https://placehold.co/64x64/6366f1/ffffff?text=技",
        postCount: 1286,
        lastPost: {
            id: 108,
            title: "关于断幺九与立直的选择优先级",
            author: "雀士A",
            time: "1小时前"
        }
    },
    {
        id: 2,
        title: "赛事讨论",
        name: "competition",
        description: "M-League、雀魂赛事、国际锦标赛相关话题",
        icon: "https://placehold.co/64x64/10b981/ffffff?text=赛",
        postCount: 854,
        lastPost: {
            id: 112,
            title: "今年M-League哪支队伍最有冠军相？",
            author: "赛事解说员",
            time: "3小时前"
        }
    },
    {
        id: 3,
        title: "休闲闲聊",
        name: "chat",
        description: "麻将相关日常、趣味经历、表情包分享",
        icon: "https://placehold.co/64x64/ec4899/ffffff?text=聊",
        postCount: 2378,
        lastPost: {
            id: 115,
            title: "分享一下我遇到的最离谱的役满",
            author: "休闲雀士",
            time: "20分钟前"
        }
    },
    {
        id: 4,
        title: "新手提问",
        name: "newbie",
        description: "给麻将新手的答疑专区，友好交流",
        icon: "https://placehold.co/64x64/f59e0b/ffffff?text=新",
        postCount: 1562,
        lastPost: {
            id: 118,
            title: "请问符数计算有什么简单的方法？",
            author: "麻将小白",
            time: "5小时前"
        }
    },
    {
        id: 5,
        title: "活动召集",
        name: "events",
        description: "线上约战、线下聚会、自定义赛事组织",
        icon: "https://placehold.co/64x64/8b5cf6/ffffff?text=聚",
        postCount: 439,
        lastPost: {
            id: 121,
            title: "本周末线上友谊赛，寻找队友",
            author: "组织者小明",
            time: "昨天"
        }
    }
];

// 帖子数据
const HOT_POSTS: ForumPost[] = [
    {
        id: 1,
        title: "深度分析：立直麻将中防守的艺术与时机选择",
        author: "职业雀士太郎",
        avatar: "https://placehold.co/32x32/6366f1/ffffff?text=太",
        time: "2天前",
        views: 5892,
        replies: 136,
        tags: ["技术", "防守", "进阶"],
        isHot: true
    },
    {
        id: 2,
        title: "M-League最新一轮战报：風林火山队逆转夺冠",
        author: "赛事记者",
        avatar: "https://placehold.co/32x32/f59e0b/ffffff?text=记",
        time: "1天前",
        views: 4567,
        replies: 98,
        tags: ["赛事", "战报", "M-League"],
        isHot: true
    }
];

const LATEST_POSTS: ForumPost[] = [
    {
        id: 3,
        title: "新手提问：什么是食断？如何正确运用？",
        author: "麻将新手",
        avatar: "https://placehold.co/32x32/10b981/ffffff?text=新",
        time: "3小时前",
        views: 128,
        replies: 8,
        tags: ["新手", "规则", "食断"]
    },
    {
        id: 4,
        title: "分享一个提升牌效的小技巧",
        author: "进阶玩家",
        avatar: "https://placehold.co/32x32/8b5cf6/ffffff?text=进",
        time: "5小时前",
        views: 345,
        replies: 12,
        tags: ["技巧", "牌效", "进阶"]
    }
];

export default function ForumSectionPage() {
    const { theme } = useTheme();
    const { sectionname } = useParams<{ sectionname: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // 改为 const，不调用 setSearchParams
    const [section, setSection] = useState<ForumSection | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sortType = searchParams.get('sort') || 'latest';
    const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1;

    const postsPerPage = 10;

    useEffect(() => {
        console.log('路由参数 sectionname:', sectionname);

        // 根据sectionname查找板块
        const foundSection = FORUM_SECTIONS.find(s => s.name === sectionname) || FORUM_SECTIONS[0];

        if (!foundSection) {
            setError("该板块不存在，已为您跳转到默认板块");
            setSection(FORUM_SECTIONS[0]);
        } else {
            setSection(foundSection);
            setError(null);
        }

        // 模拟获取帖子数据
        const fetchPosts = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 800));

                // 模拟按板块筛选帖子
                let sectionPosts: ForumPost[] = [
                    ...HOT_POSTS.map(post => ({ ...post, isHot: true })),
                    ...LATEST_POSTS.map(post => ({ ...post }))
                ];

                // 按排序方式处理
                if (sortType === 'hot') {
                    sectionPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
                } else {
                    sectionPosts.sort((a, b) => b.time.localeCompare(a.time));
                }

                setPosts(sectionPosts);
            } catch (err) {
                setError("获取帖子失败，请稍后重试");
                console.error('获取帖子失败:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [sectionname, sortType, currentPage]);

    const handleSortChange = (newSortType: string) => {
        navigate(`?sort=${newSortType}&page=1`, { replace: true });
    };

    // 处理页码变更
    const handlePageChange = (page: number) => {
        if (page < 1 || page > Math.ceil(posts.length / postsPerPage)) return;

        navigate(`?sort=${sortType}&page=${page}`, { replace: true });
        window.scrollTo(0, 0);
    };

    // 计算分页
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

    const handleGoBack = () => {
        navigate(-1);
    };

    // 加载状态
    if (loading) {
        return (
            <>
                <HomePageHeader />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-60">
                        <div className="text-center">
                            <div className="inline-block w-12 h-12 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400">加载板块数据中...</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }
    console.log("section:", section);
    // section为null则暂时使用第一个板块
    const renderSection = section || FORUM_SECTIONS[0];

    return (
        <>
            <HomePageHeader />

            <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2">
                    {/* 错误提示 */}
                    {error && (
                        <div className="mr-auto px-3 py-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-sm">
                            ⚠️ {error}
                        </div>
                    )}
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
                {/* 板块头部 */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                            <img src={renderSection.icon} alt={renderSection.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{renderSection.title}</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">{renderSection.description}</p>
                            <div className="flex items-center gap-6 mt-3 flex-wrap">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    帖子总数: <span className="font-medium text-slate-900 dark:text-white">{renderSection.postCount}</span>
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    最后发布: <Link to={`/forum/post/${renderSection.lastPost.id}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{renderSection.lastPost.title}</Link>
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Link
                                to="/forum/create-post"
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                            >
                                <span className="text-lg">✏️</span>
                                <span>发布新帖</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 帖子列表 */}
                <ModuleContainer>
                    {/* 排序选项 */}
                    <div className="flex flex-wrap items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            全部帖子 <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">({renderSection.postCount})</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">排序方式:</span>
                            <button
                                onClick={() => handleSortChange('latest')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortType === 'latest'
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                最新发布
                            </button>
                            <button
                                onClick={() => handleSortChange('hot')}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${sortType === 'hot'
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                热门推荐
                            </button>
                        </div>
                    </div>

                    {/* 帖子列表内容 */}
                    {posts.length === 0 ? (
                        <div className="text-center p-10 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">该板块暂无帖子</p>
                            <Link
                                to="/forum/create-post"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <span>发布第一篇帖子</span>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {currentPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-4">
                                            <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <Link
                                                        to={`/forum/post/${post.id}`}
                                                        className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                                                    >
                                                        {post.title}
                                                    </Link>
                                                    {post.isHot && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            热门
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span>作者: {post.author}</span>
                                                    <span>发布于: {post.time}</span>
                                                    <span>浏览: {post.views}</span>
                                                    <span>回复: {post.replies}</span>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {post.tags.map((tag, index) => (
                                                        <Link
                                                            key={index}
                                                            to={`/forum/topic/${tag}`}
                                                            className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                                                        >
                                                            {tag}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 分页控件 */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex justify-center">
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {currentPage > 2 && (
                                            <button
                                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => handlePageChange(1)}
                                            >
                                                1
                                            </button>
                                        )}

                                        {currentPage > 3 && <span className="text-slate-500 dark:text-slate-400">...</span>}

                                        {currentPage > 1 && (
                                            <button
                                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                            >
                                                {currentPage - 1}
                                            </button>
                                        )}

                                        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-500 text-white">
                                            {currentPage}
                                        </button>

                                        {currentPage < totalPages && (
                                            <button
                                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                            >
                                                {currentPage + 1}
                                            </button>
                                        )}

                                        {currentPage < totalPages - 2 && <span className="text-slate-500 dark:text-slate-400">...</span>}

                                        {currentPage < totalPages - 1 && (
                                            <button
                                                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => handlePageChange(totalPages)}
                                            >
                                                {totalPages}
                                            </button>
                                        )}

                                        <button
                                            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </ModuleContainer>
            </main>
        </>
    );
}
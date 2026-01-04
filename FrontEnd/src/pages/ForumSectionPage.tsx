import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { useForum, type ForumSection, type ForumPost } from '../contexts/ForumContext';

// 格式化相对时间
const formatRelativeTime = (dateString: string): string => {
	const date = new Date(dateString);
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInMinutes < 1) {
		return '刚刚';
	} else if (diffInMinutes < 60) {
		return `${diffInMinutes}分钟前`;
	} else if (diffInHours < 24) {
		return `${diffInHours}小时前`;
	} else if (diffInDays < 7) {
		return `${diffInDays}天前`;
	} else {
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric'
		});
	}
};

// 生成头像URL
const getAvatarUrl = (username: string): string => {
	return `https://placehold.co/32x32/6366f1/ffffff?text=${username.charAt(0)}`;
};

export default function ForumSectionPage() {
    const { theme } = useTheme();
    const { sectionname } = useParams<{ sectionname: string }>();
    const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { sections, fetchSections, fetchPosts } = useForum();

    const [section, setSection] = useState<ForumSection | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sortType = searchParams.get('sort') || 'latest';
    const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1;
    const postsPerPage = 10;

	// 加载板块和帖子
    useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				setError(null);

				// 加载板块列表
				await fetchSections();
			} catch (err) {
				console.error('加载板块失败:', err);
				setError('加载板块失败，请稍后重试');
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [fetchSections]);

        // 根据sectionname查找板块
	useEffect(() => {
		if (sections.length > 0 && sectionname) {
			const foundSection = sections.find(s => s.name === sectionname);
			if (foundSection) {
            setSection(foundSection);
            setError(null);
			} else {
				setError("该板块不存在");
				setSection(null);
			}
		}
	}, [sections, sectionname]);

	const [totalCount, setTotalCount] = useState(0);

	// 加载帖子列表
	useEffect(() => {
		const loadPosts = async () => {
			if (!sectionname) return;

			try {
				setLoading(true);
				const result = await fetchPosts({
					section: sectionname,
					sort: sortType as 'latest' | 'hot',
					page: currentPage,
					page_size: postsPerPage,
				});
				setPosts(result.results);
				setTotalCount(result.count);
            } catch (err) {
				console.error('加载帖子失败:', err);
				setError('加载帖子失败，请稍后重试');
            } finally {
                setLoading(false);
            }
        };

		loadPosts();
	}, [sectionname, sortType, currentPage, fetchPosts, postsPerPage]);

    const handleSortChange = (newSortType: string) => {
        navigate(`?sort=${newSortType}&page=1`, { replace: true });
    };

    const handlePageChange = (page: number) => {
		if (page < 1) return;
        navigate(`?sort=${sortType}&page=${page}`, { replace: true });
        window.scrollTo(0, 0);
    };

    const totalPages = Math.ceil(totalCount / postsPerPage);
    const currentPosts = posts;

    const handleGoBack = () => {
        navigate(-1);
    };

	if (loading && !section) {
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

	if (!section) {
		return (
			<>
				<HomePageHeader />
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
					<div className="text-center py-12">
						<p className="text-red-600 dark:text-red-400 mb-4">{error || "板块不存在"}</p>
						<button
							onClick={handleGoBack}
							className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
						>
							返回上一页
						</button>
					</div>
				</main>
			</>
		);
	}

    return (
        <>
            <HomePageHeader />

            <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2">
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
							<img src={section.icon || `https://placehold.co/64x64/6366f1/ffffff?text=${section.title.charAt(0)}`} alt={section.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
							<h1 className="text-2xl font-bold text-slate-900 dark:text-white">{section.title}</h1>
							<p className="text-slate-600 dark:text-slate-400 mt-1">{section.description}</p>
                            <div className="flex items-center gap-6 mt-3 flex-wrap">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
									帖子总数: <span className="font-medium text-slate-900 dark:text-white">{section.post_count}</span>
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
							全部帖子 <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">({section.post_count})</span>
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
					{loading ? (
						<div className="text-center py-10">
							<div className="inline-block w-8 h-8 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
							<p className="text-slate-500 dark:text-slate-400">加载帖子中...</p>
						</div>
					) : posts.length === 0 ? (
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
											<img src={getAvatarUrl(post.author_name)} alt={post.author_name} className="w-10 h-10 rounded-full flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <Link
														to={`/forum/post/${encodeURIComponent(post.title)}`}
                                                        className="font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                                                    >
                                                        {post.title}
                                                    </Link>
													{post.is_hot && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            热门
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
													<span>作者: {post.author_name}</span>
													<span>发布于: {formatRelativeTime(post.created_at)}</span>
                                                    <span>浏览: {post.views}</span>
													<span>回复: {post.replies_count}</span>
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
											className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

										{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
											let pageNum;
											if (totalPages <= 5) {
												pageNum = i + 1;
											} else if (currentPage <= 3) {
												pageNum = i + 1;
											} else if (currentPage >= totalPages - 2) {
												pageNum = totalPages - 4 + i;
											} else {
												pageNum = currentPage - 2 + i;
											}
											return (
                                            <button
													key={pageNum}
													className={`w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 ${currentPage === pageNum ? 'bg-indigo-500 text-white border-indigo-500' : ''}`}
													onClick={() => handlePageChange(pageNum)}
                                            >
													{pageNum}
                                            </button>
											);
										})}

                                        <button
											className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

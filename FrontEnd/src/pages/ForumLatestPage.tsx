import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { useForum, type ForumPost } from '../contexts/ForumContext';

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

// 帖子项组件
const LatestPostItem = ({ post }: { post: ForumPost }) => {
	return (
		<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
			<div className="flex gap-4">
				<div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
					<img src={getAvatarUrl(post.author_name)} alt={post.author_name} className="w-full h-full object-cover" />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap gap-2 mb-1">
						{post.tags.map((tag, index) => (
							<Link
								key={index}
								to={`/forum/topic/${tag}`}
								className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
							>
								{tag}
							</Link>
						))}
						{post.is_hot && (
							<span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
								热门
							</span>
						)}
					</div>

					<Link to={`/forum/post/${encodeURIComponent(post.title)}`} className="hover:underline">
						<h3 className="font-medium text-slate-900 dark:text-white mb-1 truncate">{post.title}</h3>
					</Link>

					<div className="flex items-center justify-between">
						<div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
							<span>{post.author_name}</span>
							<span className="mx-2">·</span>
							<span>{formatRelativeTime(post.created_at)}</span>
						</div>

						<div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
							<span>👁️ {post.views}</span>
							<span>💬 {post.replies_count}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function ForumLatestPage() {
	const { theme } = useTheme();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { fetchLatestPosts } = useForum();
	const [posts, setPosts] = useState<ForumPost[]>([]);
	const [loading, setLoading] = useState(true);

	const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1;
	const postsPerPage = 10;

	const [totalCount, setTotalCount] = useState(0);

	useEffect(() => {
		const fetchLatestPostsData = async () => {
			try {
				setLoading(true);
				const result = await fetchLatestPosts(currentPage, postsPerPage);
				setPosts(result.results);
				setTotalCount(result.count);
			} catch (error) {
				console.error('获取最新帖子失败:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchLatestPostsData();
	}, [currentPage, fetchLatestPosts, postsPerPage]);

	const handlePageChange = (page: number) => {
		if (page < 1 || page > Math.ceil(totalCount / postsPerPage)) return;
		navigate(`?page=${page}`, { replace: true });
		window.scrollTo(0, 0);
	};

	const totalPages = Math.ceil(totalCount / postsPerPage);
	const currentPosts = posts;

	const handleGoBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<>
				<HomePageHeader />
				<main className="container mx-auto px-4 py-8">
					<div className="flex justify-center items-center h-60">
						<div className="text-center">
							<div className="inline-block w-12 h-12 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
							<p className="text-slate-600 dark:text-slate-400">加载最新帖子中...</p>
						</div>
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
				<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
					<h1 className="text-3xl font-bold text-slate-900 dark:text-white">最新帖子</h1>
					<Link
						to="/forum/create-post"
						className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg self-start"
					>
						<span className="text-lg">✏️</span>
						<span>发布新帖</span>
					</Link>
				</div>

				<ModuleContainer title="最新帖子列表" description="按发布时间排序的最新讨论内容">
					{currentPosts.length > 0 ? (
						<>
							<div className="space-y-4">
								{currentPosts.map(post => (
									<LatestPostItem key={post.id} post={post} />
								))}
							</div>

							{/* 分页控件 */}
							{totalPages > 1 && (
								<div className="mt-8 flex justify-center items-center gap-2">
									<button
										onClick={() => handlePageChange(currentPage - 1)}
										disabled={currentPage === 1}
										className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
									>
										上一页
									</button>

									{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
										<button
											key={page}
											onClick={() => handlePageChange(page)}
											className={`w-8 h-8 flex items-center justify-center rounded ${page === currentPage
												? 'bg-indigo-600 text-white'
												: 'border hover:bg-gray-100 dark:hover:bg-slate-700'
												}`}
										>
											{page}
										</button>
									))}

									<button
										onClick={() => handlePageChange(currentPage + 1)}
										disabled={currentPage === totalPages}
										className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
									>
										下一页
									</button>
								</div>
							)}
						</>
					) : (
						<div className="py-12 text-center">
							<p className="text-slate-500 dark:text-slate-400">暂无最新帖子数据</p>
						</div>
					)}
				</ModuleContainer>
			</main>
		</>
	);
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomePageHeader, MainNavigation, ModuleContainer } from '../components/homePageComp';
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

// 热门话题标签
const POPULAR_TOPICS = ["何切", "M-League", "雀魂", "役满", "防守", "牌效", "新手", "练习", "线下", "聚会"];

export default function ForumPage() {
	const { theme } = useTheme();
	const { sections, sectionsLoading, fetchSections, fetchHotPosts, fetchLatestPosts } = useForum();
	const [hotPosts, setHotPosts] = useState<ForumPost[]>([]);
	const [latestPosts, setLatestPosts] = useState<ForumPost[]>([]);
	const [loading, setLoading] = useState(true);

	// 初始加载数据
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);
				await Promise.all([
					fetchSections(),
					fetchHotPosts().then(setHotPosts),
					fetchLatestPosts().then(setLatestPosts),
				]);
			} catch (error) {
				console.error('加载论坛数据失败:', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [fetchSections, fetchHotPosts, fetchLatestPosts]);

	// 每30s刷新热门帖子和最新帖子
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				await Promise.all([
					fetchHotPosts().then(setHotPosts),
					fetchLatestPosts().then(setLatestPosts),
				]);
			} catch (error) {
				console.error('刷新帖子数据失败:', error);
			}
		}, 10000); // 10秒刷新一次

		return () => clearInterval(interval);
	}, [fetchHotPosts, fetchLatestPosts]);

	return (
		<>
			<HomePageHeader />

			<nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
				<MainNavigation />
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

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<div className="text-center">
							<div className="inline-block w-12 h-12 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
							<p className="text-slate-600 dark:text-slate-400">加载中...</p>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/*论坛板块 */}
						<div className="lg:col-span-1">
							<ModuleContainer
								title="论坛板块"
								description="选择感兴趣的话题分类参与讨论"
								className="sticky top-8"
							>
								<div className="space-y-3">
									{sectionsLoading ? (
										<div className="text-center py-4 text-slate-500 dark:text-slate-400">加载板块中...</div>
									) : sections.length > 0 ? (
										sections.map(section => (
											<ForumSection key={section.id} section={section} />
										))
									) : (
										<div className="text-center py-4 text-slate-500 dark:text-slate-400">暂无板块数据</div>
									)}
								</div>
							</ModuleContainer>
						</div>

						{/* 热门帖子&最新帖子 */}
						<div className="lg:col-span-2 space-y-8">
							{/* 热门推荐 */}
							<ModuleContainer
								title="🔥 热门推荐"
								description="最受关注的优质讨论内容"
							>
								<div className="space-y-4">
									{hotPosts.slice(0, 4).map(post => (
										<PostItem key={post.id} post={post} isHot={true} />
									))}
								</div>
								<div className="mt-4 text-right">
									<Link to="/forum/hot?page=1" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
										查看更多热门帖子 →
									</Link>
								</div>
							</ModuleContainer>

							{/* 最新发布 */}
							<ModuleContainer
								title="⏱️ 最新发布"
								description="刚刚更新的讨论内容"
							>
								<div className="space-y-4">
									{latestPosts.slice(0, 5).map(post => (
										<PostItem key={post.id} post={post} isHot={false} />
									))}
								</div>
								<div className="mt-4 text-right">
									<Link to="/forum/latest?page=1" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
										查看更多最新帖子 →
									</Link>
								</div>
							</ModuleContainer>
						</div>
					</div>
				)}
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
	section: ForumSection;
}
const ForumSection = ({ section }: ForumSectionProps) => {
	return (
		<Link
			to={`/forum/section/${section.name}?page=1`}
			className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700"
		>
			<div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
				<img src={section.icon || `https://placehold.co/40x40/6366f1/ffffff?text=${section.title.charAt(0)}`} alt={section.title} className="w-full h-full object-cover" />
			</div>
			<div className="flex-1 min-w-0">
				<h3 className="font-medium text-slate-900 dark:text-white truncate">{section.title}</h3>
				<p className="text-xs text-slate-500 dark:text-slate-400 truncate">{section.description}</p>
				<div className="flex items-center gap-2 mt-1">
					<span className="text-xs text-slate-400 dark:text-slate-500">{section.post_count} 帖子</span>
				</div>
			</div>
		</Link>
	);
};

// 帖子项组件
interface PostItemProps {
	post: ForumPost;
	isHot: boolean;
}

const PostItem = ({ post, isHot }: PostItemProps) => {
	return (
		<Link
			to={`/forum/post/${encodeURIComponent(post.title)}`}
			className="flex flex-col md:flex-row gap-3 p-4 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700"
		>
			{/* 热门标签*/}
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
						<img src={getAvatarUrl(post.author_name)} alt={post.author_name} className="w-4 h-4 rounded-full" />
						<span>{post.author_name}</span>
					</div>
					<span>{formatRelativeTime(post.created_at)}</span>
					<div className="flex items-center gap-1">
						<span>👁️</span>
						<span>{post.views}</span>
					</div>
					<div className="flex items-center gap-1">
						<span>💬</span>
						<span>{post.replies_count}</span>
					</div>
				</div>
			</div>
		</Link>
	);
};

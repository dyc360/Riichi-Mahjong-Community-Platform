import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { useCategories, getCategoryDisplayName, type Category } from '../contexts/CategoriesContext';
import { useNews, type Article } from '../contexts/NewsContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

// 文章详情缓存配置
const ARTICLE_CACHE_KEY = 'news_article_detail_cache';
const ARTICLE_CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存

interface CachedArticle {
	article: Article;
	timestamp: number;
}

// 相关新闻项接口
interface RelatedNewsItem {
	id: number;
	title: string;
}

// 新闻详情接口（适配原有结构）
interface NewsDetail {
	id: number;
	title: string;
	timestamp: string;
	category: string[];
	author: string;
	avatar: string;
	content: string;
	relatedNews: RelatedNewsItem[];
}

// 根据分类 slug 获取配置（动态生成）
const getCategoryConfig = (slug: string, categories: Category[]) => {
	const category = categories.find(cat => cat.slug === slug);
	if (!category) {
		return {
			label: `#${slug}`,
			light: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
			dark: 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/40',
			textSize: 'text-sm'
		};
	}

	// 根据分类名称生成配置
	const colors = [
		{ light: 'bg-amber-100 text-amber-700 hover:bg-amber-200', dark: 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/40' },
		{ light: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200', dark: 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-800/40' },
		{ light: 'bg-purple-100 text-purple-700 hover:bg-purple-200', dark: 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40' },
		{ light: 'bg-rose-100 text-rose-700 hover:bg-rose-200', dark: 'bg-rose-900/30 text-rose-300 hover:bg-rose-800/40' },
		{ light: 'bg-blue-100 text-blue-700 hover:bg-blue-200', dark: 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/40' },
		{ light: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200', dark: 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40' },
	];

	const colorIndex = categories.findIndex(cat => cat.slug === slug) % colors.length;
	const color = colors[colorIndex] || colors[0];

	return {
		label: `#${getCategoryDisplayName(category)}`,
		light: color.light,
		dark: color.dark,
		textSize: 'text-sm'
	};
};

// 默认分类
const DEFAULT_CATEGORY = {
	label: '#暂无分类',
	light: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
	dark: 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/40',
	textSize: 'text-sm'
};


// 生成头像 URL
const generateAvatarUrl = (authorName: string): string => {
	const firstChar = authorName.charAt(0);
	const colors = ['6366f1', '10b981', 'ec4899', 'f59e0b', 'ef4444', '8b5cf6'];
	const color = colors[authorName.length % colors.length];
	return `https://placehold.co/40x40/${color}/ffffff?text=${encodeURIComponent(firstChar)}`;
};

// 格式化时间为相对时间
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
			month: 'numeric',
			day: 'numeric'
		});
	}
};

export default function NewsProPage() {
	const { theme } = useTheme();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { categories } = useCategories();
	const { getLatestNews, newsList, getNewsByCategory } = useNews();

	const [loading, setLoading] = useState(true);
	const [loadingContent, setLoadingContent] = useState(true); // 单独管理内容加载状态
	const [error, setError] = useState<string | null>(null);
	const [article, setArticle] = useState<Article | null>(null);

	const newsId = useMemo(() => {
		const idStr = searchParams.get('id');
		if (!idStr) return undefined;
		const num = parseInt(idStr, 10);
		return isNaN(num) || num <= 0 ? undefined : num;
	}, [searchParams]);

	// 尝试从缓存获取文章
	const getCachedArticle = (id: number): Article | null => {
		try {
			const cached = localStorage.getItem(`${ARTICLE_CACHE_KEY}_${id}`);
			if (!cached) return null;

			const { article, timestamp }: CachedArticle = JSON.parse(cached);
			const now = Date.now();

			// 检查缓存是否过期
			if (now - timestamp > ARTICLE_CACHE_DURATION) {
				localStorage.removeItem(`${ARTICLE_CACHE_KEY}_${id}`);
				return null;
			}

			return article;
		} catch {
			return null;
		}
	};

	// 保存文章到缓存
	const setCachedArticle = (id: number, article: Article) => {
		try {
			const cached: CachedArticle = {
				article,
				timestamp: Date.now()
			};
			localStorage.setItem(`${ARTICLE_CACHE_KEY}_${id}`, JSON.stringify(cached));
		} catch (error) {
			console.warn('保存文章缓存失败:', error);
		}
	};

	// 从后端获取完整的文章详情（包含 content）
	useEffect(() => {
		const fetchArticleDetail = async () => {
			if (!newsId) {
				setError('新闻ID无效');
				setLoading(false);
				setLoadingContent(false);
				return;
			}

			// 先尝试从缓存获取
			const cachedArticle = getCachedArticle(newsId);
			if (cachedArticle) {
				setArticle(cachedArticle);
				setLoading(false);
				setLoadingContent(false);
				// 后台静默更新（不阻塞UI）
				try {
					const response = await axios.get<Article>(`${API_BASE_URL}/news_api/articles/${newsId}/`);
					setArticle(response.data);
					setCachedArticle(newsId, response.data);
				} catch (err) {
					console.warn('后台更新文章失败:', err);
				}
				return;
			}

			// 尝试从列表数据中获取基本信息（如果有的话）
			const newsItem = newsList.find(item => item.id === newsId);
			if (newsItem) {
				// 先显示基本信息，让用户看到标题等
				// 构建一个临时的 Article 对象（缺少 content，但可以先显示其他信息）
				const tempArticle: Article = {
					id: newsItem.id,
					title: newsItem.title,
					content: '', // 稍后从详情接口获取
					summary: newsItem.summary,
					cover_image: newsItem.cover_image,
					category_name: newsItem.category_name,
					author_name: newsItem.author_name,
					published_at: new Date().toISOString(), // 临时值，稍后更新
					views: newsItem.views,
					status: 'published',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				};
				setArticle(tempArticle);
				setLoading(false);
			}

			try {
				setLoadingContent(true);
				setError(null);

				// 调用详情接口获取完整内容
				const response = await axios.get<Article>(`${API_BASE_URL}/news_api/articles/${newsId}/`);
				setArticle(response.data);
				setCachedArticle(newsId, response.data);
			} catch (err: any) {
				console.error('获取文章详情失败:', err);
				if (err.response?.status === 404) {
					setError('文章不存在或已被删除');
				} else {
					setError('获取文章详情失败，请稍后重试');
				}
			} finally {
				setLoading(false);
				setLoadingContent(false);
			}
		};

		fetchArticleDetail();
	}, [newsId, newsList]);

	// 获取相关新闻（排除当前文章）
	const relatedNews = useMemo(() => {
		if (!newsId) return [];
		return getLatestNews(10)
			.filter(news => news.id !== newsId)
			.slice(0, 3)
			.map(news => ({
				id: news.id,
				title: news.title
			}));
	}, [newsId, getLatestNews]);

	// 转换新闻详情数据
	const news = useMemo<NewsDetail | null>(() => {
		if (!article) return null;

		// 获取分类 slug
		const newsItem = newsList.find(item => item.id === article.id);
		const categorySlugs = newsItem?.category || [];

		return {
			id: article.id,
			title: article.title,
			timestamp: formatRelativeTime(article.published_at),
			category: categorySlugs,
			author: article.author_name,
			avatar: generateAvatarUrl(article.author_name),
			content: article.content || '',
			relatedNews: relatedNews
		};
	}, [article, newsList, relatedNews]);

	// 加载状态由 fetchArticleDetail 的 useEffect 管理，这里不需要额外的处理

	const handleGoBack = () => {
		navigate(-1);
	};

	// 骨架屏组件
	const SkeletonLoader = () => (
		<div className="animate-pulse">
			<div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
			<div className="flex items-center gap-3 mb-6">
				<div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
				<div className="space-y-2">
					<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
					<div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
				</div>
			</div>
			<div className="flex gap-2 mb-6">
				<div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
				<div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
			</div>
			<div className="space-y-3">
				<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
				<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
				<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
				<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
				<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/6"></div>
			</div>
		</div>
	);

	// 完全加载状态（首次加载且没有缓存）
	if (loading && !article) {
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
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<article className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 md:p-8">
								<SkeletonLoader />
							</article>
						</div>
					</div>
				</main>
			</>
		);
	}

	// 错误状态
	if (error || !news) {
		return (
			<>
				<HomePageHeader />
				<div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
					<div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 max-w-md text-center">
						<h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">📰 {error || '新闻不存在'}</h2>
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
									const config = cat ? getCategoryConfig(cat, categories) : DEFAULT_CATEGORY;
									const colorClass = theme === 'dark' ? config.dark : config.light;

									if (!cat) return null;

									return (
										<Link
											key={cat}
											to={`/news/category/${cat}`}
											className={`
												px-3.5 py-1.5 rounded-full 
												font-medium transition-all duration-200
												${config.textSize}
												${colorClass}
												shadow-sm hover:shadow-md
											`}
										>
											{config.label}
										</Link>
									);
								})}
							</div>

							{/* 新闻内容 */}
							{loadingContent ? (
								<div className="pt-5">
									<div className="animate-pulse space-y-3">
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/6"></div>
										<div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
									</div>
								</div>
							) : (
								<div
									className="prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 pt-5"
									dangerouslySetInnerHTML={{ __html: news.content }}
								/>
							)}
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
										to={`/news/pro/${encodeURIComponent(item.title.replace(/\s+/g, '-').replace(/%/g, 'percent'))}?id=${item.id}`}
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
										{categories
											.sort((a, b) => {
												// 将 default 分类排到最后
												if (a.slug === 'default') return 1;
												if (b.slug === 'default') return -1;
												return 0;
											})
											.map((category) => {
												const newsCount = getNewsByCategory(category.slug).length;
												return (
													<CategoryItem
														key={category.id}
														label={getCategoryDisplayName(category)}
														count={newsCount > 0 ? newsCount.toString() : undefined}
														path={`/news/category/${category.slug}`}
													/>
												);
											})}
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
const CategoryItem = ({ label, count, path }: { label: string; count?: string; path: string }) => {
	return (
		<Link
			to={path}
			className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
		>
			<span className="text-slate-800 dark:text-slate-200">{label}</span>
			{count && (
				<span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
					{count}
				</span>
			)}
		</Link>
	);
};
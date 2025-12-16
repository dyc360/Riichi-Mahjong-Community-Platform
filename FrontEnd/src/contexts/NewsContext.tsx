import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useCategories } from './CategoriesContext';

const API_BASE_URL = 'http://localhost:8000/api';

// 文章接口
export interface Article {
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

// 新闻列表项接口
export interface NewsListItem {
	id: number;
	title: string;
	timestamp: string;
	category: string[];
	category_name: string;
	author_name: string;
	summary: string;
	cover_image: string | null;
	views: number;
}

interface NewsContextType {
	// 数据
	articles: Article[];
	newsList: NewsListItem[];
	loading: boolean;
	error: string | null;
	lastUpdated: number | null;

	// 方法
	refreshNews: () => Promise<void>;
	getNewsByCategory: (categorySlug: string) => NewsListItem[];
	getNewsById: (id: number) => Article | undefined;
	searchNews: (keyword: string) => NewsListItem[];
	getLatestNews: (limit?: number) => NewsListItem[];
}

const NewsContext = createContext<NewsContextType | undefined>(undefined);

// 缓存键名
const CACHE_KEY = 'news_articles_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2分钟缓存

interface CachedData {
	articles: Article[];
	timestamp: number;
}

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

// 将 Article转换为NewsListItem
const transformArticleToNewsItem = (article: Article, categorySlugMap: Map<string, string>): NewsListItem => {
	return {
		id: article.id,
		title: article.title,
		timestamp: formatRelativeTime(article.published_at),
		category: categorySlugMap.has(article.category_name)
			? [categorySlugMap.get(article.category_name)!]
			: [],
		category_name: article.category_name,
		author_name: article.author_name,
		summary: article.summary,
		cover_image: article.cover_image,
		views: article.views
	};
};

// 内部组件，用于访问 CategoriesContext
function NewsProviderInner({ children }: { children: ReactNode }) {
	// 获取分类列表
	const { categories } = useCategories();

	const [articles, setArticles] = useState<Article[]>([]);
	const [newsList, setNewsList] = useState<NewsListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<number | null>(null);
	const [categorySlugMap, setCategorySlugMap] = useState<Map<string, string>>(new Map());

	// 从 CategoriesContext 更新分类映射
	useEffect(() => {
		if (categories.length > 0) {
			const map = new Map<string, string>();
			categories.forEach(cat => {
				map.set(cat.name, cat.slug);
				map.set(cat.slug, cat.slug);
			});
			setCategorySlugMap(map);
		}
	}, [categories]);

	// 获取新闻数据
	const fetchNews = useCallback(async (useCache: boolean = true) => {
		try {
			// 尝试从缓存读取
			if (useCache) {
				const cached = localStorage.getItem(CACHE_KEY);
				if (cached) {
					try {
						const cachedData: CachedData = JSON.parse(cached);
						const now = Date.now();
						if (now - cachedData.timestamp < CACHE_DURATION) {
							setArticles(cachedData.articles);
							// 使用当前的 categorySlugMap 转换
							const transformed = cachedData.articles
								.filter(article => article.status === 'published')
								.map(article => transformArticleToNewsItem(article, categorySlugMap));
							setNewsList(transformed);
							setLastUpdated(cachedData.timestamp);
							setLoading(false);
							setError(null);
							return;
						}
					} catch (e) {
						console.warn('缓存解析失败，从服务器获取新闻列表');
					}
				}
			}

			setLoading(true);
			setError(null);

			const response = await axios.get<Article[]>(`${API_BASE_URL}/news_api/articles/`);
			const data = response.data.filter(article => article.status === 'published');

			setArticles(data);
			// 使用当前的 categorySlugMap 转换
			const transformed = data
				.filter(article => article.status === 'published')
				.map(article => transformArticleToNewsItem(article, categorySlugMap));
			setNewsList(transformed);
			setLastUpdated(Date.now());

			// 保存到缓存
			const cacheData: CachedData = {
				articles: data,
				timestamp: Date.now()
			};
			localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
		} catch (err: any) {
			console.error('获取新闻列表失败:', err);
			setError('获取新闻列表失败，请稍后重试');

			// 如果请求失败，尝试使用缓存
			const cached = localStorage.getItem(CACHE_KEY);
			if (cached) {
				try {
					const cachedData: CachedData = JSON.parse(cached);
					setArticles(cachedData.articles);
					const transformed = cachedData.articles
						.filter(article => article.status === 'published')
						.map(article => transformArticleToNewsItem(article, categorySlugMap));
					setNewsList(transformed);
					setLastUpdated(cachedData.timestamp);
					console.warn('使用过期缓存数据');
				} catch (e) {
					setArticles([]);
					setNewsList([]);
				}
			} else {
				setArticles([]);
				setNewsList([]);
			}
		} finally {
			setLoading(false);
		}
	}, [categorySlugMap]); // 只依赖 categorySlugMap

	// 刷新新闻
	const refreshNews = useCallback(async () => {
		await fetchNews(false);
	}, [fetchNews]);

	// 按分类获取新闻
	const getNewsByCategory = useCallback((categorySlug: string): NewsListItem[] => {
		if (!categorySlug) return newsList;

		// 通过 category_name 或 slug 查找
		return newsList.filter(news =>
			news.category.includes(categorySlug) ||
			news.category_name.toLowerCase() === categorySlug.toLowerCase()
		);
	}, [newsList]);

	// 根据ID获取文章详情
	const getNewsById = useCallback((id: number): Article | undefined => {
		return articles.find(article => article.id === id);
	}, [articles]);

	// 搜索新闻
	const searchNews = useCallback((keyword: string): NewsListItem[] => {
		if (!keyword) return newsList;
		const lowerKeyword = keyword.toLowerCase();
		return newsList.filter(news =>
			news.title.toLowerCase().includes(lowerKeyword) ||
			news.summary.toLowerCase().includes(lowerKeyword) ||
			news.category_name.toLowerCase().includes(lowerKeyword)
		);
	}, [newsList]);

	// 获取最新新闻
	const getLatestNews = useCallback((limit: number = 10): NewsListItem[] => {
		// 从 articles 中获取发布时间进行排序
		return newsList
			.map(news => {
				const article = articles.find(a => a.id === news.id);
				return { news, publishedAt: article?.published_at || '' };
			})
			.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
			.slice(0, limit)
			.map(item => item.news);
	}, [newsList, articles]);

	// 初始化加载
	useEffect(() => {
		// 延迟执行，确保 CategoriesProvider 已经初始化
		const timer = setTimeout(() => {
			fetchNews(true);
		}, 100);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 只在挂载时执行

	// 当分类映射更新时，重新转换文章列表
	useEffect(() => {
		if (articles.length > 0) {
			const transformed = articles
				.filter(article => article.status === 'published')
				.map(article => transformArticleToNewsItem(article, categorySlugMap));
			setNewsList(transformed);
		}
	}, [categorySlugMap, articles]);

	const value: NewsContextType = {
		articles,
		newsList,
		loading,
		error,
		lastUpdated,
		refreshNews,
		getNewsByCategory,
		getNewsById,
		searchNews,
		getLatestNews
	};

	return (
		<NewsContext.Provider value={value}>
			{children}
		</NewsContext.Provider>
	);
}

// 外部 Provider，包装内部组件以访问 CategoriesContext
export function NewsProvider({ children }: { children: ReactNode }) {
	return <NewsProviderInner>{children}</NewsProviderInner>;
}

export function useNews() {
	const context = useContext(NewsContext);
	if (context === undefined) {
		throw new Error('useNews must be used within a NewsProvider');
	}
	return context;
}


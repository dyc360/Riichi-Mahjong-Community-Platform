import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { getCsrfToken } from '../utils';

const API_BASE_URL = '/api';

// 论坛板块接口
export interface ForumSection {
	id: number;
	name: string;
	title: string;
	description: string;
	icon: string;
	order: number;
	post_count: number;
}

// 论坛帖子接口（列表）
export interface ForumPost {
	id: number;
	title: string;
	author_name: string;
	author_id?: number;
	section_name: string;
	views: number;
	replies_count: number;
	likes: number;
	is_hot: boolean;
	tags: string[];
	created_at: string;
}

// 论坛回复接口
export interface ForumReply {
	id: number;
	post: number;
	parent?: number | null;
	parent_author_name?: string;
	author_name: string;
	content: string;
	likes: number;
	is_liked?: boolean;
	created_at: string;
	children?: ForumReply[]; // 嵌套回复
}

// 论坛帖子详情接口
export interface ForumPostDetail extends ForumPost {
	content: string;
	updated_at: string;
	replies: ForumReply[];
	is_liked?: boolean; // 当前用户是否已点赞
}

// 用户关注接口
export interface UserFollow {
	id: number;
	follower_name: string;
	following_name: string;
	created_at: string;
}

// 通知接口
export interface Notification {
	id: number;
	notification_type: 'new_post' | 'reply' | 'like';
	title: string;
	content: string;
	related_post: number | null;
	related_post_title?: string;
	related_reply?: number | null;
	related_reply_id?: number;
	is_read: boolean;
	created_at: string;
}

interface ForumContextType {
	// 数据
	sections: ForumSection[];
	sectionsLoading: boolean;
	sectionsError: string | null;

	// 方法
	fetchSections: (useCache?: boolean) => Promise<void>;
	fetchPosts: (params?: {
		section?: string;
		topic?: string;
		sort?: 'latest' | 'hot';
		page?: number;
		page_size?: number;
	}) => Promise<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>;
	fetchPostDetail: (postId: number) => Promise<ForumPostDetail>;
	fetchPostDetailByTitle: (title: string) => Promise<ForumPostDetail>;
	fetchLatestPosts: (page?: number, page_size?: number, useCache?: boolean) => Promise<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>;
	fetchHotPosts: (page?: number, page_size?: number, useCache?: boolean) => Promise<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>;
	createPost: (data: {
		section_id: number;
		title: string;
		content: string;
		tags: string[];
	}) => Promise<ForumPost>;
	updatePost: (postId: number, data: {
		section_id?: number;
		title?: string;
		content?: string;
		tags?: string[];
	}) => Promise<ForumPost>;
	createReply: (postId: number, content: string, parentId?: number) => Promise<ForumReply>;
	togglePostLike: (postId: number, action?: 'like' | 'unlike' | 'toggle') => Promise<{ id: number; likes: number; is_liked: boolean }>;
	toggleReplyLike: (replyId: number, action?: 'like' | 'unlike' | 'toggle') => Promise<{ id: number; likes: number; is_liked: boolean }>;
	followUser: (followingId: number) => Promise<void>;
	unfollowUser: (followingId: number) => Promise<void>;
	checkFollowStatus: (userId: number) => Promise<boolean>;
	fetchNotifications: () => Promise<Notification[]>;
	getUnreadNotificationCount: () => Promise<number>;
	markNotificationRead: (notificationId: number) => Promise<void>;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

// 缓存键名
const SECTIONS_CACHE_KEY = 'forum_sections_cache';
const HOT_POSTS_CACHE_KEY = 'forum_hot_posts_cache';
const LATEST_POSTS_CACHE_KEY = 'forum_latest_posts_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CachedData<T> {
	data: T;
	timestamp: number;
}

export function ForumProvider({ children }: { children: ReactNode }) {
	// 设置 axios 默认发送凭据
	axios.defaults.withCredentials = true;

	const { token } = useAuth();
	const [sections, setSections] = useState<ForumSection[]>([]);
	const [sectionsLoading, setSectionsLoading] = useState(false);
	const [sectionsError, setSectionsError] = useState<string | null>(null);

	// 获取认证请求头
	const getAuthHeaders = useCallback(() => {
		const headers: any = {
			'X-CSRFToken': getCsrfToken() || '',
		};
		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}
		return headers;
	}, [token]);

	// 获取板块列表（带前端缓存）
	const fetchSections = useCallback(async (useCache: boolean = true) => {
		try {
			// 尝试从缓存读取
			if (useCache) {
				const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
				if (cached) {
					try {
						const cachedData: CachedData<ForumSection[]> = JSON.parse(cached);
						const now = Date.now();
						if (now - cachedData.timestamp < CACHE_DURATION) {
							setSections(cachedData.data);
							setSectionsLoading(false);
							setSectionsError(null);
							return;
						}
					} catch (e) {
						console.warn('板块缓存解析失败，从服务器获取');
					}
				}
			}

			setSectionsLoading(true);
			setSectionsError(null);
			const response = await axios.get<ForumSection[] | { results: ForumSection[] }>(`${API_BASE_URL}/forum/sections/`);
			const data: ForumSection[] = Array.isArray(response.data) 
				? response.data 
				: (response.data.results || []);
			setSections(data);

			// 保存到缓存
			const cacheData: CachedData<ForumSection[]> = {
				data,
				timestamp: Date.now()
			};
			localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData));
		} catch (err: any) {
			console.error('获取板块列表失败:', err);
			setSectionsError('获取板块列表失败，请稍后重试');
			
			// 如果请求失败，尝试使用过期缓存
			const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
			if (cached) {
				try {
					const cachedData: CachedData<ForumSection[]> = JSON.parse(cached);
					setSections(cachedData.data);
					console.warn('使用过期板块缓存数据');
				} catch (e) {
					setSections([]);
				}
			} else {
				setSections([]);
			}
			throw err;
		} finally {
			setSectionsLoading(false);
		}
	}, []);

	// 获取帖子列表（支持分页）
	const fetchPosts = useCallback(async (params?: {
		section?: string;
		topic?: string;
		sort?: 'latest' | 'hot';
		page?: number;
		page_size?: number;
	}) => {
		try {
			const queryParams = new URLSearchParams();
			if (params?.section) queryParams.append('section', params.section);
			if (params?.topic) queryParams.append('topic', params.topic);
			if (params?.sort) queryParams.append('sort', params.sort);
			if (params?.page) queryParams.append('page', params.page.toString());
			if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

			const queryString = queryParams.toString();
			const url = `${API_BASE_URL}/forum/posts/${queryString ? `?${queryString}` : ''}`;
			const response = await axios.get<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>(url);
			return response.data;
		} catch (err: any) {
			console.error('获取帖子列表失败:', err);
			throw err;
		}
	}, []);

	// 获取帖子详情（按ID）
	const fetchPostDetail = useCallback(async (postId: number) => {
		try {
			const response = await axios.get<ForumPostDetail>(
				`${API_BASE_URL}/forum/posts/${postId}/`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('获取帖子详情失败:', err);
			throw err;
		}
	}, [getAuthHeaders]);

	// 获取帖子详情（按标题）
	const fetchPostDetailByTitle = useCallback(async (title: string) => {
		try {
			const encodedTitle = encodeURIComponent(title);
			const response = await axios.get<ForumPostDetail>(
				`${API_BASE_URL}/forum/posts/by-title/${encodedTitle}/`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('获取帖子详情失败:', err);
			throw err;
		}
	}, [getAuthHeaders]);

	// 获取最新帖子（支持分页和缓存）
	const fetchLatestPosts = useCallback(async (page?: number, page_size?: number, useCache: boolean = true) => {
		// 只有首页（page=1, page_size<=10）才使用缓存
		const shouldCache = (!page || page === 1) && (!page_size || page_size <= 10);
		const cacheKey = `${LATEST_POSTS_CACHE_KEY}_${page || 1}_${page_size || 10}`;

		// 尝试从缓存读取
		if (shouldCache && useCache) {
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				try {
					const cachedData: CachedData<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }> = JSON.parse(cached);
					const now = Date.now();
					if (now - cachedData.timestamp < CACHE_DURATION) {
						return cachedData.data;
					}
				} catch (e) {
					console.warn('最新帖子缓存解析失败，从服务器获取');
				}
			}
		}

		try {
			const queryParams = new URLSearchParams();
			if (page) queryParams.append('page', page.toString());
			if (page_size) queryParams.append('page_size', page_size.toString());
			
			const queryString = queryParams.toString();
			const url = `${API_BASE_URL}/forum/posts/latest/${queryString ? `?${queryString}` : ''}`;
			const response = await axios.get<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>(url);
			const data = response.data;

			// 保存到缓存（仅首页）
			if (shouldCache) {
				const cacheData: CachedData<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }> = {
					data,
					timestamp: Date.now()
				};
				localStorage.setItem(cacheKey, JSON.stringify(cacheData));
			}

			return data;
		} catch (err: any) {
			console.error('获取最新帖子失败:', err);
			throw err;
		}
	}, []);

	// 获取热门帖子（支持分页和缓存）
	const fetchHotPosts = useCallback(async (page?: number, page_size?: number, useCache: boolean = true) => {
		// 只有首页（page=1, page_size<=10）才使用缓存
		const shouldCache = (!page || page === 1) && (!page_size || page_size <= 10);
		const cacheKey = `${HOT_POSTS_CACHE_KEY}_${page || 1}_${page_size || 10}`;

		// 尝试从缓存读取
		if (shouldCache && useCache) {
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				try {
					const cachedData: CachedData<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }> = JSON.parse(cached);
					const now = Date.now();
					if (now - cachedData.timestamp < CACHE_DURATION) {
						return cachedData.data;
					}
				} catch (e) {
					console.warn('热门帖子缓存解析失败，从服务器获取');
				}
			}
		}

		try {
			const queryParams = new URLSearchParams();
			if (page) queryParams.append('page', page.toString());
			if (page_size) queryParams.append('page_size', page_size.toString());
			
			const queryString = queryParams.toString();
			const url = `${API_BASE_URL}/forum/posts/hot/${queryString ? `?${queryString}` : ''}`;
			const response = await axios.get<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }>(url);
			const data = response.data;

			// 保存到缓存（仅首页）
			if (shouldCache) {
				const cacheData: CachedData<{ results: ForumPost[]; count: number; next: string | null; previous: string | null }> = {
					data,
					timestamp: Date.now()
				};
				localStorage.setItem(cacheKey, JSON.stringify(cacheData));
			}

			return data;
		} catch (err: any) {
			console.error('获取热门帖子失败:', err);
			throw err;
		}
	}, []);

	// 创建帖子
	const createPost = useCallback(async (data: {
		section_id: number;
		title: string;
		content: string;
		tags: string[];
	}) => {
		try {
			const response = await axios.post<ForumPost>(
				`${API_BASE_URL}/forum/posts/create/`,
				data,
				{
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('创建帖子失败:', err);
			if (err.response?.status === 401) {
				throw new Error('请先登录');
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 更新帖子
	const updatePost = useCallback(async (postId: number, data: {
		section_id?: number;
		title?: string;
		content?: string;
		tags?: string[];
	}) => {
		try {
			const response = await axios.put<ForumPost>(
				`${API_BASE_URL}/forum/posts/${postId}/update/`,
				data,
				{
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('更新帖子失败:', err);
			if (err.response?.status === 401) {
				throw new Error('请先登录');
			}
			if (err.response?.status === 403) {
				throw new Error('您没有权限编辑此帖子');
			}
			if (err.response?.status === 404) {
				throw new Error('帖子不存在');
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 创建回复
	const createReply = useCallback(async (postId: number, content: string, parentId?: number) => {
		try {
			const data: { content: string; parent_id?: number } = { content };
			if (parentId) {
				data.parent_id = parentId;
			}
			const response = await axios.post<ForumReply>(
				`${API_BASE_URL}/forum/posts/${postId}/replies/`,
				data,
				{
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('创建回复失败:', err);
			if (err.response?.status === 401) {
				throw new Error('请先登录');
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 点赞/取消点赞
	const togglePostLike = useCallback(async (postId: number, action: 'like' | 'unlike' | 'toggle' = 'toggle') => {
		try {
			const authHeaders = getAuthHeaders();
			if (!authHeaders.Authorization) {
				throw new Error('请先登录');
			}
			
			const response = await axios.post<{ id: number; likes: number; is_liked: boolean }>(
				`${API_BASE_URL}/forum/posts/${postId}/like/`,
				{ action },
				{
					headers: {
						'Content-Type': 'application/json',
						...authHeaders,
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('点赞失败:', err);
			if (err.response?.status === 401 || err.response?.status === 403) {
				const errorMsg = err.response?.data?.detail || '请先登录';
				throw new Error(errorMsg);
			}
			if (err.response?.data?.detail) {
				throw new Error(err.response.data.detail);
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 回复点赞/取消点赞
	const toggleReplyLike = useCallback(async (replyId: number, action: 'like' | 'unlike' | 'toggle' = 'toggle') => {
		try {
			const authHeaders = getAuthHeaders();
			if (!authHeaders.Authorization) {
				throw new Error('请先登录');
			}
			
			const response = await axios.post<{ id: number; likes: number; is_liked: boolean }>(
				`${API_BASE_URL}/forum/replies/${replyId}/like/`,
				{ action },
				{
					headers: {
						'Content-Type': 'application/json',
						...authHeaders,
					},
				}
			);
			return response.data;
		} catch (err: any) {
			console.error('回复点赞失败:', err);
			if (err.response?.status === 401 || err.response?.status === 403) {
				const errorMsg = err.response?.data?.detail || '请先登录';
				throw new Error(errorMsg);
			}
			if (err.response?.data?.detail) {
				throw new Error(err.response.data.detail);
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 关注用户
	const followUser = useCallback(async (followingId: number) => {
		try {
			await axios.post(
				`${API_BASE_URL}/forum/follow/`,
				{ following_id: followingId },
				{
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
		} catch (err: any) {
			console.error('关注失败:', err);
			if (err.response?.status === 401) {
				throw new Error('请先登录');
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 取消关注用户
	const unfollowUser = useCallback(async (followingId: number) => {
		try {
			await axios.delete(
				`${API_BASE_URL}/forum/follow/`,
				{
					data: { following_id: followingId },
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
		} catch (err: any) {
			console.error('取消关注失败:', err);
			if (err.response?.status === 401) {
				throw new Error('请先登录');
			}
			throw err;
		}
	}, [getAuthHeaders]);

	// 检查关注状态
	const checkFollowStatus = useCallback(async (userId: number) => {
		try {
			const response = await axios.get<{ is_following: boolean }>(
				`${API_BASE_URL}/forum/follow/check/${userId}/`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);
			return response.data.is_following;
		} catch (err: any) {
			console.error('检查关注状态失败:', err);
			return false;
		}
	}, [getAuthHeaders]);

	// 获取通知列表
	const fetchNotifications = useCallback(async () => {
		try {
			const response = await axios.get<Notification[] | { results: Notification[]; count: number; next: string | null; previous: string | null }>(
				`${API_BASE_URL}/forum/notifications/`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);
			// 处理分页格式：如果返回的是分页对象，提取results字段；否则直接返回数组
			const data = response.data;
			if (Array.isArray(data)) {
				return data;
			} else if (data && typeof data === 'object' && 'results' in data) {
				return data.results;
			}
			return [];
		} catch (err: any) {
			console.error('获取通知失败:', err);
			throw err;
		}
	}, [getAuthHeaders]);

	// 获取未读通知数量
	const getUnreadNotificationCount = useCallback(async () => {
		try {
			const response = await axios.get<{ count: number }>(
				`${API_BASE_URL}/forum/notifications/count/`,
				{
					headers: {
						...getAuthHeaders(),
					},
				}
			);
			return response.data.count;
		} catch (err: any) {
			console.error('获取未读通知数量失败:', err);
			return 0;
		}
	}, [getAuthHeaders]);

	// 标记通知为已读
	const markNotificationRead = useCallback(async (notificationId: number) => {
		try {
			await axios.post(
				`${API_BASE_URL}/forum/notifications/${notificationId}/read/`,
				{},
				{
					headers: {
						'Content-Type': 'application/json',
						...getAuthHeaders(),
					},
				}
			);
		} catch (err: any) {
			console.error('标记通知已读失败:', err);
			throw err;
		}
	}, [getAuthHeaders]);

	const value: ForumContextType = {
		sections,
		sectionsLoading,
		sectionsError,
		fetchSections,
		fetchPosts,
		fetchPostDetail,
		fetchPostDetailByTitle,
		fetchLatestPosts,
		fetchHotPosts,
		createPost,
		updatePost,
		createReply,
		togglePostLike,
		toggleReplyLike,
		followUser,
		unfollowUser,
		checkFollowStatus,
		fetchNotifications,
		getUnreadNotificationCount,
		markNotificationRead,
	};

	return (
		<ForumContext.Provider value={value}>
			{children}
		</ForumContext.Provider>
	);
}

export function useForum() {
	const context = useContext(ForumContext);
	if (context === undefined) {
		throw new Error('useForum must be used within a ForumProvider');
	}
	return context;
}

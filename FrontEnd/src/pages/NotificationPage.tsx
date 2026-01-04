import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useAuth } from '../contexts/AuthContext';
import { useForum, type Notification } from '../contexts/ForumContext';

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

export default function NotificationPage() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { fetchNotifications, markNotificationRead } = useForum();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!user) {
			navigate('/login?redirect=/notifications', { replace: true });
			return;
		}

		loadNotifications();
		// 每30秒刷新一次
		const interval = setInterval(loadNotifications, 30000);
		return () => clearInterval(interval);
	}, [user, navigate]);

	const loadNotifications = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchNotifications();
			setNotifications(data);
		} catch (err: any) {
			console.error('加载通知失败:', err);
			setError('加载通知失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	const handleMarkRead = async (notification: Notification) => {
		if (notification.is_read) return;
		
		try {
			await markNotificationRead(notification.id);
			setNotifications(prev =>
				prev.map(n =>
					n.id === notification.id ? { ...n, is_read: true } : n
				)
			);
		} catch (error) {
			console.error('标记已读失败:', error);
		}
	};

	const handleGoBack = () => {
		navigate(-1);
	};

	if (!user) {
		return null;
	}

	const unreadCount = notifications.filter(n => !n.is_read).length;

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
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-3xl font-bold text-slate-900 dark:text-white">我的通知</h1>
					{unreadCount > 0 && (
						<span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
							{unreadCount} 条未读
						</span>
					)}
				</div>

				{loading ? (
					<div className="text-center py-12">
						<div className="inline-block w-12 h-12 border-4 border-indigo-200 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4"></div>
						<p className="text-slate-600 dark:text-slate-400">加载通知中...</p>
					</div>
				) : error ? (
					<div className="text-center py-12">
						<p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
						<button
							onClick={loadNotifications}
							className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
						>
							重试
						</button>
					</div>
				) : notifications.length === 0 ? (
					<ModuleContainer>
						<div className="text-center py-12 text-slate-500 dark:text-slate-400">
							<svg className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
							</svg>
							<p className="text-lg mb-2">暂无通知</p>
							<p className="text-sm">当您关注的作者发布新帖或有人回复您的帖子时，会在这里收到通知</p>
						</div>
					</ModuleContainer>
				) : (
					<div className="space-y-3">
						{notifications.map(notification => (
							<div
								key={notification.id}
								className={`p-4 rounded-lg border transition-all cursor-pointer ${
									notification.is_read
										? 'bg-slate-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
										: 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 shadow-sm hover:shadow-md'
								}`}
								onClick={() => {
									handleMarkRead(notification);
									if (notification.related_post_title) {
										if (notification.notification_type === 'reply' && notification.related_reply_id) {
											navigate(`/forum/post/${encodeURIComponent(notification.related_post_title)}`, {
												state: { replyId: notification.related_reply_id }
											});
										} else {
											navigate(`/forum/post/${encodeURIComponent(notification.related_post_title)}`);
										}
									} else if (notification.related_post) {
										navigate('/forum');
									}
								}}
							>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-1">
											<h3 className={`font-medium ${
												notification.is_read
													? 'text-slate-700 dark:text-slate-300'
													: 'text-slate-900 dark:text-white'
											}`}>
												{notification.title}
											</h3>
											{!notification.is_read && (
												<span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0"></span>
											)}
										</div>
										<p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
											{notification.content}
										</p>
										{notification.related_post_title && (
											<Link
												to={`/forum/post/${encodeURIComponent(notification.related_post_title)}`}
												state={notification.notification_type === 'reply' && notification.related_reply_id
													? { replyId: notification.related_reply_id }
													: undefined}
												onClick={(e) => e.stopPropagation()}
												className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-1"
											>
												{notification.notification_type === 'reply' ? '查看回复' : '查看帖子'}
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
												</svg>
											</Link>
										)}
										<div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
											{formatRelativeTime(notification.created_at)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</main>
		</>
	);
}

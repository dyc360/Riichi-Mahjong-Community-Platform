import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useAuth } from '../contexts/AuthContext';
import { useForum, type ForumPostDetail, type ForumReply } from '../contexts/ForumContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import MarkdownToolbar from '../components/MarkdownToolbar';

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

// 回复项组件
interface ReplyItemProps {
	reply: ForumReply;
	user: any;
	onLike: (replyId: number, isLiked: boolean) => void;
	onReply: (parentId: number) => void;
	replyingTo: number | null;
	nestedReplyContent: { [key: number]: string };
	onNestedReplyContentChange: (parentId: number, content: string) => void;
	onNestedReplySubmit: (parentId: number) => void;
	onCancelReply: () => void;
	nestedReplyEditorMode?: { [key: number]: 'edit' | 'preview' };
	setNestedReplyEditorMode?: (parentId: number, mode: 'edit' | 'preview') => void;
	nestedReplyTextareaRefs?: React.MutableRefObject<{ [key: number]: HTMLTextAreaElement | null }>;
	nestedReplyImageInputRefs?: React.MutableRefObject<{ [key: number]: HTMLInputElement | null }>;
	fetchPosts?: (params?: { sort?: string; page?: number }) => Promise<any[]>;
}

const ReplyItem = ({ reply, user, onLike, onReply, replyingTo, nestedReplyContent, onNestedReplyContentChange, onNestedReplySubmit, onCancelReply, nestedReplyEditorMode, setNestedReplyEditorMode, nestedReplyTextareaRefs, nestedReplyImageInputRefs, fetchPosts }: ReplyItemProps) => {
	const isLiked = reply.is_liked ?? false;
	const isReplying = replyingTo === reply.id;
	const nestedContent = nestedReplyContent[reply.id] || "";
	const editorMode = (nestedReplyEditorMode && nestedReplyEditorMode[reply.id]) || 'edit';

	return (
		<div id={`reply-${reply.id}`} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 scroll-mt-20">
			<div className="flex items-start gap-3">
				<img src={getAvatarUrl(reply.author_name)} alt={reply.author_name} className="w-8 h-8 rounded-full flex-shrink-0" />
				<div className="flex-1">
					<div className="flex items-center justify-between mb-1">
						<div className="flex items-center gap-2">
							<span className="font-medium text-slate-900 dark:text-white">{reply.author_name}</span>
							{reply.parent_author_name && (
								<span className="text-xs text-slate-500 dark:text-slate-400">
									回复 <span className="text-indigo-600 dark:text-indigo-400">@{reply.parent_author_name}</span>
								</span>
							)}
						</div>
						<span className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(reply.created_at)}</span>
					</div>
					<div className="prose prose-sm dark:prose-invert max-w-none mb-2 text-slate-700 dark:text-slate-300
						prose-headings:text-slate-900 dark:prose-headings:text-white
						prose-p:text-slate-700 dark:prose-p:text-slate-300
						prose-strong:text-slate-900 dark:prose-strong:text-white
						prose-a:text-indigo-600 dark:prose-a:text-indigo-400
						prose-code:text-slate-800 dark:prose-code:text-slate-200
						prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
						prose-img:max-w-full prose-img:h-auto prose-img:my-4">
						{(() => {
							// 分割内容：将 HTML img 标签和 Markdown 内容分开处理
							const hasImgTag = reply.content.includes('<img');
							if (hasImgTag) {
								const parts: React.ReactNode[] = [];
								let lastIndex = 0;
								// 使用更精确的正则表达式匹配 img 标签（包括自闭合标签）
								const imgRegex = /<img[^>]*\/?>/g;
								let match;
								
								while ((match = imgRegex.exec(reply.content)) !== null) {
									// 添加 img 标签之前的 Markdown 内容
									if (match.index > lastIndex) {
										const markdownPart = reply.content.substring(lastIndex, match.index);
										if (markdownPart.trim()) {
											parts.push(
												<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
													{markdownPart}
												</ReactMarkdown>
											);
										}
									}
									// 添加 img 标签（使用 dangerouslySetInnerHTML）
									parts.push(
										<span key={`img-${match.index}`} dangerouslySetInnerHTML={{ __html: match[0] }} />
									);
									lastIndex = match.index + match[0].length;
								}
								// 添加最后剩余的 Markdown 内容
								if (lastIndex < reply.content.length) {
									const markdownPart = reply.content.substring(lastIndex);
									if (markdownPart.trim()) {
										parts.push(
											<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
												{markdownPart}
											</ReactMarkdown>
										);
									}
								}
								return <>{parts}</>;
							}
							return (
								<ReactMarkdown 
									rehypePlugins={[rehypeRaw]}
								>
									{reply.content}
								</ReactMarkdown>
							);
						})()}
					</div>
					<div className="flex items-center gap-4">
						<button
							onClick={() => onLike(reply.id, isLiked)}
							className={`flex items-center gap-1 text-xs transition-colors ${isLiked
								? 'text-red-600 dark:text-red-400'
								: 'text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
								}`}
						>
							<svg className="w-3.5 h-3.5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
							<span>{reply.likes}</span>
						</button>
						{user && (
							<button
								onClick={() => onReply(reply.id)}
								className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
							>
								回复
							</button>
						)}
					</div>

					{/* 嵌套回复输入框 */}
					{isReplying && user && (
						<div className="mt-3 ml-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-700">
							{/* 编辑器区域 */}
							<div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
								{/* 格式化工具栏 */}
								{editorMode === 'edit' && nestedReplyTextareaRefs && nestedReplyImageInputRefs && (
									<MarkdownToolbar
										content={nestedContent}
										setContent={(content) => onNestedReplyContentChange(reply.id, content)}
										textareaRef={nestedReplyTextareaRefs.current[reply.id] ? { current: nestedReplyTextareaRefs.current[reply.id] } as React.RefObject<HTMLTextAreaElement | null> : { current: null }}
										imageInputRef={nestedReplyImageInputRefs.current[reply.id] ? { current: nestedReplyImageInputRefs.current[reply.id] } as React.RefObject<HTMLInputElement | null> : undefined}
										fetchPosts={fetchPosts as any}
										compact={true}
									/>
								)}
								{editorMode === 'preview' && setNestedReplyEditorMode && (
									<div className="flex items-center justify-end p-1.5 bg-slate-50 dark:bg-slate-900 border-b border-gray-300 dark:border-slate-600">
										<button
											type="button"
											onClick={() => setNestedReplyEditorMode(reply.id, 'edit')}
											title="编辑"
											className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs"
										>
											编辑
										</button>
									</div>
								)}

								{/* 编辑器内容区域 */}
								<div className="border-t-0">
									{editorMode === 'edit' ? (
										<textarea
											id={`nested-reply-${reply.id}`}
											name={`nested-reply-${reply.id}`}
											ref={(el) => {
												if (el && nestedReplyTextareaRefs) nestedReplyTextareaRefs.current[reply.id] = el;
											}}
											value={nestedContent}
											onChange={(e) => onNestedReplyContentChange(reply.id, e.target.value)}
											placeholder={`回复 @${reply.author_name}...`}
											className="w-full p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[200px] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
										/>
									) : (
										<div className="min-h-[200px] p-2 bg-white dark:bg-slate-800 overflow-y-auto">
											{nestedContent.trim() ? (
												<div className="prose prose-xs dark:prose-invert max-w-none
													prose-headings:text-slate-900 dark:prose-headings:text-white
													prose-p:text-slate-700 dark:prose-p:text-slate-300
													prose-strong:text-slate-900 dark:prose-strong:text-white
													prose-a:text-indigo-600 dark:prose-a:text-indigo-400
													prose-code:text-slate-800 dark:prose-code:text-slate-200
													prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
													prose-img:max-w-full prose-img:h-auto prose-img:my-2">
													{(() => {
														// 分割内容：将 HTML img 标签和 Markdown 内容分开处理
														const hasImgTag = nestedContent.includes('<img');
														if (hasImgTag) {
															const parts: React.ReactNode[] = [];
															let lastIndex = 0;
															// 使用更精确的正则表达式匹配 img 标签（包括自闭合标签）
															const imgRegex = /<img[^>]*\/?>/g;
															let match;
															
															while ((match = imgRegex.exec(nestedContent)) !== null) {
																// 添加 img 标签之前的 Markdown 内容
																if (match.index > lastIndex) {
																	const markdownPart = nestedContent.substring(lastIndex, match.index);
																	if (markdownPart.trim()) {
																		parts.push(
																			<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
																				{markdownPart}
																			</ReactMarkdown>
																		);
																	}
																}
																// 添加 img 标签（使用 dangerouslySetInnerHTML）
																parts.push(
																	<span key={`img-${match.index}`} dangerouslySetInnerHTML={{ __html: match[0] }} />
																);
																lastIndex = match.index + match[0].length;
															}
															// 添加最后剩余的 Markdown 内容
															if (lastIndex < nestedContent.length) {
																const markdownPart = nestedContent.substring(lastIndex);
																if (markdownPart.trim()) {
																	parts.push(
																		<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
																			{markdownPart}
																		</ReactMarkdown>
																	);
																}
															}
															return <>{parts}</>;
														}
														return (
															<ReactMarkdown 
																rehypePlugins={[rehypeRaw]}
															>
																{nestedContent}
															</ReactMarkdown>
														);
													})()}
												</div>
											) : (
												<p className="text-slate-400 dark:text-slate-500 text-xs">预览将显示在这里...</p>
											)}
										</div>
									)}
								</div>
							</div>

							<div className="mt-2 flex items-center justify-between">
								<p className="text-xs text-slate-500 dark:text-slate-400">
									支持 Markdown 和 HTML
								</p>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={onCancelReply}
										className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
									>
										取消
									</button>
									<button
										type="button"
										onClick={() => onNestedReplySubmit(reply.id)}
										disabled={!nestedContent.trim()}
										className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
									>
										回复
									</button>
								</div>
							</div>
						</div>
					)}

					{/* 嵌套回复列表 */}
					{reply.children && reply.children.length > 0 && (
						<div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-slate-700 space-y-3">
							{reply.children.map(child => (
								<ReplyItem
									key={child.id}
									reply={child}
									user={user}
									onLike={onLike}
									onReply={onReply}
									replyingTo={replyingTo}
									nestedReplyContent={nestedReplyContent}
									onNestedReplyContentChange={onNestedReplyContentChange}
									onNestedReplySubmit={onNestedReplySubmit}
									onCancelReply={onCancelReply}
									nestedReplyEditorMode={nestedReplyEditorMode}
									setNestedReplyEditorMode={setNestedReplyEditorMode}
									nestedReplyTextareaRefs={nestedReplyTextareaRefs}
									nestedReplyImageInputRefs={nestedReplyImageInputRefs}
									fetchPosts={fetchPosts}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default function ForumPostDetailPage() {
	const { user, isLoading: authLoading } = useAuth();
	const { title } = useParams<{ title: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const { fetchPostDetailByTitle, createReply, togglePostLike, toggleReplyLike, fetchPosts, followUser, unfollowUser, checkFollowStatus } = useForum();

	const [post, setPost] = useState<ForumPostDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [replyContent, setReplyContent] = useState("");
	const [isLiked, setIsLiked] = useState(false);
	const [isSubmittingReply, setIsSubmittingReply] = useState(false);
	const [isFollowingAuthor, setIsFollowingAuthor] = useState(false); // 是否关注作者
	const [replyingTo, setReplyingTo] = useState<number | null>(null); // 回复ID
	const [nestedReplyContent, setNestedReplyContent] = useState<{ [key: number]: string }>({}); // 嵌套回复内容
	const hasLoadedRef = useRef<string | null>(null); // 记录已加载的标题，防止重复请求
	const scrollToReplyIdRef = useRef<number | null>(null); // 保存需要滚动到的回复ID
	const [replyEditorMode, setReplyEditorMode] = useState<'edit' | 'preview'>('edit'); // 回复编辑器模式
	const [nestedReplyEditorMode, setNestedReplyEditorMode] = useState<{ [key: number]: 'edit' | 'preview' }>({}); // 嵌套回复编辑器模式
	const replyTextareaRef = useRef<HTMLTextAreaElement>(null); // 回复输入框引用
	const nestedReplyTextareaRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({}); // 嵌套回复输入框引用
	const replyImageInputRef = useRef<HTMLInputElement>(null); // 回复图片文件选择
	const nestedReplyImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({}); // 嵌套回复图片文件选择

	// 加载帖子详情
	useEffect(() => {
		if (authLoading) {
			return;
		}

		if (!title) {
			setError("帖子标题无效");
			setLoading(false);
			return;
		}

		const decodedTitle = decodeURIComponent(title);
		
		if (hasLoadedRef.current === decodedTitle) {
			return;
		}

		hasLoadedRef.current = decodedTitle;

		const loadPost = async () => {
			try {
				setLoading(true);
				setError(null);
				const postData = await fetchPostDetailByTitle(decodedTitle);
				setPost(postData);
				setIsLiked(postData.is_liked ?? false);
				
				// 检查关注状态
				if (user && postData.author_id && user.username !== postData.author_name) {
					const isFollowing = await checkFollowStatus(postData.author_id);
					setIsFollowingAuthor(isFollowing);
				}
			} catch (err: any) {
				console.error("加载帖子失败:", err);
				setError(err?.message || "加载帖子失败，请稍后重试");
			} finally {
				setLoading(false);
			}
		};

		loadPost();
	}, [title, fetchPostDetailByTitle, authLoading]);

	// 检查 location.state 中的 replyId 并保存到 ref
	useEffect(() => {
		const replyId = (location.state as any)?.replyId;
		if (replyId && typeof replyId === 'number') {
			console.log('检测到需要滚动到的回复ID:', replyId);
			scrollToReplyIdRef.current = replyId;
			// 立即清除 state，避免重复触发
			navigate(location.pathname, { replace: true, state: {} });
		}
	}, [location, navigate]);

	// 处理滚动到指定回复
	useEffect(() => {
		if (!post || loading) return;
		
		const replyId = scrollToReplyIdRef.current;
		if (!replyId) return;

		console.log('开始滚动到回复:', replyId, '当前回复数量:', post.replies.length);
		console.log('所有回复ID:', post.replies.map(r => r.id));

		// 使用递归函数等待元素出现
		const scrollToReply = (attempts = 0) => {
			const elementId = `reply-${replyId}`;
			const element = document.getElementById(elementId);
			
			console.log(`尝试 ${attempts + 1}: 查找元素 ${elementId}`, element ? '找到' : '未找到');
			
			if (element) {
				console.log('找到回复元素，开始滚动', element);
				// 元素已找到，执行滚动
				// 等待一小段时间确保页面布局稳定
				setTimeout(() => {
					// 计算元素位置
					const rect = element.getBoundingClientRect();
					const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
					const targetY = rect.top + scrollTop - 100; // 减去100px留出顶部空间
					
					console.log('滚动参数:', { rect, scrollTop, targetY });
					
					// 平滑滚动
					window.scrollTo({
						top: targetY,
						behavior: 'smooth'
					});
					
					// 高亮显示回复
					element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'transition-all', 'duration-300');
					setTimeout(() => {
						element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
					}, 2000);
					
					// 清除 ref 中的 replyId
					scrollToReplyIdRef.current = null;
				}, 300);
			} else if (attempts < 50) {
				// 元素未找到，继续尝试（最多50次，约5秒）
				if (attempts % 10 === 0) {
					console.log(`等待回复元素出现... (尝试 ${attempts + 1}/50)`);
					// 列出所有现有的回复元素ID
					const allReplyElements = document.querySelectorAll('[id^="reply-"]');
					console.log('当前页面中的回复元素:', Array.from(allReplyElements).map(el => el.id));
				}
				setTimeout(() => scrollToReply(attempts + 1), 100);
			} else {
				// 超时，清除 ref
				console.warn(`无法找到回复元素: reply-${replyId}，已尝试50次`);
				const allReplyElements = document.querySelectorAll('[id^="reply-"]');
				console.warn('页面中存在的回复元素:', Array.from(allReplyElements).map(el => el.id));
				scrollToReplyIdRef.current = null;
			}
		};

		// 开始尝试滚动
		scrollToReply();
	}, [post, loading, navigate]);

	// 处理点赞
	const handleLike = async () => {
		if (!post || !user) {
			alert("请先登录");
			return;
		}

		try {
			const result = await togglePostLike(post.id, isLiked ? 'unlike' : 'like');
			setPost(prev => prev ? { ...prev, likes: result.likes, is_liked: result.is_liked } : null);
			setIsLiked(result.is_liked);
		} catch (err: any) {
			console.error("点赞失败:", err);
			const errorMessage = err?.response?.data?.detail || err?.message || "操作失败，请稍后重试";
			alert(errorMessage);
		}
	};

	// 顶级回复
	const handleReplySubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyContent.trim() || !user || !post) return;

		setIsSubmittingReply(true);
		try {
			await createReply(post.id, replyContent);
			// 重新加载帖子详情以获取最新回复
			const updatedPost = await fetchPostDetailByTitle(post.title);
			setPost(updatedPost);
			setReplyContent("");
		} catch (err: any) {
			console.error("提交回复失败:", err);
			alert(err?.message || "发布回复失败，请稍后重试");
		} finally {
			setIsSubmittingReply(false);
		}
	};

	// 提交嵌套回复
	const handleNestedReplySubmit = async (parentId: number) => {
		const content = nestedReplyContent[parentId];
		if (!content?.trim() || !user || !post) return;

		try {
			await createReply(post.id, content, parentId);
			// 重新加载帖子详情
			const updatedPost = await fetchPostDetailByTitle(post.title);
			setPost(updatedPost);
			// 清除该回复的输入内容
			setNestedReplyContent(prev => {
				const newState = { ...prev };
				delete newState[parentId];
				return newState;
			});
			setReplyingTo(null);
		} catch (err: any) {
			console.error("提交嵌套回复失败:", err);
			alert(err?.message || "发布回复失败，请稍后重试");
		}
	};

	// 处理回复点赞
	const handleReplyLike = async (replyId: number, isLiked: boolean) => {
		if (!user) {
			alert("请先登录");
			return;
		}

		try {
			const result = await toggleReplyLike(replyId, isLiked ? 'unlike' : 'like');
			// 更新帖子数据中的回复点赞状态
			setPost(prev => {
				if (!prev) return null;
				const updateReply = (replies: ForumReply[]): ForumReply[] => {
					return replies.map(reply => {
						if (reply.id === replyId) {
							return { ...reply, likes: result.likes, is_liked: result.is_liked };
						}
						if (reply.children) {
							return { ...reply, children: updateReply(reply.children) };
						}
						return reply;
					});
				};
				return { ...prev, replies: updateReply(prev.replies) };
			});
		} catch (err: any) {
			console.error("回复点赞失败:", err);
			alert(err?.message || "操作失败，请稍后重试");
		}
	};


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
							<p className="text-slate-600 dark:text-slate-400">加载帖子中...</p>
						</div>
					</div>
				</main>
			</>
		);
	}

	if (error || !post) {
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
						<p className="text-red-600 dark:text-red-400 mb-4">{error || "帖子不存在或已被删除"}</p>
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
					{/* 帖子内容区 */}
					<div className="lg:col-span-2 space-y-6">
						{/* 帖子主体 */}
						<ModuleContainer title="">
							<div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
								<h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{post.title}</h1>

								{/* 作者信息 */}
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-3">
										<img src={getAvatarUrl(post.author_name)} alt={post.author_name} className="w-10 h-10 rounded-full" />
										<div>
											<p className="font-medium text-slate-900 dark:text-white">{post.author_name}</p>
											<p className="text-sm text-slate-500 dark:text-slate-400">
												{formatRelativeTime(post.created_at)} · 阅读 {post.views}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={handleLike}
											className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${isLiked
												? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
												: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
												}`}
										>
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
											</svg>
											<span>{post.likes}</span>
										</button>

										{user && user.username === post.author_name && (
											<Link
												to={`/forum/edit-post/${post.title}`}
												className="px-3 py-1.5 rounded-full text-sm bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
											>
												编辑
											</Link>
										)}
									</div>
								</div>

								{/* 标签 */}
								<div className="flex flex-wrap gap-2 mb-6">
									{post.tags.map((tag, index) => (
										<Link
											key={index}
											to={`/forum/topic/${tag}`}
											className="px-3 py-1 text-sm rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
										>
											<span className="inline mr-1">#</span>
											{tag}
										</Link>
									))}
								</div>

								{/* 帖子内容 */}
								<div className="prose prose-lg dark:prose-invert max-w-none mb-6
									prose-headings:text-slate-900 dark:prose-headings:text-white
									prose-p:text-slate-700 dark:prose-p:text-slate-300
									prose-strong:text-slate-900 dark:prose-strong:text-white
									prose-a:text-indigo-600 dark:prose-a:text-indigo-400
									prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
									prose-li:text-slate-700 dark:prose-li:text-slate-300
									prose-code:text-slate-800 dark:prose-code:text-slate-200
									prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
									prose-img:max-w-full prose-img:h-auto prose-img:my-4">
									{(() => {
										// 分割内容：将 HTML img 标签和 Markdown 内容分开处理
										const hasImgTag = post.content.includes('<img');
										if (hasImgTag) {
											const parts: React.ReactNode[] = [];
											let lastIndex = 0;
											// 使用更精确的正则表达式匹配 img 标签（包括自闭合标签）
											const imgRegex = /<img[^>]*\/?>/g;
											let match;
											
											while ((match = imgRegex.exec(post.content)) !== null) {
												// 添加 img 标签之前的 Markdown 内容
												if (match.index > lastIndex) {
													const markdownPart = post.content.substring(lastIndex, match.index);
													if (markdownPart.trim()) {
														parts.push(
															<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
																{markdownPart}
															</ReactMarkdown>
														);
													}
												}
												// 添加 img 标签（使用 dangerouslySetInnerHTML）
												parts.push(
													<span key={`img-${match.index}`} dangerouslySetInnerHTML={{ __html: match[0] }} />
												);
												lastIndex = match.index + match[0].length;
											}
											// 添加最后剩余的 Markdown 内容
											if (lastIndex < post.content.length) {
												const markdownPart = post.content.substring(lastIndex);
												if (markdownPart.trim()) {
													parts.push(
														<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
															{markdownPart}
														</ReactMarkdown>
													);
												}
											}
											return <>{parts}</>;
										}
										return (
											<ReactMarkdown 
												rehypePlugins={[rehypeRaw]}
											>
												{post.content}
											</ReactMarkdown>
										);
									})()}
								</div>
							</div>
						</ModuleContainer>

						{/* 回复区 */}
						<ModuleContainer title="回复" description={`共 ${post.replies.length} 条回复`}>
							{/* 回复表单 */}
							{user ? (
								<form onSubmit={handleReplySubmit} className="mb-6">
									{/* 编辑器区域 */}
									<div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden">
										{/* 格式化工具栏 */}
										{replyEditorMode === 'edit' && (
									<MarkdownToolbar
										content={replyContent}
										setContent={setReplyContent}
										textareaRef={replyTextareaRef}
										imageInputRef={replyImageInputRef}
										fetchPosts={fetchPosts as any}
										compact={true}
									/>
										)}
										{replyEditorMode === 'preview' && (
											<div className="flex items-center justify-end p-2 bg-slate-50 dark:bg-slate-900 border-b border-gray-300 dark:border-slate-600">
												<button
													type="button"
													onClick={() => setReplyEditorMode('edit')}
													title="编辑"
													className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors text-xs"
												>
													编辑
												</button>
											</div>
										)}

										{/* 编辑器内容区域 */}
										<div className="border-t-0">
											{replyEditorMode === 'edit' ? (
												<textarea
													id="main-reply-content"
													name="main-reply-content"
													ref={replyTextareaRef}
													value={replyContent}
													onChange={(e) => setReplyContent(e.target.value)}
													placeholder="支持 Markdown 和 HTML 格式..."
													className="w-full p-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
												/>
											) : (
												<div className="min-h-[200px] p-3 bg-white dark:bg-slate-800 overflow-y-auto">
													{replyContent.trim() ? (
														<div className="prose prose-sm dark:prose-invert max-w-none
															prose-headings:text-slate-900 dark:prose-headings:text-white
															prose-p:text-slate-700 dark:prose-p:text-slate-300
															prose-strong:text-slate-900 dark:prose-strong:text-white
															prose-a:text-indigo-600 dark:prose-a:text-indigo-400
															prose-code:text-slate-800 dark:prose-code:text-slate-200
															prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900
															prose-img:max-w-full prose-img:h-auto prose-img:my-4">
															{(() => {
																// 分割内容：将 HTML img 标签和 Markdown 内容分开处理
																const hasImgTag = replyContent.includes('<img');
																if (hasImgTag) {
																	const parts: React.ReactNode[] = [];
																	let lastIndex = 0;
																	// 使用更精确的正则表达式匹配 img 标签（包括自闭合标签）
																	const imgRegex = /<img[^>]*\/?>/g;
																	let match;
																	
																	while ((match = imgRegex.exec(replyContent)) !== null) {
																		// 添加 img 标签之前的 Markdown 内容
																		if (match.index > lastIndex) {
																			const markdownPart = replyContent.substring(lastIndex, match.index);
																			if (markdownPart.trim()) {
																				parts.push(
																					<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
																						{markdownPart}
																					</ReactMarkdown>
																				);
																			}
																		}
																		// 添加 img 标签（使用 dangerouslySetInnerHTML）
																		parts.push(
																			<span key={`img-${match.index}`} dangerouslySetInnerHTML={{ __html: match[0] }} />
																		);
																		lastIndex = match.index + match[0].length;
																	}
																	// 添加最后剩余的 Markdown 内容
																	if (lastIndex < replyContent.length) {
																		const markdownPart = replyContent.substring(lastIndex);
																		if (markdownPart.trim()) {
																			parts.push(
																				<ReactMarkdown key={`md-${lastIndex}`} rehypePlugins={[rehypeRaw]}>
																					{markdownPart}
																				</ReactMarkdown>
																			);
																		}
																	}
																	return <>{parts}</>;
																}
																return (
																	<ReactMarkdown 
																		rehypePlugins={[rehypeRaw]}
																	>
																		{replyContent}
																	</ReactMarkdown>
																);
															})()}
														</div>
													) : (
														<p className="text-slate-400 dark:text-slate-500 text-sm">预览将显示在这里...</p>
													)}
												</div>
											)}
										</div>
									</div>

									<div className="mt-3 flex items-center justify-between">
										<p className="text-xs text-slate-500 dark:text-slate-400">
											支持 Markdown 和 HTML 格式
										</p>
										<button
											type="submit"
											disabled={!replyContent.trim() || isSubmittingReply}
											className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
										>
											{isSubmittingReply ? "发布中..." : "发表回复"}
										</button>
									</div>
								</form>
							) : (
								<div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
									<Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline">
										登录后即可参与讨论
									</Link>
								</div>
							)}

							{/* 回复列表 */}
							<div className="space-y-4">
								{post.replies.map(reply => (
									<ReplyItem
										key={reply.id}
										reply={reply}
										user={user}
										onLike={handleReplyLike}
										onReply={(parentId) => setReplyingTo(parentId)}
										replyingTo={replyingTo}
										nestedReplyContent={nestedReplyContent}
										onNestedReplyContentChange={(parentId, content) => {
											setNestedReplyContent(prev => ({ ...prev, [parentId]: content }));
										}}
										onNestedReplySubmit={handleNestedReplySubmit}
										onCancelReply={() => {
											setReplyingTo(null);
											setNestedReplyContent(prev => {
												const newState = { ...prev };
												delete newState[reply.id];
												return newState;
											});
											setNestedReplyEditorMode(prev => {
												const newState = { ...prev };
												delete newState[reply.id];
												return newState;
											});
										}}
										nestedReplyEditorMode={nestedReplyEditorMode}
										setNestedReplyEditorMode={(parentId, mode) => {
											setNestedReplyEditorMode(prev => ({ ...prev, [parentId]: mode }));
										}}
										nestedReplyTextareaRefs={nestedReplyTextareaRefs}
										nestedReplyImageInputRefs={nestedReplyImageInputRefs}
										fetchPosts={fetchPosts as any}
									/>
								))}
							</div>
						</ModuleContainer>
					</div>

					{/* 侧边栏 */}
					<div className="lg:col-span-1">
						{/* 作者信息 */}
						<ModuleContainer title="作者信息">
							<div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
								<img src={getAvatarUrl(post.author_name)} alt={post.author_name} className="w-20 h-20 rounded-full mb-3" />
								<h3 className="font-bold text-slate-900 dark:text-white">{post.author_name}</h3>
								<p className="text-sm text-slate-500 dark:text-slate-400 mb-3">麻将爱好者</p>
								{user && user.username !== post.author_name && post.author_id && (
									<>
										<button 
											onClick={async () => {
												if (!post.author_id) return;
												
												try {
													if (isFollowingAuthor) {
														await unfollowUser(post.author_id);
														setIsFollowingAuthor(false);
														alert(`已取消关注 ${post.author_name}`);
													} else {
														await followUser(post.author_id);
														setIsFollowingAuthor(true);
														alert(`已关注 ${post.author_name}，您将收到该作者新帖的通知`);
													}
												} catch (error: any) {
													alert(error?.message || '操作失败，请稍后重试');
												}
											}}
											className={`w-full py-2 rounded-lg border transition-colors text-sm font-medium ${
												isFollowingAuthor
													? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:text-white dark:border-indigo-600 dark:hover:bg-indigo-700'
													: 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
											}`}
										>
											{isFollowingAuthor ? '✓ 已关注' : '关注作者'}
										</button>
										{isFollowingAuthor && (
											<p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
												将收到该作者新帖通知
											</p>
										)}
									</>
								)}
								{!user && (
									<button 
										onClick={() => {
											alert('请先登录后再关注作者');
											navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
										}}
										className="w-full py-2 rounded-lg border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium"
									>
											关注作者
									</button>
								)}
							</div>
						</ModuleContainer>
					</div>
				</div>
			</main>
		</>
	);
}

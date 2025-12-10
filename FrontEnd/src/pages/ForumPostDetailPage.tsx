import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// 回复类型
interface Reply {
	id: number;
	postId: number;
	author: string;
	avatar: string;
	content: string;
	time: string;
	likes: number;
	isLiked: boolean;
}

// 帖子基础类型接口
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

// 帖子详情类型
interface PostDetail extends Omit<BasePost, 'replies'> {
	content: string;
	likes: number;
	isLiked: boolean;
	replies: Reply[];
	repliesCount: number;
}

// 默认帖子数据
const DEFAULT_POST: PostDetail = {
	id: 0,
	title: "未找到帖子",
	author: "",
	avatar: "https://placehold.co/32x32/cccccc/ffffff?text=?",
	time: "",
	views: 0,
	repliesCount: 0,
	replies: [],
	tags: [],
	content: "该帖子不存在或已被删除",
	likes: 0,
	isLiked: false
};

// 模拟帖子详情数据
const MOCK_POST_DETAIL: Record<number, PostDetail> = {
	101: {
		id: 101,
		title: "深度分析：立直麻将中防守的艺术与时机选择",
		author: "职业雀士太郎",
		avatar: "https://placehold.co/32x32/6366f1/ffffff?text=太",
		time: "2天前",
		views: 5892,
		repliesCount: 136,
		tags: ["技术", "防守", "进阶"],
		content: `<p>在立直麻将中，防守与进攻的平衡是高级雀士必须掌握的技能。本文将从几个方面分析防守的艺术：</p>
    <h3>1. 立直后的防守判断</h3>
    <p>当对手立直后，我们需要根据自己的手牌危险度和场况做出判断。一般来说，有以下几种选择：</p>
    <ul>
        <li>弃和：完全放弃自己的和牌机会，专注于打安全牌</li>
        <li>进攻：继续保持听牌或向听牌前进</li>
        <li>半弃和：在保持一定进攻性的同时，优先打安全牌</li>
    </ul>
    <h3>2. 安全牌的判断方法</h3>
    <p>安全牌的判断基于牌的出现次数和对手的舍牌pattern。通常来说，已经被打出2-3张的牌是比较安全的...</p>
    <p>更多内容请参考职业赛事中的经典防守案例...</p>`,
		likes: 245,
		isLiked: false,
		replies: [
			{
				id: 1,
				postId: 101,
				author: "战术分析师",
				avatar: "https://placehold.co/32x32/10b981/ffffff?text=析",
				content: "非常赞同作者的观点，补充一点：在亲家立直时，防守优先级应该更高，尤其是在晚巡。",
				time: "30分钟前",
				likes: 15,
				isLiked: false
			},
			{
				id: 2,
				postId: 101,
				author: "麻将新手",
				avatar: "https://placehold.co/32x32/f59e0b/ffffff?text=新",
				content: "请问如何快速判断一张牌是否安全？有什么简单的方法吗？",
				time: "1小时前",
				likes: 3,
				isLiked: false
			}
		]
	}
};

export default function ForumPostDetailPage() {
	const { theme } = useTheme();
	const { user } = useAuth();
	const { title } = useParams<{ title: string }>();
	const navigate = useNavigate();
	console.log(title);
	//根据title查找对应的帖子
	const findPostByTitle = (searchTitle: string | undefined | null): PostDetail => {
		if (!searchTitle) return DEFAULT_POST;
		const foundPost = Object.values(MOCK_POST_DETAIL).find(
			post => post.title === searchTitle || post.title === decodeURIComponent(searchTitle)
		);
		return foundPost || DEFAULT_POST;
	};

	const [post, setPost] = useState<PostDetail>(findPostByTitle(title));
	const [replyContent, setReplyContent] = useState("");

	// 处理点赞
	const handleLike = () => {
		setPost(prev => ({
			...prev,
			likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
			isLiked: !prev.isLiked
		}));
	};

	// 处理回复点赞
	const handleReplyLike = (replyId: number) => {
		setPost(prev => ({
			...prev,
			replies: prev.replies.map(reply =>
				reply.id === replyId
					? {
						...reply,
						likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
						isLiked: !reply.isLiked
					}
					: reply
			)
		}));
	};

	// 提交回复
	const handleReplySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyContent.trim() || !user) return;

		const newReply: Reply = {
			id: Date.now(),
			postId: post.id,
			author: user.username,
			avatar: user.avatar || `https://placehold.co/32x32/6366f1/ffffff?text=${user.username.charAt(0)}`,
			content: replyContent,
			time: "刚刚",
			likes: 0,
			isLiked: false
		};

		setPost(prev => ({
			...prev,
			replies: [newReply, ...prev.replies],
			repliesCount: prev.replies.length + 1
		}));
		setReplyContent("");
	};

	const handleGoBack = () => {
		navigate(-1);
	};

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
										<img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
										<div>
											<p className="font-medium text-slate-900 dark:text-white">{post.author}</p>
											<p className="text-sm text-slate-500 dark:text-slate-400">{post.time} · 阅读 {post.views}</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<button
											onClick={handleLike}
											className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${post.isLiked
												? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
												: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
												}`}
										>
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
											</svg>
											<span>{post.likes}</span>
										</button>

										{user && user.username === post.author && (
											<Link
												to={`/forum/edit-post/${post.id}`}
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
								<div className="prose dark:prose-invert max-w-none mb-6">
									<div dangerouslySetInnerHTML={{ __html: post.content }} />
								</div>
							</div>
						</ModuleContainer>

						{/* 回复区 */}
						<ModuleContainer title="回复" description={`共 ${post.replies.length} 条回复`}>
							{/* 回复表单 */}
							{user ? (
								<form onSubmit={handleReplySubmit} className="mb-6">
									<textarea
										value={replyContent}
										onChange={(e) => setReplyContent(e.target.value)}
										placeholder="分享你的观点..."
										className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
									/>
									<div className="mt-3 flex justify-end">
										<button
											type="submit"
											className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
											disabled={!replyContent.trim()}
										>
											发表回复
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
									<div
										key={reply.id}
										className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
									>
										<div className="flex items-start gap-3">
											<img src={reply.avatar} alt={reply.author} className="w-8 h-8 rounded-full flex-shrink-0" />
											<div className="flex-1">
												<div className="flex items-center justify-between mb-1">
													<span className="font-medium text-slate-900 dark:text-white">{reply.author}</span>
													<span className="text-xs text-slate-500 dark:text-slate-400">{reply.time}</span>
												</div>
												<p className="text-slate-700 dark:text-slate-300 mb-2">{reply.content}</p>
												<button
													onClick={() => handleReplyLike(reply.id)}
													className={`flex items-center gap-1 text-xs transition-colors ${reply.isLiked
														? 'text-red-600 dark:text-red-400'
														: 'text-slate-500 dark:text-slate-400'
														}`}
												>
													<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
														<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
													</svg>
													<span>{reply.likes}</span>
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</ModuleContainer>
					</div>

					{/* 侧边栏 */}
					<div className="lg:col-span-1">
						{/* 作者信息 */}
						<ModuleContainer title="作者信息">
							<div className="flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
								<img src={post.avatar} alt={post.author} className="w-20 h-20 rounded-full mb-3" />
								<h3 className="font-bold text-slate-900 dark:text-white">{post.author}</h3>
								<p className="text-sm text-slate-500 dark:text-slate-400 mb-3">麻将爱好者 · 发布了 42 篇内容</p>
								<button className="w-full py-2 rounded-lg border border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm font-medium">
									关注作者
								</button>
							</div>
						</ModuleContainer>

						{/* 相关帖子 */}
						<ModuleContainer title="相关帖子" className="mt-6">
							<div className="space-y-3">
								{[102, 103, 104].map(id => (
									<Link
										key={id}
										to={`/forum/post/${id}`}
										className="block p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
									>
										<h4 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
											{id === 102 ? "M-League最新一轮战报：風林火山队逆转夺冠" :
												id === 103 ? "分享一个我打了3年麻将才发现的牌效小技巧" :
													"如何有效判断对手的听牌类型？"}
										</h4>
									</Link>
								))}
							</div>
						</ModuleContainer>
					</div>
				</div>
			</main>
		</>
	);
}
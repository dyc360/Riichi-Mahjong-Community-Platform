import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { HomePageHeader } from '../components/homePageComp'
import { NewsSubModule, ModuleContainer, ProNews, TeamRank, GameInfoCard, ForumTopicRank, PracticeCard, MainNavigation } from '../components/homePageComp'
import { useNews } from '../contexts/NewsContext';
import { useMLeague } from '../contexts/MLeagueContext';
import { useForum, type ForumPost } from '../contexts/ForumContext';

export default function HomePage() {
	const { getLatestNews, loading, error } = useNews();
	const { rankings: mleagueRankings, loading: mleagueLoading } = useMLeague();
	
	// 从 NewsContext 获取最新的4条新闻
	const industryNews = getLatestNews(4).map(news => ({
		id: news.id,
		title: news.title,
		timestamp: news.timestamp,
		category: news.category
	}));
	//console.log("mleagueRankings", mleagueRankings);
	return (
		<>
			<HomePageHeader />
			{/* Add more content for the home page here */}
			{/* 顶部引导导航 */}
			<nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
				<MainNavigation />
			</nav>
			<main className="container mx-auto px-4 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* 新闻浏览模块  */}
					<NewsModule industryNews={industryNews} loading={loading} error={error} mleagueRankings={mleagueRankings} mleagueLoading={mleagueLoading} />

					{/* 论坛交流模块*/}
					<ForumModule />
				</div>
				{/* 何切练习模块*/}
				<div className="mt-6">
					<PracticeModule />
				</div>
			</main>
		</>
	)
}

// 新闻浏览模块
interface NewsModuleProps {
	industryNews: any[];
	loading: boolean;
	error: string | null;
	mleagueRankings: any[];
	mleagueLoading: boolean;
}

const NewsModule = ({ industryNews, mleagueRankings, mleagueLoading }: NewsModuleProps) => (
	<ModuleContainer
		id="news"
		title="新闻浏览"
		description="立直麻将相关的最新动态与数据"
		className="col-span-1 lg:col-span-2"
	>
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{/* 行业资讯子模块 */}
			<NewsSubModule title="行业资讯">
				<div className="space-y-3">
					{industryNews.map(news => (
						<ProNews
							key={news.id}
							id={news.id}
							title={news.title}
							timestamp={news.timestamp}
							category={news.category}
						/>
					))}
				</div>
				<div className="mt-3 text-right">
					<Link to="/news#industry-news" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
						更多资讯 →
					</Link>
				</div>

			</NewsSubModule>

			{/*M-League联赛积分榜子模块*/}
			<NewsSubModule title="M-League联赛积分榜">
				{mleagueLoading ? (
					<div className="flex justify-center items-center h-32">
						<div className="text-slate-600 dark:text-slate-400 text-sm">加载中...</div>
					</div>
				) : (
					<>
						<div className="space-y-2">
							{mleagueRankings.slice(0, 5).map(team => (
								<TeamRank
									key={team.id || team.rank}
									rank={team.rank}
									teamName={team.team_name}
									score={team.score}
								/>
							))}
						</div>
						<div className="mt-3 text-right">
							<Link to="/news#m-league" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
								完整排名 →
							</Link>
						</div>
					</>
				)}
			</NewsSubModule>

			{/*雀魂游戏信息子模块*/}
			<NewsSubModule title="雀魂游戏信息">
				<div className="space-y-3">
					<GameInfoCard
						title="新活动登场：姬川响的游戏机"
						subtitle="多款新皮肤登场以及老皮肤返场"
						imageUrl="https://placehold.co/100x70/6366f1/ffffff?text=Event"
					/>
					<GameInfoCard
						title="版本更新公告 v2.0.1"
						subtitle="v2.0.1版本更新内容说明，修复已知问题"
						imageUrl="https://placehold.co/100x70/10b981/ffffff?text=Update"
					/>
					{/* <GameInfoCard 
            title="夏季锦标赛报名" 
            subtitle="总奖金池100万，欢迎各路高手报名参加"
            imageUrl="https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
          /> */}
				</div>
				<div className="mt-3 text-right">
					<Link to="/news#majsoul" className="text-xs text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
						游戏动态 →
					</Link>
				</div>
			</NewsSubModule>
		</div>
	</ModuleContainer>
);

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

// 论坛交流模块
const ForumModule = () => {
	const { fetchHotPosts, fetchLatestPosts } = useForum();
	const [posts, setPosts] = useState<ForumPost[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadPosts = async () => {
			try {
				setLoading(true);
				setError(null);
				
				// 获取热门帖子
				const hotPosts = await fetchHotPosts();
				
				// 获取最新帖子
				const latestPosts = await fetchLatestPosts();
				
				// 合并帖子：优先热门帖子，如果不够5条，再从非热门帖子中补充
				const combinedPosts: ForumPost[] = [];
				const hotPostIds = new Set(hotPosts.map(p => p.id));
				
				// 先添加热门帖子（最多5条）
				const hotPostsToAdd = hotPosts.slice(0, 5);
				combinedPosts.push(...hotPostsToAdd);
				
				// 如果热门帖子不够5条，从最新帖子中补充（排除已添加的热门帖子）
				if (combinedPosts.length < 5) {
					const remainingCount = 5 - combinedPosts.length;
					const nonHotPosts = latestPosts
						.filter(p => !hotPostIds.has(p.id))
						.slice(0, remainingCount);
					combinedPosts.push(...nonHotPosts);
				}
				
				// 只取前5条
				setPosts(combinedPosts.slice(0, 5));
			} catch (err: any) {
				console.error('获取论坛帖子失败:', err);
				setError('加载帖子失败，请稍后重试');
			} finally {
				setLoading(false);
			}
		};

		loadPosts();
	}, [fetchHotPosts, fetchLatestPosts]);

	return (
		<ModuleContainer
			title="论坛交流"
			description="与其他麻将爱好者分享心得与技巧"
		>
			{loading ? (
				<div className="flex justify-center items-center h-32">
					<div className="text-slate-600 dark:text-slate-400 text-sm">加载中...</div>
				</div>
			) : error ? (
				<div className="flex justify-center items-center h-32">
					<div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
				</div>
			) : posts.length === 0 ? (
				<div className="flex justify-center items-center h-32">
					<div className="text-slate-600 dark:text-slate-400 text-sm">暂无帖子</div>
				</div>
			) : (
				<div className="space-y-1">
					{posts.map((post, index) => (
						<ForumTopicRank
							key={post.id}
							rank={index + 1}
							title={post.title}
							replies={post.replies_count}
							time={formatRelativeTime(post.created_at)}
							link={`/forum/post/${encodeURIComponent(post.title)}`}
						/>
					))}
				</div>
			)}
			<div className="mt-3 text-right">
				<Link to="/forum" className="text-sm font-medium text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
					进入论坛 →
				</Link>
			</div>
		</ModuleContainer>
	);
};

//何切练习模块
const PracticeModule = () => (
	<ModuleContainer
		title="何切练习"
		description="通过实战案例提升你的打牌决策能力"
	>
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<PracticeCard
				title="手牌算点"
				description="计算给出的手牌的点数，提升算分速度。"
				difficulty="Medium"
				count={85}
				link='/practice/point-calculation'
			/>
			<PracticeCard
				title="清一色何切"
				description="针对清一色的牌效率何切练习。"
				difficulty="Hard"
				count={40}
				link="/practice/chinitsu-calculation"
			/>
			<PracticeCard
				title="何切300"
				description="来自《何切300问》的精选题目，涵盖多种复杂局面。"
				difficulty="Medium"
				count={300}
				link="/practice/naze300"
			/>
			<PracticeCard
				title="牌效率何切"
				description="牌效练习，学习如何最大化进张。"
				difficulty="Easy"
				link="/practice/efficiency-calculation"
				count={150}
			/>
		</div>
		<div className="mt-6 text-center">
			<Link to="/practice" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm dark:bg-indigo-500 dark:hover:bg-indigo-600">
				浏览全部题库
			</Link>
		</div>
	</ModuleContainer>
);
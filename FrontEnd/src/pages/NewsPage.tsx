import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { HomePageHeader, ModuleContainer, ProNews, TeamRank, GameInfoCard, MainNavigation } from '../components/homePageComp';
import { useNews } from '../contexts/NewsContext';
import { useMLeague } from '../contexts/MLeagueContext';

export const MAJSOUL_NEWS = [
	{
		id: 1,
		title: "新活动登场：姬川响的游戏机",
		subtitle: "多款新皮肤登场以及老皮肤返场，完成活动任务可获得限定头像框",
		imageUrl: "https://placehold.co/100x70/6366f1/ffffff?text=Event"
	},
	{
		id: 2,
		title: "版本更新公告 v2.0.1",
		subtitle: "修复了部分场景下的卡顿问题，优化了牌局结算速度，新增3种自定义桌布",
		imageUrl: "https://placehold.co/100x70/10b981/ffffff?text=Update"
	},
	{
		id: 3,
		title: "夏季锦标赛报名启动",
		subtitle: "总奖金池100万，欢迎各路高手报名参加，预选赛将于下周六开始",
		imageUrl: "https://placehold.co/100x70/ec4899/ffffff?text=Tourney"
	},
	{
		id: 4,
		title: "新角色「望月凛」上线",
		subtitle: "全新角色加入雀魂大家庭，自带专属语音和特殊动作",
		imageUrl: "https://placehold.co/100x70/f59e0b/ffffff?text=Character"
	},
];

export default function NewsPage() {
	const location = useLocation();
	const { getLatestNews, loading, error } = useNews();
	const { rankings: mleagueRankings, loading: mleagueLoading, lastUpdated } = useMLeague();

	// 雀魂新闻状态
	const [majsoulNews, setMajsoulNews] = useState<any[]>([]);
	const [majsoulLoading, setMajsoulLoading] = useState(true);
	const [majsoulError, setMajsoulError] = useState<string | null>(null);

	// 从 NewsContext 获取最新的6条新闻
	const industryNews = getLatestNews(6).map(news => ({
		id: news.id,
		title: news.title,
		timestamp: news.timestamp,
		category: news.category
	}));

	// 格式化更新时间（绝对时间）
	const formatUpdateTime = (timestamp: number | null) => {
		if (!timestamp) return '--';
		const date = new Date(timestamp);
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// 锚点滚动效果
	useEffect(() => {
		const timer = setTimeout(() => {
			if (location.hash) {
				const id = location.hash.replace('#', '');
				const element = document.getElementById(id);
				if (element) {
					element.scrollIntoView({
						behavior: 'smooth',
						block: 'start'
					});
				}
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [location.hash]);

	// 获取雀魂新闻
	useEffect(() => {
		const fetchMajsoulNews = async () => {
			try {
				setMajsoulLoading(true);
				setMajsoulError(null);
				const response = await axios.get('http://localhost:8000/api/news_api/majsoul/');
				const articles = response.data.results || response.data;
				// 转换为GameInfoCard需要的格式
				const formattedNews = articles.slice(0, 4).map((article: any, index: number) => ({
					id: article.id,
					title: article.title,
					subtitle: article.summary || article.content?.substring(0, 100) + '...',
					imageUrl: article.cover_image || `https://placehold.co/100x70/${['6366f1', '10b981', 'ec4899', 'f59e0b'][index % 4]}/ffffff?text=${article.title.substring(0, 2)}`
				}));
				setMajsoulNews(formattedNews);
			} catch (err) {
				console.error('获取雀魂新闻失败:', err);
				setMajsoulError('获取新闻失败');
				// 如果API失败，使用静态数据作为fallback
				setMajsoulNews(MAJSOUL_NEWS);
			} finally {
				setMajsoulLoading(false);
			}
		};

		fetchMajsoulNews();
	}, []);

	return (
		<>
			<HomePageHeader />

			{/* 导航栏 */}
			<nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
				<MainNavigation />
			</nav>

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">新闻中心</h1>

				{/* 行业资讯模块 */}
				<ModuleContainer
					id="industry-news"
					title="行业资讯"
					description="立直麻将相关的最新行业动态与赛事信息"
					className="mb-8"
				>
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : error ? (
						<div className="text-red-600 dark:text-red-400 text-center py-4">{error}</div>
					) : (
						<>
							<div className="space-y-3">
								{industryNews.slice(0, 6).map(news => (
									<ProNews
										key={news.id}
										id={news.id}
										title={news.title}
										timestamp={news.timestamp}
										category={news.category}
									/>
								))}
							</div>
							<div className="mt-4 text-right">
								{/* 跳转时添加页码参数 */}
								<Link
									to="/news/archive?page=1"  // 添加page参数
									className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400"
								>
									查看全部资讯 →
								</Link>
							</div>
						</>
					)}
				</ModuleContainer>

				{/* M-League联赛积分榜 */}
				<ModuleContainer
					id="m-league"
					title="M-League联赛积分榜"
					description="最新积分排名情况"
					className="mb-8"
				>
					{mleagueLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : (
						<>
							<div className="space-y-2">
								{mleagueRankings.map(team => (
									<TeamRank
										key={team.id || team.rank}
										rank={team.rank}
										teamName={team.team_name}
										score={team.score}
									/>
								))}
							</div>
							<div className="mt-4 flex justify-between items-center">
								<p className="text-sm text-slate-500 dark:text-slate-400">
									数据更新时间：{formatUpdateTime(lastUpdated)}
								</p>
								<Link to="/news/m-league" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
									查看详细数据 →
								</Link>
							</div>
						</>
					)}
				</ModuleContainer>

				{/* 雀魂游戏信息 */}
				<ModuleContainer
					id="majsoul"
					title="雀魂游戏信息"
					description="最新游戏更新、活动与赛事信息"
				>
					{majsoulLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : majsoulError ? (
						<div className="text-red-600 dark:text-red-400 text-center py-4">{majsoulError}</div>
					) : (
						<>
							<div className="space-y-4">
								{majsoulNews.map((news, index) => (
									<GameInfoCard
										key={news.id || index}
										title={news.title}
										subtitle={news.subtitle}
										imageUrl={news.imageUrl}
									/>
								))}
							</div>
							<div className="mt-4 text-right">
								<Link to="/news/majsoul" className="text-sm text-indigo-500 hover:text-indigo-300 dark:text-indigo-400">
									查看全部游戏动态 →
								</Link>
							</div>
						</>
					)}
				</ModuleContainer>
			</main>
		</>
	);
}
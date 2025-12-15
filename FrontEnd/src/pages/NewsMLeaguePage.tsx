import { Fragment, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useMLeague } from '../contexts/MLeagueContext';

export default function MLeaguePage() {
	const navigate = useNavigate();
	const {
		rankings,
		playerStats,
		loading,
		playerStatsLoading,
		error,
		lastUpdated,
		schedule,
		scheduleLoading,
		fetchSchedule,
		getRecentMatches,
		getUpcomingMatches
	} = useMLeague();
	const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

	// 在数据未加载时获取当前月份的比赛数据
	useEffect(() => {
		if (schedule.length === 0 && !scheduleLoading) {
			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth() + 1;
			// 使用缓存
			fetchSchedule(currentYear, currentMonth, true);
		}
	}, [schedule.length, scheduleLoading, fetchSchedule]);

	const handleGoBack = () => {
		navigate(-1);
	};

	// 切换队伍详情显示
	const toggleTeamDetails = (rank: number) => {
		setSelectedTeam(selectedTeam === rank ? null : rank);
	};

	// 格式化更新时间
	const formatUpdateTime = (timestamp: number | null) => {
		if (!timestamp) return '';
		const date = new Date(timestamp);
		return date.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	// 格式化日期显示
	const formatDate = (dateStr: string) => {
		if (!dateStr || dateStr === "--") return "--";
		const date = new Date(dateStr);

		// 手动格式化日期部分
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const datePart = `${year}年${month}月${day}日`;

		// 获取星期
		const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
		const weekday = weekdays[date.getDay()];

		return `${datePart} ${weekday}`;
	};

	// 获取当前赛季
	const currentSeason = rankings.length > 0 ? rankings[0].season : '';

	// 获取最近完成的比赛
	const recentMatches = useMemo(() => {
		const matches = schedule
			.filter(match => match.status === 'finished' && match.result)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, 5);
		return matches.map((match, idx) => ({
			id: match.match_id || `match-${idx}`,
			date: match.date,
			day_week: match.day_week,
			match: match
		}));
	}, [schedule]);

	// 获取即将到来的比赛
	const upcomingMatches = useMemo(() => {
		const matches = schedule
			.filter(match => match.status === 'upcoming')
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.slice(0, 4);
		return matches.map((match, idx) => ({
			id: match.match_id || `upcoming-${idx}`,
			date: match.date,
			day_week: match.day_week,
			teamA: match.teams[0]?.name || '',
			teamB: match.teams[1]?.name || '',
			match: match
		}));
	}, [schedule]);

	return (
		<>
			<HomePageHeader />

			{/* 导航栏 */}
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
				<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League联赛</h1>
				<p className="text-slate-500 dark:text-slate-400 mb-8">{currentSeason || '最新'}赛季最新数据</p>

				<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
					<div>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							数据更新时间：{lastUpdated ? formatUpdateTime(lastUpdated) : '--'}
						</p>
					</div>
					<div className="flex gap-2">
						<Link
							to="/news/m-league/schedule"
							className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
						>
							完整赛程
						</Link>
						<Link
							to="/news/m-league/stats"
							className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
						>
							详细数据统计
						</Link>
					</div>
				</div>

				{/* 联赛积分榜 */}
				<ModuleContainer
					title={`${currentSeason || '最新'}赛季积分榜`}
					description="各队累计得分排名（正分为胜分，负分为失分）"
					className="mb-8"
				>
					{loading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : error ? (
						<div className="text-red-600 dark:text-red-400 text-center py-4">{error}</div>
					) : rankings.length === 0 ? (
						<div className="text-slate-600 dark:text-slate-400 text-center py-4">暂无数据</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[600px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
								<thead className="bg-indigo-50 dark:bg-slate-700">
									<tr>
										<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">排名</th>
										<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">队伍</th>
										<th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">总分</th>
										<th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">详情</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 dark:divide-slate-700">
									{rankings.map(team => {
										// 根据队伍名匹配后端选手统计数据
										const teamStats = playerStats.find(
											stats => stats.team_name === team.team_name ||
												stats.team_name.includes(team.team_name) ||
												team.team_name.includes(stats.team_name)
										);
										const hasPlayers = teamStats && teamStats.players && teamStats.players.length > 0;

										return (
											<Fragment key={team.id || team.rank}>
												<tr
													className={`hover:bg-gray-50 dark:hover:bg-slate-800/60 ${hasPlayers ? 'cursor-pointer' : ''}`}
													onClick={() => hasPlayers && toggleTeamDetails(team.rank)}
												>
													<td className="py-3 px-4 text-sm font-medium">
														<span className={team.rank <= 3 ? "inline-block w-5 h-5 rounded-full flex items-center justify-center text-white text-xs mr-1" : ""}
															style={{
																backgroundColor: team.rank === 1 ? '#f59e0b' :
																	team.rank === 2 ? '#94a3b8' :
																		team.rank === 3 ? '#d97706' : 'transparent'
															}}>
															{team.rank <= 3 ? team.rank : ""}
														</span>
														{team.rank > 3 ? team.rank : ""}
													</td>
													<td className="py-3 px-4">
														<span className="text-sm font-medium text-slate-900 dark:text-white">{team.team_name}</span>
													</td>
													<td className={`py-3 px-4 text-right text-sm font-medium ${team.score.startsWith('-') ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'
														}`}>
														{team.score}
													</td>
													<td className="py-3 px-4 text-center">
														{hasPlayers && (
															<svg className={`w-4 h-4 text-slate-500 transition-transform mx-auto ${selectedTeam === team.rank ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
															</svg>
														)}
													</td>
												</tr>

												{/* 选手详情 */}
												{selectedTeam === team.rank && hasPlayers && teamStats && (
													<tr>
														<td colSpan={4} className="p-0 border-t-0">
															<div className="bg-gray-50 dark:bg-slate-800/60 p-4 border-t border-gray-200 dark:border-slate-700">
																<h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">队伍选手数据</h4>
																{playerStatsLoading ? (
																	<div className="text-center py-4 text-slate-600 dark:text-slate-400">加载中...</div>
																) : (
																	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
																		{teamStats.players.map((player, idx) => (
																			<div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
																				<p className="text-sm font-medium text-slate-900 dark:text-white mb-1">{player.player_name}</p>
																				<div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
																					{player.points !== null && (
																						<p>积分: <span className={player.points >= 0 ? 'text-green-600' : 'text-red-500'}>{player.points >= 0 ? '+' : ''}{player.points}</span></p>
																					)}
																					{player.average_score !== null && (
																						<p>平均打点: {player.average_score.toFixed(2)}</p>
																					)}
																					{player.riichi_rate !== null && (
																						<p>立直率: {(player.riichi_rate * 100).toFixed(1)}%</p>
																					)}
																					{player.agari_rate !== null && (
																						<p>和牌率: {(player.agari_rate * 100).toFixed(1)}%</p>
																					)}
																					{player.matches !== null && (
																						<p>试合数: {player.matches}</p>
																					)}
																				</div>
																				<Link to={`/players/${player.player_name}`} className="mt-2 inline-block text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
																					查看详情 →
																				</Link>
																			</div>
																		))}
																	</div>
																)}
															</div>
														</td>
													</tr>
												)}
											</Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</ModuleContainer>

				{/* 最近比赛 */}
				<ModuleContainer
					title="最近比赛"
					description="最近结束的5场比赛"
					className="mb-8"
				>
					{scheduleLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : recentMatches.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
							<p className="text-slate-500 dark:text-slate-400">暂无最近比赛</p>
						</div>
					) : (
						<div className="space-y-3">
							{recentMatches.map(match => {
								// 构建队伍名称字符串用于URL（使用 | 分隔符，避免队伍名称中包含 - 时出错）
								const teamsParam = match.match.teams.map(t => t.name).join('|');
								const matchPath = `/matches/${match.date}/${encodeURIComponent(teamsParam)}`;

								return (
									<div key={match.id} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
										<div className="text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mb-2 sm:mb-0">
											{formatDate(match.date)}
										</div>
										<div className="flex items-center justify-center flex-1 flex-wrap gap-2">
											{match.match.teams.map((team, idx) => (
												<div key={idx} className="flex items-center">
													{team.logo && (
														<img
															src={team.logo}
															alt={team.name}
															className="w-6 h-6 mr-2 object-contain"
															onError={(e) => {
																(e.target as HTMLImageElement).style.display = 'none';
															}}
														/>
													)}
													<p className="text-sm font-medium text-slate-900 dark:text-white">
														{team.name}
													</p>
													{idx < match.match.teams.length - 1 && (
														<span className="mx-3 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
															VS
														</span>
													)}
												</div>
											))}
										</div>
										<div className="w-full sm:w-auto mt-2 sm:mt-0 text-right">
											<Link
												to={matchPath}
												className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
											>
												查看详情 →
											</Link>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</ModuleContainer>

				{/* 即将到来的比赛 */}
				<ModuleContainer
					title="即将到来的比赛"
					description="未来4场赛程安排"
				>
					{scheduleLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : upcomingMatches.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 dark:bg-slate-800 rounded-lg">
							<p className="text-slate-500 dark:text-slate-400">暂无即将到来的比赛</p>
						</div>
					) : (
						<div className="space-y-3">
							{upcomingMatches.map(match => (
								<div key={match.id} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
									<div className="text-sm text-slate-500 dark:text-slate-400 w-full sm:w-auto mb-2 sm:mb-0">
										{formatDate(match.date)}
									</div>
									<div className="flex items-center justify-center flex-1">
										{match.match.teams.map((team, idx) => (
											<div key={idx} className="flex items-center">
												{team.logo && (
													<img
														src={team.logo}
														alt={team.name}
														className="w-6 h-6 mr-2 object-contain"
														onError={(e) => {
															(e.target as HTMLImageElement).style.display = 'none';
														}}
													/>
												)}
												<p className="text-sm font-medium text-slate-900 dark:text-white">
													{team.name}
												</p>
												{idx < match.match.teams.length - 1 && (
													<span className="mx-3 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
														VS
													</span>
												)}
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</ModuleContainer>
			</main>
		</>
	);
}
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useMLeague, type MatchSchedule } from '../contexts/MLeagueContext';

export default function MLeagueSchedulePage() {
	const navigate = useNavigate();
	const { schedule, scheduleLoading, scheduleError, fetchSchedule, clearSchedule } = useMLeague();
	
	const [selectedTeam, setSelectedTeam] = useState("全部队伍");
	const [statusFilter, setStatusFilter] = useState("all");
	const [selectedMonth, setSelectedMonth] = useState("全部月份");

	// 当前赛季开始年份
	const currentSeasonStartYear = useMemo(() => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		return month >= 9 ? year : year - 1;
	}, []);

	
	// 生成赛季列表
	const seasons = useMemo(() => {
		const seasonsList: string[] = [];
		for (let startYear = 2018; startYear <= currentSeasonStartYear; startYear++) {
			seasonsList.push(`${startYear}-${startYear + 1}`);
		}
		return seasonsList;
	}, [currentSeasonStartYear]);
	
	// 获取当前赛季
	const getCurrentSeason = () => {
		return `${currentSeasonStartYear}-${currentSeasonStartYear + 1}`;
	};
	
	const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());

	// 生成月份选项
	const getMonthOptions = () => {
		if (!selectedSeason) return ["全部月份"];

		const [startYear] = selectedSeason.split('-').map(Number);
		const months = ["全部月份"];

		for (let month = 9; month <= 12; month++) {
			months.push(`${startYear}年${month}月`);
		}

		const nextYear = startYear + 1;
		for (let month = 1; month <= 5; month++) {
			months.push(`${nextYear}年${month}月`);
		}

		return months;
	};

	const monthOptions = getMonthOptions();

	// 获取所有队伍名称
	const allTeams = useMemo(() => {
		const teamSet = new Set<string>();
		schedule.forEach(match => {
			match.teams.forEach(team => {
				if (team.name) {
					teamSet.add(team.name);
				}
			});
		});
		return Array.from(teamSet).sort();
	}, [schedule]);

	const teams = ["全部队伍", ...allTeams];

	// 当赛季改变时，重新获取数据
	useEffect(() => {
		if (!selectedSeason) return;

		// 解析赛季
		const [startYear, endYear] = selectedSeason.split('-').map(Number);

		// 判断是否为历史赛季
		const currentYear = new Date().getFullYear();
		const isHistoricalSeason = startYear < currentYear;

		const fetchAllScheduleData = async () => {
			clearSchedule();

			if (isHistoricalSeason) {
				// 历史赛季：获取整个赛季的数据
				await fetchSchedule(startYear, undefined, true, false);
			} else {
				// 当前赛季：从9月开始到次年5月结束，需要获取多个月份的数据
				// M-League赛季从9月开始到次年5月结束
				// 需要获取两个时间段的数据：
				// 1. 开始年份的9-12月
				// 2. 结束年份的1-5月

				// 累积所有月份的数据
				const promises = [];

				// 获取开始年份的9-12月数据（累积模式）
				for (let month = 9; month <= 12; month++) {
					promises.push(fetchSchedule(startYear, month, true, true));
				}

				// 获取结束年份的1-5月数据（累积模式）
				for (let month = 1; month <= 5; month++) {
					promises.push(fetchSchedule(endYear, month, true, true));
				}

				// 等待所有请求完成
				await Promise.all(promises);
			}
		};

		fetchAllScheduleData();
	}, [selectedSeason, fetchSchedule, clearSchedule]);

	// 格式化日期显示
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	};

	// 格式化星期显示
	const formatDayWeek = (dayWeek: string) => {
		const weekMap: { [key: string]: string } = {
			'月': '周一',
			'火': '周二',
			'水': '周三',
			'木': '周四',
			'金': '周五',
			'土': '周六',
			'日': '周日'
		};
		return weekMap[dayWeek] || dayWeek;
	};

	// 按日期分组比赛（并去重）
	const groupedSchedule = useMemo(() => {
		const grouped: { [key: string]: MatchSchedule[] } = {};
		const seenMatches = new Set<string>(); // 用于去重
		
		schedule
			.filter(match => {
				// 过滤掉无效的比赛数据（没有日期、没有队伍信息或队伍名称为空）
				return match.date && 
				       match.teams && 
				       match.teams.length > 0 && 
				       match.teams.some((t: { name: string }) => t.name && t.name.trim() !== '');
			})
			.forEach(match => {
				// 生成唯一标识符用于去重
				// 优先使用match_id，如果为空或无效，则使用日期+队伍名称
				const teamNames = match.teams
					.map((t: { name: string }) => t.name)
					.filter((name: string) => name && name.trim() !== '')
					.sort()
					.join('-');
				
				const matchKey = match.match_id && match.match_id.trim() !== '' 
					? `${match.date}-${match.match_id}`
					: `${match.date}-${teamNames}`;
				
				// 如果已经见过这个比赛，跳过
				if (seenMatches.has(matchKey)) {
					return;
				}
				
				seenMatches.add(matchKey);
				
				if (!grouped[match.date]) {
					grouped[match.date] = [];
				}
				grouped[match.date].push(match);
			});

		// 转换为数组并按日期排序
		return Object.entries(grouped)
			.map(([date, matches]) => ({
				date,
				day: matches[0]?.day_week || '',
				matches: matches.sort((a, b) => {
					const aId = a.match_id || '';
					const bId = b.match_id || '';
					if (aId && bId) {
						return aId.localeCompare(bId);
					}
					if (!aId && !bId) return 0;
					return !aId ? 1 : -1;
				})
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
	}, [schedule]);


	// 筛选赛程
	const filteredSchedule = useMemo(() => {
		// 解析赛季年份范围
		const [startYear, endYear] = selectedSeason.split('-').map(Number);

		return groupedSchedule.map(day => {
			const filteredMatches = day.matches.filter(match => {
				// 赛季筛选
				const matchYear = match.year;
				const matchMonth = match.month;

				const isInSeason =
					(matchYear === startYear && matchMonth >= 9 && matchMonth <= 12) ||
					(matchYear === endYear && matchMonth >= 1 && matchMonth <= 5);

				if (!isInSeason) return false;

				// 月份筛选
				if (selectedMonth !== "全部月份") {
					const monthMatch = selectedMonth.match(/(\d{4})年(\d{1,2})月/);
					if (monthMatch) {
						const [, filterYear, filterMonth] = monthMatch;
						if (matchYear !== parseInt(filterYear) || matchMonth !== parseInt(filterMonth)) {
							return false;
						}
					}
				}
				
				// 队伍筛选
				if (selectedTeam !== "全部队伍") {
					const hasTeam = match.teams.some((team: { name: string }) => team.name === selectedTeam);
					if (!hasTeam) {
						return false;
					}
				}

				// 状态筛选
				if (statusFilter === "finished" && match.status !== "finished") return false;
				if (statusFilter === "upcoming" && match.status !== "upcoming") return false;

				return true;
			});

			return {
				...day,
				matches: filteredMatches
			};
		}).filter(day => day.matches.length > 0);
	}, [groupedSchedule, selectedTeam, statusFilter, selectedSeason, selectedMonth]);


	return (
		<>
			<HomePageHeader />

			{/* 导航栏 */}
			<nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
				<div className="flex flex-wrap items-center gap-2">
					<button
						onClick={() => navigate(-1)}
						className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
					>
						<svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
						返回M-League首页
					</button>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League完整赛程</h1>
				<p className="text-slate-500 dark:text-slate-400 mb-8">查看比赛安排与结果</p>

				{/* 赛季和月份选择器 */}
				<div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">赛季</label>
							<select
								value={selectedSeason}
								onChange={(e) => {
									setSelectedSeason(e.target.value);
									setSelectedMonth("全部月份"); // 重置月份选择
								}}
								className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
							>
								{seasons.map(season => (
									<option key={season} value={season}>{season}赛季</option>
								))}
							</select>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">月份</label>
							<select
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
							>
								{monthOptions.map(month => (
									<option key={month} value={month}>{month}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* 筛选器 */}
				<div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm border border-gray-100 dark:border-slate-700">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">队伍筛选</label>
							<select
								value={selectedTeam}
								onChange={(e) => setSelectedTeam(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
							>
								{teams.map(team => (
									<option key={team} value={team}>{team}</option>
								))}
							</select>
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">比赛状态</label>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
							>
								<option value="all">全部比赛</option>
								<option value="finished">已完成</option>
								<option value="upcoming">即将开始</option>
							</select>
						</div>
					</div>
				</div>

				{/* 赛程列表 */}
				<ModuleContainer title="比赛安排" description="按日期排序的完整赛程表">
					{scheduleLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="text-slate-600 dark:text-slate-400">加载中...</div>
						</div>
					) : scheduleError ? (
						<div className="text-red-600 dark:text-red-400 text-center py-4">{scheduleError}</div>
					) : filteredSchedule.length === 0 ? (
						<div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg">
							<p className="text-slate-500 dark:text-slate-400">没有找到符合条件的比赛</p>
						</div>
					) : (
						<div className="space-y-6">
							{filteredSchedule.map(day => (
								<div key={day.date} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
									<div className="bg-indigo-50 dark:bg-slate-700 py-3 px-4">
										<h3 className="text-sm font-semibold text-slate-900 dark:text-white">
											{formatDate(day.date)} ({formatDayWeek(day.day)})
										</h3>
									</div>
									<div className="divide-y divide-gray-200 dark:divide-slate-700">
										{day.matches
											.filter(match => {
												// 过滤掉无效的比赛数据（没有队伍信息或队伍名称为空）
												return match.teams && 
												       match.teams.length > 0 && 
												       match.teams.some((t: { name: string }) => t.name && t.name.trim() !== '');
											})
											.map((match, matchIdx) => {
												// 生成唯一的key：优先使用match_id，如果为空则使用日期+队伍名称+索引
												const uniqueKey = match.match_id && match.match_id.trim() !== '' 
													? match.match_id 
													: `${match.date}-${match.teams.map((t: { name: string }) => t.name).join('-')}-${matchIdx}`;
												
												return (
												<div
													key={uniqueKey}
													className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/60"
												>
												<div className="flex flex-wrap items-center justify-between">
													<div className="flex items-center">
														<span className={`text-xs font-medium py-1 px-2 rounded-full mr-4 ${
															match.status === 'finished'
																? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
																: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
														}`}>
															{match.status === 'finished' ? '已结束' : '未开始'}
														</span>
													</div>
													<div className="flex items-center justify-center flex-1 mx-4 flex-wrap gap-2">
														{match.teams
															.filter((team: { name: string }) => team.name && team.name.trim() !== '')
															.map((team: { name: string; logo?: string }, idx: number) => (
																<div key={`${uniqueKey}-team-${idx}-${team.name}`} className="flex items-center">
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
																	<span className="text-sm font-medium text-slate-900 dark:text-white">
																		{team.name}
																	</span>
																	{idx < match.teams.filter((t: { name: string }) => t.name && t.name.trim() !== '').length - 1 && (
																		<span className="mx-2 text-slate-400">VS</span>
																	)}
																</div>
															))}
													</div>
													<div className="w-full sm:w-auto mt-2 sm:mt-0 text-right">
														<Link
															to={`/matches/${match.date}/${encodeURIComponent(match.teams.map((t: { name: string }) => t.name).join('|'))}`}
															className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400"
														>
															查看详情 →
														</Link>
													</div>
												</div>
											</div>
											);
										})}
									</div>
								</div>
							))}
						</div>
					)}
				</ModuleContainer>

				{/* 赛程说明 */}
				<div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mt-6 border border-gray-100 dark:border-slate-700">
					<h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">赛程说明</h4>
					<ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
						<li>• 每场比赛通常包含多个回合（第1回戦、第2回戦等）</li>
						<li>• 每个回合有4名选手参与，按最终得分排名</li>
						<li>• 比赛结果将在比赛结束后更新</li>
						<li>• 点击比赛条目可查看详细战报和技术统计</li>
					</ul>
				</div>
			</main>
		</>
	);
}

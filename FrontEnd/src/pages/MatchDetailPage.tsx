import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useMLeague, type MatchSchedule, type MatchResult, type MatchTeam, type MatchResultRound, type MatchResultPlayer } from '../contexts/MLeagueContext';

// 解析队伍参数（支持多个队伍，用 | 分隔，避免队伍名称中包含 - 时出错）
const parseTeams = (teamsStr: string): string[] => {
	const decodedStr = decodeURIComponent(teamsStr);
	// 优先使用 | 分隔符，如果没有则尝试 - 分隔符（向后兼容）
	if (decodedStr.includes('|')) {
		return decodedStr.split('|').map(t => t.trim()).filter(t => t.length > 0);
	}
	// 向后兼容：如果没有 |，则使用 - 分隔
	return decodedStr.split('-').map(t => t.trim()).filter(t => t.length > 0);
};

export default function MatchDetailPage() {
	const navigate = useNavigate();
	const { date, teams } = useParams<{ date: string; teams: string }>();
	const { schedule, scheduleLoading, fetchSchedule, playerStats, playerStatsLoading, refreshPlayerStats } = useMLeague();
	const [matchData, setMatchData] = useState<MatchSchedule | null>(null);
	const [loading, setLoading] = useState(true);

	// 解析队伍名称
	const teamNames = useMemo(() => {
		if (!teams) return [];
		return parseTeams(teams);
	}, [teams]);

	// 从 schedule 中查找匹配的比赛
	useEffect(() => {
		if (!date) {
			setLoading(false);
			return;
		}

		const findMatchInSchedule = () => {
			// 查找匹配的比赛
			// console.log('查找比赛:', { date, teamNames, scheduleLength: schedule.length });

			// 先按日期过滤
			const dateMatches = schedule.filter(m => m.date === date);
			// console.log(`日期 ${date} 匹配的比赛数量:`, dateMatches.length);

			if (dateMatches.length === 0) {
				// console.warn('未找到匹配日期的比赛');
				// 打印所有可用的日期用于调试
				// const availableDates = [...new Set(schedule.map(m => m.date))].sort();
				// console.log('可用的日期:', availableDates);
				setMatchData(null);
				setLoading(false);
				return;
			}

			// 检查队伍是否匹配（所有队伍名称都匹配）
			if (teamNames.length === 0) {
				// console.warn('队伍名称为空');
				setMatchData(null);
				setLoading(false);
				return;
			}

			const foundMatch = dateMatches.find(m => {
				const matchTeamNames = m.teams.map(t => t.name);
				// console.log('比较队伍:', {
				// 	urlTeams: teamNames,
				// 	matchTeams: matchTeamNames,
				// 	date: m.date
				// });

				if (matchTeamNames.length !== teamNames.length) {
					// console.log('队伍数量不匹配');
					return false;
				}

				// 检查所有队伍名称是否都匹配（顺序无关，使用精确匹配）
				// 先尝试精确匹配
				const exactMatch = teamNames.every((name: string) =>
					matchTeamNames.some((matchName: string) => matchName === name)
				);

				if (exactMatch) {
					// console.log('精确匹配成功');
					return true;
				}

				// 如果精确匹配失败，尝试包含匹配（处理URL编码或空格问题）
				const containsMatch = teamNames.every((name: string) =>
					matchTeamNames.some((matchName: string) => {
						// 去除空格和特殊字符后比较
						const normalizedName = name.trim().replace(/\s+/g, '');
						const normalizedMatchName = matchName.trim().replace(/\s+/g, '');
						return normalizedMatchName === normalizedName ||
							normalizedMatchName.includes(normalizedName) ||
							normalizedName.includes(normalizedMatchName);
					})
				);

				if (containsMatch) {
					// console.log('包含匹配成功');
					return true;
				}

				// console.log('匹配失败');
				return false;
			});

			if (foundMatch) {
				// console.log('找到匹配的比赛:', foundMatch);
			} else {
				// console.warn('未找到匹配的比赛');
				// 打印所有该日期的比赛用于调试
				// console.log('该日期的所有比赛:', dateMatches.map(m => ({
				// 	date: m.date,
				// 	teams: m.teams.map(t => t.name)
				// })));
			}

			setMatchData(foundMatch || null);
			setLoading(false);
		};

		// 如果正在加载数据，等待加载完成
		if (scheduleLoading) {
			setLoading(true);
			return;
		}

		// 如果 schedule 为空，尝试获取数据
		if (schedule.length === 0) {
			const matchDate = new Date(date);
			setLoading(true);
			fetchSchedule(matchDate.getFullYear(), matchDate.getMonth() + 1, true).then(() => {
				// 数据加载完成后，会在 schedule 更新时再次触发这个 useEffect
				// 所以这里不需要手动调用 findMatchInSchedule
			}).catch(() => {
				// console.error('获取比赛数据失败:', err);
				setMatchData(null);
				setLoading(false);
			});
			return;
		}

		// 数据已加载，执行查找
		findMatchInSchedule();
	}, [date, teams, schedule, scheduleLoading, teamNames, fetchSchedule]);

	const handleGoBack = () => navigate(-1);

	// 确保 playerStats 已加载
	useEffect(() => {
		if (playerStats.length === 0 && !playerStatsLoading) {
			refreshPlayerStats();
		}
	}, [playerStats.length, playerStatsLoading, refreshPlayerStats]);

	// 根据选手姓名查找对应的队伍名称
	const getTeamNameByPlayerName = useCallback((playerName: string): string | null => {
		if (!playerName || playerStats.length === 0) {
			// console.log(`getTeamNameByPlayerName: 选手 ${playerName} - playerStats 为空或未加载`);
			return null;
		}

		// 标准化名称：去除所有空格
		const normalizeName = (name: string) => name.replace(/\s+/g, '').trim();
		const normalizedPlayerName = normalizeName(playerName);

		// 遍历所有队伍，查找包含该选手的队伍
		for (const teamStat of playerStats) {
			const foundPlayer = teamStat.players.find(p => {
				// 精确匹配
				if (p.player_name === playerName || p.player_name.trim() === playerName.trim()) {
					return true;
				}
				// 去除空格后匹配（处理 "渡辺太" vs "渡辺 太" 的情况）
				if (normalizeName(p.player_name) === normalizedPlayerName) {
					return true;
				}
				return false;
			});
			if (foundPlayer) {
				// console.log(`getTeamNameByPlayerName: 找到选手 ${playerName} (匹配到 ${foundPlayer.player_name}) 在队伍 ${teamStat.team_name}`);
				return teamStat.team_name;
			}
		}

		// console.warn(`getTeamNameByPlayerName: 未找到选手 ${playerName} 的队伍`);
		// 打印所有可用的选手名称用于调试
		// const allPlayerNames = playerStats.flatMap(team => team.players.map(p => p.player_name));
		// console.log('getTeamNameByPlayerName: 所有可用选手名称', allPlayerNames);

		return null;
	}, [playerStats]);

	// 根据选手姓名查找对应的队伍logo
	const getTeamLogoByPlayerName = useCallback((playerName: string, matchTeams: MatchTeam[]): string | null => {
		const teamName = getTeamNameByPlayerName(playerName);
		if (!teamName) return null;

		// 在 matchTeams 中查找对应的 logo
		const team = matchTeams.find(t => t.name === teamName || t.name.trim() === teamName.trim());
		return team?.logo || null;
	}, [getTeamNameByPlayerName]);

	// 格式化日期显示（包含星期，日期和星期之间用空格分隔）
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

		// 返回格式：日期 星期（中间有空格）
		return `${datePart} ${weekday}`;
	};

	// 从比赛结果中构建选手到队伍的映射（用于历史赛季）
	const buildPlayerTeamMap = (result: MatchResult): { [playerName: string]: string } => {
		const playerTeamMap: { [playerName: string]: string } = {};

		if (!result || !result.rounds) return playerTeamMap;

		result.rounds.forEach(round => {
			round.results.forEach(player => {
				if (player.player_name && player.team_name) {
					// 标准化选手名称（去除空格）
					const normalizedName = player.player_name.replace(/\s+/g, '').trim();
					playerTeamMap[normalizedName] = player.team_name;
					// 也保存原始名称
					playerTeamMap[player.player_name] = player.team_name;
				}
			});
		});

		return playerTeamMap;
	};

	// 计算每个队伍的总得分
	// const calculateTeamScores = (result: MatchResult | null, matchTeams: MatchTeam[] = []) => {
	// 	if (!result || !result.rounds) {
	// 		// console.log('calculateTeamScores: 没有结果数据');
	// 		return {};
	// 	}

	// 	const teamScores: { [key: string]: number } = {};

	// 	// 创建队伍名称映射表，用于匹配（处理可能的名称差异）
	// 	const teamNameMap: { [key: string]: string } = {};
	// 	const normalizeTeamName = (name: string) => name.replace(/\s+/g, '').trim();

	// 	matchTeams.forEach(team => {
	// 		const normalized = normalizeTeamName(team.name);
	// 		teamNameMap[team.name] = team.name;
	// 		teamNameMap[normalized] = team.name;

	// 		// 处理常见的队伍名称变体
	// 		// 例如："TEAM RAIDEN / 雷電" 可能在历史数据中是 "TEAM RAIDEN" 或 "雷電"
	// 		const parts = team.name.split('/').map(p => p.trim());
	// 		parts.forEach(part => {
	// 			if (part && part !== team.name) {
	// 				teamNameMap[part] = team.name;
	// 				teamNameMap[normalizeTeamName(part)] = team.name;
	// 			}
	// 		});
	// 	});

	// 	// 从比赛结果中构建选手到队伍的映射（优先级最高）
	// 	const playerTeamMap = buildPlayerTeamMap(result);

	// 	// console.log('calculateTeamScores: 队伍映射表', teamNameMap);
	// 	// console.log('calculateTeamScores: 选手队伍映射表', playerTeamMap);

	// 	result.rounds.forEach(round => {
	// 		round.results.forEach(player => {
	// 			if (player.score !== null) {
	// 				let teamName = player.team_name;

	// 				// 如果比赛结果中没有队伍信息，尝试从选手队伍映射中查找
	// 				if (!teamName && player.player_name) {
	// 					const normalizedPlayerName = player.player_name.replace(/\s+/g, '').trim();
	// 					teamName = playerTeamMap[player.player_name] ||
	// 							 playerTeamMap[normalizedPlayerName] ||
	// 							 getTeamNameByPlayerName(player.player_name) ||
	// 							 null;
	// 				}

	// 				if (teamName) {
	// 					// 多层次队伍名称匹配
	// 					let matchedTeamName = teamNameMap[teamName] ||
	// 						teamNameMap[normalizeTeamName(teamName)];

	// 					// 如果还没匹配到，尝试模糊匹配
	// 					if (!matchedTeamName) {
	// 						for (const [mappedName, actualName] of Object.entries(teamNameMap)) {
	// 							if (mappedName.includes(normalizeTeamName(teamName)) ||
	// 								normalizeTeamName(teamName).includes(mappedName)) {
	// 								matchedTeamName = actualName;
	// 								break;
	// 							}
	// 						}
	// 					}

	// 					// 如果还是没匹配到，使用原始名称
	// 					matchedTeamName = matchedTeamName || teamName;

	// 					if (!teamScores[matchedTeamName]) {
	// 						teamScores[matchedTeamName] = 0;
	// 					}
	// 					teamScores[matchedTeamName] += player.score;
	// 					// console.log(`calculateTeamScores: 队伍 ${matchedTeamName} 得分 += ${player.score}, 当前总分: ${teamScores[matchedTeamName]}`);
	// 				} else {
	// 					// console.warn(`calculateTeamScores: 无法找到选手 ${player.player_name} 的队伍名称，跳过得分计算`);
	// 				}
	// 			}
	// 		});
	// 	});

	// 	// console.log('calculateTeamScores: 最终得分', teamScores);
	// 	return teamScores;
	// };

	// 计算队伍得分（必须在所有条件返回之前调用，遵守 Hooks 规则）
	// const teamScores = useMemo(() => {
	// 	if (!matchData) return {};
	// 	// 确保 playerStats 已加载后再计算
	// 	if (playerStats.length === 0) {
	// 		// console.log('teamScores: playerStats 尚未加载');
	// 		return {};
	// 	}
	// 	return calculateTeamScores(matchData.result, matchData.teams);
	// }, [matchData, getTeamNameByPlayerName, playerStats.length]);

	// 如果没有找到比赛数据，显示空状态
	if (loading || scheduleLoading) {
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
					<div className="flex justify-center items-center h-64">
						<div className="text-slate-600 dark:text-slate-400">加载中...</div>
					</div>
				</main>
			</>
		);
	}

	if (!matchData) {
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
					<div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6">
						<div className="text-center py-12">
							<p className="text-slate-600 dark:text-slate-400 mb-4">未找到该比赛的数据</p>
							<p className="text-sm text-slate-500 dark:text-slate-500">
								日期: {date || "--"} | 队伍: {teamNames.join(", ") || "--"}
							</p>
						</div>
					</div>
				</main>
			</>
		);
	}

	const hasResult = matchData?.status === 'finished' && matchData?.result && matchData?.result.rounds.length > 0;

	return (
		<>
			<HomePageHeader />

			{/* 导航栏 */}
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
				{/* 比赛基本信息 */}
				<div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
					{/* 空数据提示 */}
					{!hasResult && matchData.status === 'finished' && (
						<div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
							<p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
								<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								该比赛的详细结果数据暂未收录
							</p>
						</div>
					)}

					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="text-center md:text-left w-full md:w-auto">
							<div className="grid grid-cols-4 gap-32 mb-2">
								{matchData.teams.map((team, idx) => {
									// 为不同队伍分配不同的颜色主题
									const teamColors = [
										'text-indigo-600 dark:text-indigo-400',
										'text-emerald-600 dark:text-emerald-400',
										'text-rose-600 dark:text-rose-400',
										'text-amber-600 dark:text-amber-400'
									];
									const colorClass = teamColors[idx % teamColors.length];

									return (
										<div key={idx} className="flex flex-col items-center gap-2">
											<div className="flex items-center justify-center w-20 h-20 bg-white rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
												{team.logo && (
													<img
														src={team.logo}
														alt={team.name}
														className="w-16 h-16 object-contain"
														onError={(e) => {
															(e.target as HTMLImageElement).style.display = 'none';
														}}
													/>
												)}
											</div>
											<span className={`text-sm font-semibold text-center whitespace-nowrap truncate ${colorClass}`}>
												{team.name}
											</span>
										</div>
									);
								})}
							</div>
							<div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
								<span className="flex items-center gap-1">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									{formatDate(matchData.date)}
								</span>
								<span className="flex items-center gap-1">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
									{matchData.status === "finished" ? "已结束" : matchData.status === "upcoming" ? "未开始" : "进行中"}
								</span>
							</div>
						</div>

						{/* {hasResult && (
							<div className="grid grid-cols-2 gap-6">
								{matchData.teams.map((team: MatchTeam, idx: number) => {
									//const score = teamScores[team.name] || 0;
									const colors = [
										"text-indigo-600 dark:text-indigo-400",
										"text-rose-600 dark:text-rose-400",
										"text-green-600 dark:text-green-400",
										"text-amber-600 dark:text-amber-400"
									];
									return (
										<div key={idx} className="text-center">
											{team.logo && (
												<img
													src={team.logo}
													alt={team.name}
													className="w-12 h-12 mx-auto mb-2 object-contain"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}}
												/>
											)}
											<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{team.name}</p>
										</div>
									);
								})}
							</div>
						)} */}
					</div>
				</div>

				{/* 比赛结果 */}
				{hasResult && matchData.result && (
					<div className="mb-8">
						<ModuleContainer title="比赛结果" description="各回合的详细排名和得分">
							<div className="space-y-6">
								{matchData.result.rounds.map((round: MatchResultRound, roundIdx: number) => (
									<div key={roundIdx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
										<h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
											{round.round_name}
										</h3>
										<div className="space-y-2">
											{round.results.map((player: MatchResultPlayer, idx: number) => (
												<div
													key={idx}
													className={`flex items-center justify-between p-3 rounded-lg ${player.rank === 1
														? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
														: player.rank === 2
															? 'bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700'
															: player.rank === 3
																? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
																: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
														}`}
												>
													<div className="flex items-center flex-1">
														<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${player.rank === 1
															? 'bg-yellow-400 text-yellow-900'
															: player.rank === 2
																? 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
																: player.rank === 3
																	? 'bg-orange-300 text-orange-900 dark:bg-orange-700 dark:text-orange-200'
																	: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-200'
															}`}>
															{player.rank}
														</div>
														{player.player_avatar && (
															<img
																src={player.player_avatar}
																alt={player.player_name}
																className="w-10 h-10 rounded-full mr-3 object-cover"
																onError={(e) => {
																	(e.target as HTMLImageElement).style.display = 'none';
																}}
															/>
														)}
														<div className="flex-1">
															<div className="flex items-center gap-2 flex-wrap">
																<p className="text-sm font-medium text-slate-900 dark:text-white">
																	{player.player_name}
																</p>
																{/* {(() => {
																	// 优先使用 player.team_name，如果为空则通过选手姓名查找
																	const teamName = player.team_name || (matchData ? getTeamNameByPlayerName(player.player_name) : null);
																	const teamLogo = player.team_logo || (matchData ? getTeamLogoByPlayerName(player.player_name, matchData.teams) : null);

																	return teamName ? (
																		<span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
																			{teamLogo && (
																				<img
																					src={teamLogo}
																					alt={teamName}
																					className="w-4 h-4 object-contain"
																					onError={(e) => {
																						(e.target as HTMLImageElement).style.display = 'none';
																					}}
																				/>
																			)}
																			<span>{teamName}</span>
																		</span>
																	) : null;
																})()} */}
															</div>
														</div>
													</div>
													<div className="text-right">
														<p className={`text-lg font-semibold ${player.score && player.score > 0
															? 'text-green-600 dark:text-green-400'
															: player.score && player.score < 0
																? 'text-red-600 dark:text-red-400'
																: 'text-slate-600 dark:text-slate-400'
															}`}>
															{player.score_text || '--'}
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
						</ModuleContainer>
					</div>
				)}

				{/* 队伍得分汇总
				{hasResult && (
					<div className="mb-8">
						<ModuleContainer title="队伍得分汇总" description="各队伍在所有回合中的总得分">
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{matchData.teams.map((team: MatchTeam, idx: number) => {
									const score = teamScores[team.name] || 0;
									const colors = [
										"bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
										"bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
										"bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
										"bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
									];
									return (
										<div key={idx} className={`p-4 rounded-lg border ${colors[idx] || 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
											{team.logo && (
												<img
													src={team.logo}
													alt={team.name}
													className="w-12 h-12 mx-auto mb-2 object-contain"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}}
												/>
											)}
											<p className="text-sm font-medium text-center mb-2">{team.name}</p>
											<p className={`text-2xl font-bold text-center ${score > 0 ? 'text-green-600 dark:text-green-400' :
												score < 0 ? 'text-red-600 dark:text-red-400' :
													'text-slate-600 dark:text-slate-400'
												}`}>
												{score > 0 ? '+' : ''}{score.toFixed(1)}
											</p>
										</div>
									);
								})}
							</div>
						</ModuleContainer>
					</div>
				)} */}

				{/* 未开始比赛提示 */}
				{matchData.status === 'upcoming' && (
					<div className="mb-8">
						<ModuleContainer title="比赛信息" description="比赛尚未开始">
							<div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
								<p className="text-blue-700 dark:text-blue-300">
									本场比赛尚未开始，请关注比赛时间
								</p>
							</div>
						</ModuleContainer>
					</div>
				)}
			</main>
		</>
	);
}
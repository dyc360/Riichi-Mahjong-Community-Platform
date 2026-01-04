import { useState, useMemo, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import { useMLeague, type PlayerStat } from '../contexts/MLeagueContext';

// Memoized表格行组件，避免不必要的重新渲染
const PointsTableRow = memo(({ row }: { row: any }) => (
	<tr className="hover:bg-gray-50 dark:hover:bg-slate-800/60">
		<td className="py-3 px-4 sticky left-0 bg-white dark:bg-slate-800 z-10">
			<span className="text-sm font-medium text-slate-900 dark:text-white">{row.teamName}</span>
		</td>
		<td className={`py-3 px-4 text-center text-sm font-medium ${row.totalPointsClass}`}>
			{row.totalPointsDisplay}
		</td>
		{row.cells.map((cell: any) => (
			<td key={cell.key} className={`py-3 px-4 text-center text-sm ${cell.className}`}>
				{cell.display}
			</td>
		))}
	</tr>
));

PointsTableRow.displayName = 'PointsTableRow';

export default function MLeagueStatsPage() {
	const navigate = useNavigate();
	const { playerStats, playerStatsLoading, playerStatsError, pointsData, pointsDataLoading, pointsDataError} = useMLeague();
	const [activePointsTable, setActivePointsTable] = useState<'total_points' | 'regular_points' | 'postseason_points' | 'semifinal_points' | 'final_points'>('total_points');
	const [activeRanking, setActiveRanking] = useState<string>("average_score");
	const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
	const [showAllPlayers, setShowAllPlayers] = useState(false);
	const [basicDataLoaded, setBasicDataLoaded] = useState(false);
	const [showAllColumns, setShowAllColumns] = useState(false);

	// 预处理表格数据
	const processedTableData = useMemo(() => {
		if (!pointsData || !pointsData[activePointsTable] || !Array.isArray(pointsData[activePointsTable])) {
			return { columns: [], rows: [] };
		}

		const tableData = pointsData[activePointsTable];
		if (tableData.length === 0 || !tableData[0]) {
			return { columns: [], rows: [] };
		}

		// 获取所有列并排序
		const allColumns = Object.keys(tableData[0])
			.filter(key => key !== 'チーム名' && key !== '累計ポイント')
			.sort((a, b) => {
				const getYearValue = (col: string) => {
					const match = col.match(/(\d{4})/);
					if (match) {
						const year = parseInt(match[1]);
						return year + (col.includes('F') ? 0.9 : col.includes('SF') ? 0.5 : 0.1);
					}
					return 0;
				};
				return getYearValue(b) - getYearValue(a);
			});

		// 选择要显示的列
		const displayColumns = !showAllColumns && allColumns.length > 6
			? allColumns.slice(0, 6)
			: allColumns;

		// 预处理每一行的数据
		const processedRows = tableData.map((team, index) => ({
			key: team.チーム名 || `team-${index}`,
			teamName: team.チーム名 || '未知队伍',
			totalPoints: team.累計ポイント,
			totalPointsDisplay: team.累計ポイント
				? (team.累計ポイント >= 0 ? '+' : '') + team.累計ポイント.toFixed(1)
				: '-',
			totalPointsClass: team.累計ポイント && team.累計ポイント >= 0
				? 'text-green-600 dark:text-green-400'
				: 'text-red-500 dark:text-red-400',
			cells: displayColumns.map(key => {
				const value = team[key];
				return {
					key,
					value,
					display: value === null || value === '-'
						? '-'
						: typeof value === 'number'
							? ((value >= 0 ? '+' : '') + value.toFixed(1))
							: value,
					className: value && typeof value === 'number' && value >= 0
						? 'text-green-600 dark:text-green-400'
						: 'text-red-500 dark:text-red-400'
				};
			})
		}));

		return {
			columns: displayColumns,
			rows: processedRows
		};
	}, [pointsData, activePointsTable, showAllColumns]);

	// 定义所有可用于排名的字段及其配置
	type RankingConfig = { label: string; unit: string; format: 'number' | 'percentage' | 'score' };
	const rankingConfigs: Record<string, RankingConfig> = {
		matches: { label: '试合数', unit: '', format: 'number' },
		total_games: { label: '总局数', unit: '', format: 'number' },
		points: { label: '积分', unit: '', format: 'number' },
		average_rank: { label: '平顺', unit: '', format: 'number' },
		first_place: { label: '1位', unit: '', format: 'number' },
		second_place: { label: '2位', unit: '', format: 'number' },
		third_place: { label: '3位', unit: '', format: 'number' },
		fourth_place: { label: '4位', unit: '', format: 'number' },
		top_rate: { label: '一位率', unit: '%', format: 'percentage' },
		renchan_rate: { label: '连庄率', unit: '%', format: 'percentage' },
		last_avoidance_rate: { label: '避四率', unit: '%', format: 'percentage' },
		best_score: { label: '最高打点', unit: '', format: 'number' },
		average_score: { label: '平均打点', unit: '', format: 'score' },
		furo_rate: { label: '副露率', unit: '%', format: 'percentage' },
		riichi_rate: { label: '立直率', unit: '%', format: 'percentage' },
		agari_rate: { label: '和牌率', unit: '%', format: 'percentage' },
		houjuu_rate: { label: '放铳率', unit: '%', format: 'percentage' },
		houjuu_average_score: { label: '平均铳点', unit: '', format: 'score' }
	};

	// 从选手数据生成排行榜
	const playerRankings = useMemo(() => {
		if (!playerStats || playerStats.length === 0) return null;

		const allPlayers: Array<PlayerStat & { team_name: string }> = [];
		playerStats.forEach(team => {
			team.players.forEach(player => {
				allPlayers.push({ ...player, team_name: team.team_name });
			});
		});

		const rankings: Record<string, Array<PlayerStat & { team_name: string; rank: number; value: number; displayRank: string }>> = {};

		// 计算排名的辅助函数，支持并列处理
		const calculateRankings = (players: Array<PlayerStat & { team_name: string }>, valueGetter: (p: PlayerStat) => number | null) => {
			const filteredPlayers = players
				.filter(p => valueGetter(p) !== null)
				.map(p => ({ ...p, value: valueGetter(p)! }));

			// 根据排序方向排序
			const sortedPlayers = [...filteredPlayers].sort((a, b) => {
				return sortDirection === "desc" ? b.value - a.value : a.value - b.value;
			});

			// 计算排名
			let currentRank = 1;
			let previousValue: number | null = null;
			let displayRank = 1;

			return sortedPlayers.map((player, _index) => {
				if (previousValue !== null && player.value !== previousValue) {
					displayRank = currentRank;
				}
				previousValue = player.value;

				const result = {
					...player,
					rank: currentRank,
					displayRank: displayRank.toString()
				};

				currentRank++;
				return result;
			});
		};

		// 为所有字段生成排名
		Object.keys(rankingConfigs).forEach(key => {
			const valueGetter = (p: PlayerStat) => p[key as keyof PlayerStat] as number | null;
			rankings[key] = calculateRankings(allPlayers, valueGetter);
		});

		return rankings;
	}, [playerStats, sortDirection]);


	// 当数据加载完成后，标记基本数据已加载
	useEffect(() => {
		if (pointsData && !pointsDataLoading && !basicDataLoaded) {
			setBasicDataLoaded(true);
		}
	}, [pointsData, pointsDataLoading, basicDataLoaded]);

	const handleGoBack = () => {
		navigate(-1);
	};

	return (
		<>
			<HomePageHeader />

			{/* 导航栏 */}
			<nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex gap-2">
						<button
							onClick={handleGoBack}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
						>
							<svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
							</svg>
							返回M-League首页
						</button>
						{/* <button
							onClick={() => refreshPointsData()}
							disabled={pointsDataLoading}
							className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							title="刷新积分数据"
						>
							<svg className={`inline-block w-4 h-4 mr-1 ${pointsDataLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							刷新积分数据
						</button> */}
					</div>
				</div>
			</nav>

			<main className="container mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">M-League详细数据统计</h1>
				<p className="text-slate-500 dark:text-slate-400 mb-8">2025赛季队伍与选手全面数据分析</p>

				{playerStatsLoading ? (
					<div className="flex justify-center items-center h-64">
						<div className="text-slate-600 dark:text-slate-400">加载中...</div>
					</div>
				) : playerStatsError ? (
					<div className="text-red-600 dark:text-red-400 text-center py-4">{playerStatsError}</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
						{/* 数据概览卡片 */}
						<div className="lg:col-span-1 space-y-4">
							<ModuleContainer title="联赛概览" description="M-League联赛基本情况">
								<div className="p-4 space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600 dark:text-slate-400">参赛队伍</span>
										<span className="text-lg font-bold text-slate-900 dark:text-white">{playerStats.length}支</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600 dark:text-slate-400">总选手数</span>
										<span className="text-lg font-bold text-slate-900 dark:text-white">
											{playerStats.reduce((sum, team) => sum + team.players.length, 0)}人
										</span>
									</div>
								</div>
							</ModuleContainer>
						</div>

						{/* 队伍积分历史表格 */}
						<div className="lg:col-span-2">
							<ModuleContainer title="队伍积分历史" description="各队伍历史积分数据">
								{pointsDataLoading && !basicDataLoaded ? (
									<div className="text-center py-8">
										<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
										<div className="mt-2 text-slate-600 dark:text-slate-400">正在加载积分数据...</div>
										<div className="mt-1 text-sm text-slate-500 dark:text-slate-500">正在获取历史积分数据</div>
									</div>
								) : pointsDataLoading && basicDataLoaded ? (
									<div className="text-center py-4">
										<div className="inline-block w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
										<div className="mt-1 text-sm text-green-600 dark:text-green-400">数据加载完成，正在渲染...</div>
									</div>
								) : pointsDataError ? (
									<div className="text-red-600 dark:text-red-400 text-center py-4">{pointsDataError}</div>
								) : !pointsData ? (
									<div className="text-center py-4 text-slate-600 dark:text-slate-400">暂无积分数据</div>
								) : (
									<div className="space-y-4">
										{/* 积分表格选择器和列控制 */}
										<div className="flex flex-wrap justify-between items-center gap-4">
											<div className="flex flex-wrap gap-2">
											{[
												{ key: 'total_points', label: '综合积分' },
												{ key: 'regular_points', label: '常规赛积分' },
												{ key: 'postseason_points', label: '季后赛积分' },
												{ key: 'semifinal_points', label: '半决赛积分' },
												{ key: 'final_points', label: '决赛积分' }
											].map((tableType) => (
												<button
													key={tableType.key}
													onClick={() => setActivePointsTable(tableType.key as 'total_points' | 'regular_points' | 'postseason_points' | 'semifinal_points' | 'final_points')}
													className={`px-3 py-1 text-sm font-medium rounded transition-colors ${activePointsTable === tableType.key
															? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
															: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
														}`}
												>
													{tableType.label}
												</button>
											))}
										</div>

											{/* 列显示控制 */}
											{pointsData && pointsData[activePointsTable] && Object.keys(pointsData[activePointsTable][0]).filter(key => key !== 'チーム名' && key !== '累計ポイント').length > 6 && (
												<button
													onClick={() => setShowAllColumns(!showAllColumns)}
													className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
													title={showAllColumns ? '只显示最近6列' : '显示所有历史数据'}
												>
													<span>{showAllColumns ? '收起历史' : '展开历史'}</span>
													<svg className={`w-3 h-3 transition-transform ${showAllColumns ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
													</svg>
												</button>
											)}
										</div>

										{/* 积分表格 */}
										<div className="overflow-x-auto">
											<table className="w-full min-w-[800px] bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
												<thead className="bg-indigo-50 dark:bg-slate-700">
													<tr>
														<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 sticky left-0 bg-indigo-50 dark:bg-slate-700 z-10">队伍</th>
														<th className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">累计得分</th>
														{processedTableData.columns.map(key => (
															<th key={key} className="py-3 px-4 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[80px]">
																{key}
															</th>
														))}
													</tr>
												</thead>
												<tbody className="divide-y divide-gray-200 dark:divide-slate-700">
													{processedTableData.rows.map((row) => (
														<PointsTableRow key={row.key} row={row} />
													))}
												</tbody>
											</table>
										</div>
									</div>
								)}
							</ModuleContainer>
						</div>
					</div>
				)}

				{/* 选手排名 */}
				<ModuleContainer title="选手排行榜" description="按不同技术指标的选手排名">
					{playerStatsLoading ? (
						<div className="text-center py-4 text-slate-600 dark:text-slate-400">加载中...</div>
					) : !playerRankings ? (
						<div className="text-center py-4 text-slate-600 dark:text-slate-400">暂无数据</div>
					) : (
						<>
							<div className="mb-4 border-b border-gray-200 dark:border-slate-700">
								<div className="flex flex-wrap justify-between items-center gap-2 mb-2">
									<div className="flex flex-wrap gap-1">
										{Object.entries(rankingConfigs).map(([key, config]) => (
											<button
												key={key}
												onClick={() => setActiveRanking(key)}
												className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeRanking === key
														? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 border-b-0'
														: 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
													}`}
											>
												{config.label}
											</button>
										))}
									</div>
									<button
										onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
										className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
										title={sortDirection === "desc" ? "降序排列" : "升序排列"}
									>
										<svg className={`w-3 h-3 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
										{sortDirection === "desc" ? "降序" : "升序"}
									</button>
								</div>
							</div>

							<div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
								<table className="w-full">
									<thead className="bg-indigo-50 dark:bg-slate-700">
										<tr>
											<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">排名</th>
											<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">选手</th>
											<th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">所属队伍</th>
											<th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
												{rankingConfigs[activeRanking]?.label || activeRanking}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200 dark:divide-slate-700">
										{playerRankings[activeRanking]
											.slice(0, showAllPlayers ? undefined : 10)
											.map((player) => (
												<tr
													key={`${player.team_name}-${player.player_name}`}
													className="hover:bg-gray-50 dark:hover:bg-slate-800/60 cursor-pointer"
													onClick={() => navigate(`/players/${player.player_name}`)}
												>
													<td className="py-3 px-4 text-sm font-medium">
														<span className="inline-block w-6 h-6 rounded-full flex items-center justify-center text-black text-xs mr-1"
															style={{
																backgroundColor: player.rank <= 3 ? (
																	player.rank === 1 ? '#f59e0b' :
																		player.rank === 2 ? '#94a3b8' :
																			'#d97706'
																) : '#e5e7eb'
															}}>
															{player.displayRank}
														</span>
													</td>
													<td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">{player.player_name}</td>
													<td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{player.team_name}</td>
													<td className={`py-3 px-4 text-right text-sm font-medium ${rankingConfigs[activeRanking]?.format === "score"
															? player.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
															: 'text-slate-900 dark:text-white'
														}`}>
														{(() => {
															const config = rankingConfigs[activeRanking];
															switch (config?.format) {
																case 'percentage':
																	return (player.value * 100).toFixed(1) + '%';
																case 'score':
																	return (player.value >= 0 ? '+' : '') + player.value.toFixed(2);
																default:
																	return player.value.toString();
															}
														})()}
													</td>
												</tr>
											))}
									</tbody>
								</table>

								{/* 展开/收起按钮 */}
								{playerRankings[activeRanking].length > 10 && (
									<div className="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
										<button
											onClick={() => setShowAllPlayers(!showAllPlayers)}
											className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
										>
											<span>{showAllPlayers ? '收起' : `展开全部 (${playerRankings[activeRanking].length}名选手)`}</span>
											<svg className={`w-4 h-4 transition-transform ${showAllPlayers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
											</svg>
										</button>
									</div>
								)}
							</div>
						</>
					)}
				</ModuleContainer>
			</main>
		</>
	);
}
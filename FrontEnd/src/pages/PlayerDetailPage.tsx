import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HomePageHeader, ModuleContainer } from '../components/homePageComp';
import axios from 'axios';
import { useMLeague, type PlayerStat } from '../contexts/MLeagueContext';

const API_BASE_URL = 'http://localhost:8000/api';

// 定义选手类型接口
interface Player {
	name: string;
	team: string;
	teamLogo: string;
	avatar: string;
	season: string;
	stats: PlayerStat;
	isEmpty?: boolean; //标记空数据选手
}

// 格式化数值显示
const formatValue = (value: number | null | undefined, suffix: string = ''): string => {
	if (value === null || value === undefined) return '--';
	if (typeof value === 'number') {
		if (suffix === '%') {
			return (value * 100).toFixed(1) + suffix;
		}
		return value.toFixed(2) + suffix;
	}
	return '--';
};

// 标准化名称（去除空格）
const normalizeName = (name: string): string => {
	return name.replace(/\s+/g, '').trim();
};

// 选手详细数据
// const ALL_PLAYERS: Omit<Player, 'isEmpty'>[] = [
// 	{
// 		id: 101,
// 		name: "風林火山-选手一",
// 		team: "風林火山",
// 		teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
// 		avatar: "https://placehold.co/120x120/6366f1/ffffff?text=風一",
// 		birthDate: "1985-03-15",
// 		age: 40,
// 		debutYear: 2008,
// 		position: "主将",
// 		signatureStyle: "进攻型",
// 		careerStats: {
// 			总场次: 320,
// 			胜场数: 186,
// 			胜率: "58.1%",
// 			总得分: 2856.3,
// 			平均得点: 8.93
// 		},
// 		seasonStats: {
// 			出场次数: 40,
// 			平均得点: 12.5,
// 			满贯率: 18.3,
// 			立直率: 25.7,
// 			和牌率: 32.4,
// 			放铳率: 10.2,
// 			流局率: 16.8,
// 			役满次数: 3,
// 			最大连庄数: 5
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-25", opponent: "Pirates", score: "+18.7", result: "胜利" },
// 			{ date: "2025-11-23", opponent: "AGAINST", score: "+24.3", result: "胜利" },
// 			{ date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+12.5", result: "胜利" },
// 			{ date: "2025-11-19", opponent: "ROYAL", score: "+8.9", result: "胜利" },
// 			{ date: "2025-11-17", opponent: "e-MA", score: "-4.2", result: "失败" }
// 		],
// 		strengths: ["进攻能力强", "立直判断精准", "满贯以上手役概率高", "终局处理优秀"],
// 		weaknesses: ["防守相对薄弱", "流局时表现一般", "对特殊役种把握不足"]
// 	},
// 	{
// 		id: 102,
// 		name: "風林火山-选手二",
// 		team: "風林火山",
// 		teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
// 		avatar: "https://placehold.co/120x120/10b981/ffffff?text=風二",
// 		birthDate: "1988-07-22",
// 		age: 37,
// 		debutYear: 2010,
// 		position: "副将",
// 		signatureStyle: "均衡型",
// 		careerStats: {
// 			总场次: 286,
// 			胜场数: 154,
// 			胜率: "53.8%",
// 			总得分: 1987.6,
// 			平均得点: 6.95
// 		},
// 		seasonStats: {
// 			出场次数: 38,
// 			平均得点: 8.2,
// 			满贯率: 15.6,
// 			立直率: 22.1,
// 			和牌率: 29.7,
// 			放铳率: 11.5,
// 			流局率: 17.3,
// 			役满次数: 2,
// 			最大连庄数: 4
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-25", opponent: "Pirates", score: "+9.3", result: "胜利" },
// 			{ date: "2025-11-23", opponent: "AGAINST", score: "+15.7", result: "胜利" },
// 			{ date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+6.8", result: "胜利" },
// 			{ date: "2025-11-19", opponent: "ROYAL", score: "-2.1", result: "胜利" },
// 			{ date: "2025-11-17", opponent: "e-MA", score: "+11.4", result: "失败" }
// 		],
// 		strengths: ["攻守均衡", "判断稳定", "心理素质好", "团队配合优秀"],
// 		weaknesses: ["缺乏爆发力", "关键时刻决策偏保守", "稀有役种敏感度一般"]
// 	},
// 	{
// 		id: 103,
// 		name: "風林火山-选手三",
// 		team: "風林火山",
// 		teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
// 		avatar: "https://placehold.co/120x120/8b5cf6/ffffff?text=風三",
// 		birthDate: "1992-11-30",
// 		age: 33,
// 		debutYear: 2014,
// 		position: "先锋",
// 		signatureStyle: "防守型",
// 		careerStats: {
// 			总场次: 245,
// 			胜场数: 128,
// 			胜率: "52.2%",
// 			总得分: 1456.8,
// 			平均得点: 5.95
// 		},
// 		seasonStats: {
// 			出场次数: 36,
// 			平均得点: 5.7,
// 			满贯率: 14.2,
// 			立直率: 19.8,
// 			和牌率: 26.3,
// 			放铳率: 9.7,
// 			流局率: 18.2,
// 			役满次数: 1,
// 			最大连庄数: 3
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-25", opponent: "Pirates", score: "+5.6", result: "胜利" },
// 			{ date: "2025-11-23", opponent: "AGAINST", score: "+8.9", result: "胜利" },
// 			{ date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "+3.2", result: "胜利" },
// 			{ date: "2025-11-19", opponent: "ROYAL", score: "+7.4", result: "胜利" },
// 			{ date: "2025-11-17", opponent: "e-MA", score: "-1.8", result: "失败" }
// 		],
// 		strengths: ["防守稳固", "流局处理优秀", "读牌能力强", "心态稳定"],
// 		weaknesses: ["进攻欲望不足", "满贯以上手役较少", "立直时机把握一般"]
// 	},
// 	{
// 		id: 104,
// 		name: "風林火山-选手四",
// 		team: "風林火山",
// 		teamLogo: "https://placehold.co/40x40/f59e0b/ffffff?text=風",
// 		avatar: "https://placehold.co/120x120/ec4899/ffffff?text=風四",
// 		birthDate: "1995-05-18",
// 		age: 30,
// 		debutYear: 2018,
// 		position: "副将",
// 		signatureStyle: "技术型",
// 		careerStats: {
// 			总场次: 198,
// 			胜场数: 98,
// 			胜率: "49.5%",
// 			总得分: 876.3,
// 			平均得点: 4.43
// 		},
// 		seasonStats: {
// 			出场次数: 34,
// 			平均得点: -2.1,
// 			满贯率: 12.8,
// 			立直率: 17.5,
// 			和牌率: 23.1,
// 			放铳率: 11.8,
// 			流局率: 19.5,
// 			役满次数: 0,
// 			最大连庄数: 2
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-25", opponent: "Pirates", score: "-3.2", result: "胜利" },
// 			{ date: "2025-11-23", opponent: "AGAINST", score: "+2.1", result: "胜利" },
// 			{ date: "2025-11-21", opponent: "麻雀格闘倶楽部", score: "-1.5", result: "胜利" },
// 			{ date: "2025-11-19", opponent: "ROYAL", score: "+4.2", result: "胜利" },
// 			{ date: "2025-11-17", opponent: "e-MA", score: "-8.7", result: "失败" }
// 		],
// 		strengths: ["技术全面", "细节处理到位", "团队配合默契", "学习能力强"],
// 		weaknesses: ["大赛经验不足", "关键局表现不稳定", "平均得点偏低"]
// 	},

// 	{
// 		id: 201,
// 		name: "麻雀格闘倶楽部-选手一",
// 		team: "麻雀格闘倶楽部",
// 		teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
// 		avatar: "https://placehold.co/120x120/6366f1/ffffff?text=格一",
// 		birthDate: "1983-09-07",
// 		age: 42,
// 		debutYear: 2006,
// 		position: "主将",
// 		signatureStyle: "进攻型",
// 		careerStats: {
// 			总场次: 356,
// 			胜场数: 201,
// 			胜率: "56.5%",
// 			总得分: 3124.7,
// 			平均得点: 8.78
// 		},
// 		seasonStats: {
// 			出场次数: 40,
// 			平均得点: 10.3,
// 			满贯率: 16.7,
// 			立直率: 23.4,
// 			和牌率: 30.2,
// 			放铳率: 11.5,
// 			流局率: 17.3,
// 			役满次数: 4,
// 			最大连庄数: 6
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-24", opponent: "ドリブンズ", score: "+16.8", result: "胜利" },
// 			{ date: "2025-11-22", opponent: "ROYAL", score: "+12.3", result: "胜利" },
// 			{ date: "2025-11-20", opponent: "e-MA", score: "+8.7", result: "胜利" },
// 			{ date: "2025-11-18", opponent: "Pirates", score: "-3.2", result: "胜利" },
// 			{ date: "2025-11-16", opponent: "BEAST", score: "+5.6", result: "失败" }
// 		],
// 		strengths: ["进攻犀利", "满贯率高", "立直判断精准", "大赛经验丰富"],
// 		weaknesses: ["防守一般", "流局率偏高", "关键时刻容易急躁"]
// 	},
// 	{
// 		id: 202,
// 		name: "麻雀格闘倶楽部-选手二",
// 		team: "麻雀格闘倶楽部",
// 		teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
// 		avatar: "https://placehold.co/120x120/10b981/ffffff?text=格二",
// 		birthDate: "1987-04-23",
// 		age: 38,
// 		debutYear: 2009,
// 		position: "副将",
// 		signatureStyle: "均衡型",
// 		careerStats: {
// 			总场次: 302,
// 			胜场数: 162,
// 			胜率: "53.6%",
// 			总得分: 2156.9,
// 			平均得点: 7.14
// 		},
// 		seasonStats: {
// 			出场次数: 39,
// 			平均得点: 7.8,
// 			满贯率: 15.2,
// 			立直率: 21.3,
// 			和牌率: 27.5,
// 			放铳率: 10.8,
// 			流局率: 16.5,
// 			役满次数: 2,
// 			最大连庄数: 4
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-24", opponent: "ドリブンズ", score: "+9.5", result: "胜利" },
// 			{ date: "2025-11-22", opponent: "ROYAL", score: "+7.2", result: "胜利" },
// 			{ date: "2025-11-20", opponent: "e-MA", score: "+4.3", result: "胜利" },
// 			{ date: "2025-11-18", opponent: "Pirates", score: "+2.1", result: "胜利" },
// 			{ date: "2025-11-16", opponent: "BEAST", score: "-1.8", result: "失败" }
// 		],
// 		strengths: ["攻守平衡", "发挥稳定", "团队配合好", "心态成熟"],
// 		weaknesses: ["缺乏亮点", "关键局表现平平", "创新不足"]
// 	},
// 	{
// 		id: 203,
// 		name: "麻雀格闘倶楽部-选手三",
// 		team: "麻雀格闘倶楽部",
// 		teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
// 		avatar: "https://placehold.co/120x120/8b5cf6/ffffff?text=格三",
// 		birthDate: "1990-08-15",
// 		age: 35,
// 		debutYear: 2012,
// 		position: "先锋",
// 		signatureStyle: "技术型",
// 		careerStats: {
// 			总场次: 278,
// 			胜场数: 146,
// 			胜率: "52.5%",
// 			总得分: 1789.3,
// 			平均得点: 6.44
// 		},
// 		seasonStats: {
// 			出场次数: 37,
// 			平均得点: 4.2,
// 			满贯率: 13.5,
// 			立直率: 18.9,
// 			和牌率: 25.1,
// 			放铳率: 10.2,
// 			流局率: 18.7,
// 			役满次数: 1,
// 			最大连庄数: 3
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-24", opponent: "ドリブンズ", score: "+3.7", result: "胜利" },
// 			{ date: "2025-11-22", opponent: "ROYAL", score: "+5.4", result: "胜利" },
// 			{ date: "2025-11-20", opponent: "e-MA", score: "-1.2", result: "胜利" },
// 			{ date: "2025-11-18", opponent: "Pirates", score: "+3.6", result: "胜利" },
// 			{ date: "2025-11-16", opponent: "BEAST", score: "-4.5", result: "失败" }
// 		],
// 		strengths: ["技术细腻", "读牌准确", "防守稳固", "细节处理好"],
// 		weaknesses: ["进攻不足", "满贯率偏低", "节奏偏慢"]
// 	},
// 	{
// 		id: 204,
// 		name: "麻雀格闘倶楽部-选手四",
// 		team: "麻雀格闘倶楽部",
// 		teamLogo: "https://placehold.co/40x40/10b981/ffffff?text=格",
// 		avatar: "https://placehold.co/120x120/ec4899/ffffff?text=格四",
// 		birthDate: "1993-02-10",
// 		age: 32,
// 		debutYear: 2015,
// 		position: "副将",
// 		signatureStyle: "防守型",
// 		careerStats: {
// 			总场次: 235,
// 			胜场数: 118,
// 			胜率: "50.2%",
// 			总得分: 1245.6,
// 			平均得点: 5.30
// 		},
// 		seasonStats: {
// 			出场次数: 35,
// 			平均得点: -1.5,
// 			满贯率: 11.9,
// 			立直率: 16.2,
// 			和牌率: 22.8,
// 			放铳率: 9.5,
// 			流局率: 20.1,
// 			役满次数: 0,
// 			最大连庄数: 2
// 		},
// 		recentPerformances: [
// 			{ date: "2025-11-24", opponent: "ドリブンズ", score: "-2.3", result: "胜利" },
// 			{ date: "2025-11-22", opponent: "ROYAL", score: "+1.8", result: "胜利" },
// 			{ date: "2025-11-20", opponent: "e-MA", score: "-3.4", result: "胜利" },
// 			{ date: "2025-11-18", opponent: "Pirates", score: "+2.7", result: "胜利" },
// 			{ date: "2025-11-16", opponent: "BEAST", score: "-6.2", result: "失败" }
// 		],
// 		strengths: ["防守出色", "放铳率低", "心理素质好", "抗压能力强"],
// 		weaknesses: ["平均得点偏低", "进攻欲望弱", "立直率不高"]
// 	},

// 	// 其他队伍的选手数据...
// ];

export default function PlayerDetailPage() {
	const navigate = useNavigate();
	const { name } = useParams<{ name: string }>();
	const { schedule, getPlayerByName } = useMLeague();
	const [player, setPlayer] = useState<Player | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// 从赛程数据中查找选手的头像和队伍标志
	const playerImages = useMemo(() => {
		if (!name || schedule.length === 0) return { avatar: null, teamLogo: null };

		const normalizedName = normalizeName(name);
		let foundAvatar: string | null = null;
		let foundTeamLogo: string | null = null;

		// 遍历所有比赛，查找该选手
		for (const match of schedule) {
			if (!match.result || !match.result.rounds) continue;

			for (const round of match.result.rounds) {
				for (const playerResult of round.results) {
					// 匹配选手名称（支持标准化匹配）
					if (playerResult.player_name === name ||
						normalizeName(playerResult.player_name) === normalizedName) {
						// 找到选手头像
						if (playerResult.player_avatar && !foundAvatar) {
							foundAvatar = playerResult.player_avatar;
						}
						// 找到队伍标志
						if (playerResult.team_logo && !foundTeamLogo) {
							foundTeamLogo = playerResult.team_logo;
						}
						// 如果都找到了，可以提前退出
						if (foundAvatar && foundTeamLogo) {
							return { avatar: foundAvatar, teamLogo: foundTeamLogo };
						}
					}
				}
			}
		}

		return { avatar: foundAvatar, teamLogo: foundTeamLogo };
	}, [name, schedule]);

	useEffect(() => {
		const fetchPlayerData = async () => {
			if (!name) {
				setError('选手名不能为空');
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);

				// 编码选手名用于URL
				const encodedName = encodeURIComponent(name);
				const response = await axios.get<{
					success: boolean;
					data?: {
						player: PlayerStat;
						team: {
							team_id: string;
							team_name: string;
							season: string;
							last_updated: string;
						};
					};
					message?: string;
				}>(`${API_BASE_URL}/m-league/player-stats/${encodedName}/`);

				if (response.data.success && response.data.data) {
					const { player: playerStats, team } = response.data.data;

					// 尝试从赛程数据中获取队伍标志（如果队伍信息中有logo）
					let teamLogo = playerImages.teamLogo;
					if (!teamLogo) {
						// 从队伍信息中查找logo
						const playerInfo = getPlayerByName(playerStats.player_name);
						if (playerInfo) {
							// 从schedule中查找该队伍的logo
							for (const match of schedule) {
								const teamInfo = match.teams.find(t => t.name === team.team_name);
								if (teamInfo?.logo) {
									teamLogo = teamInfo.logo;
									break;
								}
							}
						}
					}

					// 如果没有找到，使用占位符
					if (!teamLogo) {
						teamLogo = `https://placehold.co/40x40/6366f1/ffffff?text=${team.team_name.charAt(0)}`;
					}

					setPlayer({
						name: playerStats.player_name,
						team: team.team_name,
						teamLogo: teamLogo,
						avatar: playerImages.avatar || `https://placehold.co/120x120/6366f1/ffffff?text=${playerStats.player_name.charAt(0)}`,
						season: team.season,
						stats: playerStats,
						isEmpty: false
					});
				} else {
					setError(response.data.message || '未找到该选手的数据');
					setPlayer({
						name: decodeURIComponent(name),
						team: '未知',
						teamLogo: playerImages.teamLogo || `https://placehold.co/40x40/eeeeee/999999?text=?`,
						avatar: playerImages.avatar || 'https://placehold.co/120x120/eeeeee/999999?text=暂无',
						season: '',
						stats: {} as PlayerStat,
						isEmpty: true
					});
				}
			} catch (err: any) {
				console.error('获取选手数据失败:', err);
				setError(err.response?.data?.message || err.message || '获取选手数据失败');
				setPlayer({
					name: decodeURIComponent(name),
					team: '未知',
					teamLogo: playerImages.teamLogo || `https://placehold.co/40x40/eeeeee/999999?text=?`,
					avatar: playerImages.avatar || 'https://placehold.co/120x120/eeeeee/999999?text=暂无',
					season: '',
					stats: {} as PlayerStat,
					isEmpty: true
				});
			} finally {
				setLoading(false);
			}
		};

		fetchPlayerData();
	}, [name, playerImages, schedule, getPlayerByName]);

	const handleGoBack = () => {
		navigate(-1);
	};

	if (loading) {
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

	if (!player) {
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
					<div className="text-center py-8">
						<p className="text-red-600 dark:text-red-400">{error || '未找到选手数据'}</p>
					</div>
				</main>
			</>
		);
	}

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
				{/* 选手基本信息 */}
				<div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
					<div className="flex flex-col md:flex-row items-center md:items-start gap-6">
						<div className="relative">
							<img src={player.avatar} alt={player.name} className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 dark:border-slate-700" />
							<div className="absolute -bottom-5 -right-5 bg-white dark:bg-slate-800 p-1.5 rounded-full border-2 border-gray-200 dark:border-slate-700 shadow-md">
								<img src={player.teamLogo} alt={player.team} className="w-14 h-14 rounded-full object-contain" />
							</div>
						</div>

						<div className="flex-1 text-center md:text-left">
							<h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{player.name}</h1>

							{/* 为空数据选手显示提示信息 */}
							{player.isEmpty === true && (
								<div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
									<p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
										<svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										该选手的详细信息暂未收录，我们将尽快更新
									</p>
								</div>
							)}

							<div className="flex items-center justify-center md:justify-start gap-2 mb-4">
								<span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-full">
									{player.team}
								</span>
								{player.season && (
									<span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full">
										{player.season}赛季
									</span>
								)}
							</div>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div className="text-center md:text-left">
									<p className="text-slate-500 dark:text-slate-400 mb-1">试合数</p>
									<p className="text-slate-900 dark:text-white">{player.stats.matches ?? '--'}</p>
								</div>
								<div className="text-center md:text-left">
									<p className="text-slate-500 dark:text-slate-400 mb-1">总局数</p>
									<p className="text-slate-900 dark:text-white">{player.stats.total_games ?? '--'}</p>
								</div>
								<div className="text-center md:text-left">
									<p className="text-slate-500 dark:text-slate-400 mb-1">积分</p>
									<p className={`text-sm font-medium ${player.stats.points === null || player.stats.points === undefined
											? "text-slate-500 dark:text-slate-400"
											: player.stats.points >= 0
												? "text-green-600 dark:text-green-400"
												: "text-red-500 dark:text-red-400"
										}`}>
										{player.stats.points !== null && player.stats.points !== undefined
											? (player.stats.points >= 0 ? '+' : '') + player.stats.points.toFixed(1)
											: '--'}
									</p>
								</div>
								<div className="text-center md:text-left">
									<p className="text-slate-500 dark:text-slate-400 mb-1">平均打点</p>
									<p className={`text-sm font-medium ${player.stats.average_score === null || player.stats.average_score === undefined
											? "text-slate-500 dark:text-slate-400"
											: "text-slate-900 dark:text-white"
										}`}>
										{formatValue(player.stats.average_score)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
					{/* 本赛季数据 */}
					<ModuleContainer title={`${player.season || '最新'}赛季数据`} className="lg:col-span-2">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							{[
								{ key: 'matches', label: '试合数', value: player.stats.matches, suffix: '' },
								{ key: 'total_games', label: '总局数', value: player.stats.total_games, suffix: '' },
								{ key: 'points', label: '积分', value: player.stats.points, suffix: '', isScore: true },
								{ key: 'average_rank', label: '平着', value: player.stats.average_rank, suffix: '' },
								{ key: 'first_place', label: '1位', value: player.stats.first_place, suffix: '' },
								{ key: 'second_place', label: '2位', value: player.stats.second_place, suffix: '' },
								{ key: 'third_place', label: '3位', value: player.stats.third_place, suffix: '' },
								{ key: 'fourth_place', label: '4位', value: player.stats.fourth_place, suffix: '' },
								{ key: 'top_rate', label: '第一率', value: player.stats.top_rate, suffix: '%' },
								{ key: 'renchan_rate', label: '连庄率', value: player.stats.renchan_rate, suffix: '%' },
								{ key: 'last_avoidance_rate', label: '拉四回避率', value: player.stats.last_avoidance_rate, suffix: '%' },
								{ key: 'best_score', label: '最佳得分', value: player.stats.best_score, suffix: '' },
								{ key: 'average_score', label: '平均打点', value: player.stats.average_score, suffix: '' },
								{ key: 'furo_rate', label: '副露率', value: player.stats.furo_rate, suffix: '%' },
								{ key: 'riichi_rate', label: '立直率', value: player.stats.riichi_rate, suffix: '%' },
								{ key: 'agari_rate', label: '和牌率', value: player.stats.agari_rate, suffix: '%' },
								{ key: 'houjuu_rate', label: '放铳率', value: player.stats.houjuu_rate, suffix: '%', isNegative: true },
								{ key: 'houjuu_average_score', label: '放铳平均打点', value: player.stats.houjuu_average_score, suffix: '' },
							].map((stat) => (
								<div key={stat.key} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
									<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
									<p className={`text-xl font-bold ${stat.value === null || stat.value === undefined
											? "text-slate-500 dark:text-slate-400"
											: stat.isScore
												? (stat.value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")
												: stat.isNegative
													? "text-red-500 dark:text-red-400"
													: "text-slate-900 dark:text-white"
										}`}>
										{stat.value !== null && stat.value !== undefined
											? (stat.isScore && stat.value >= 0 ? '+' : '') + formatValue(stat.value, stat.suffix)
											: '--'}
									</p>
								</div>
							))}
						</div>
					</ModuleContainer>

					{/* 关键指标 */}
					<ModuleContainer title="关键指标">
						<div className="space-y-4">
							{[
								{ key: 'points', label: '积分', value: player.stats.points, isScore: true },
								{ key: 'average_score', label: '平均打点', value: player.stats.average_score },
								{ key: 'riichi_rate', label: '立直率', value: player.stats.riichi_rate, isPercent: true },
								{ key: 'agari_rate', label: '和牌率', value: player.stats.agari_rate, isPercent: true },
								{ key: 'top_rate', label: '第一率', value: player.stats.top_rate, isPercent: true },
							].map((stat) => (
								<React.Fragment key={stat.key}>
									<div className="flex justify-between items-center">
										<span className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</span>
										<span className={`text-lg font-bold ${stat.value === null || stat.value === undefined
												? "text-slate-500 dark:text-slate-400"
												: stat.isScore
													? (stat.value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")
													: "text-slate-900 dark:text-white"
											}`}>
											{stat.value !== null && stat.value !== undefined
												? (stat.isScore && stat.value >= 0 ? '+' : '') + formatValue(stat.value, stat.isPercent ? '%' : '')
												: '--'}
										</span>
									</div>
									{stat.key !== 'points' && (
										<div className="w-full h-px bg-gray-200 dark:bg-slate-700"></div>
									)}
								</React.Fragment>
							))}
						</div>
					</ModuleContainer>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
						<p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
					</div>
				)}

				{/* 数据统计概览 */}
				<ModuleContainer title="数据统计概览">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
							<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">排名分布</p>
							<div className="space-y-2 mt-2">
								<div className="flex justify-between text-sm">
									<span>1位:</span>
									<span className="font-medium">{player.stats.first_place ?? '--'}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>2位:</span>
									<span className="font-medium">{player.stats.second_place ?? '--'}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>3位:</span>
									<span className="font-medium">{player.stats.third_place ?? '--'}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>4位:</span>
									<span className="font-medium">{player.stats.fourth_place ?? '--'}</span>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
							<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">技术指标</p>
							<div className="space-y-2 mt-2">
								<div className="flex justify-between text-sm">
									<span>立直率:</span>
									<span className="font-medium">{formatValue(player.stats.riichi_rate, '%')}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>和牌率:</span>
									<span className="font-medium">{formatValue(player.stats.agari_rate, '%')}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>副露率:</span>
									<span className="font-medium">{formatValue(player.stats.furo_rate, '%')}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>放铳率:</span>
									<span className="font-medium text-red-500">{formatValue(player.stats.houjuu_rate, '%')}</span>
								</div>
							</div>
						</div>

						<div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700">
							<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">得分相关</p>
							<div className="space-y-2 mt-2">
								<div className="flex justify-between text-sm">
									<span>平均打点:</span>
									<span className="font-medium">{formatValue(player.stats.average_score)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>最佳得分:</span>
									<span className="font-medium">{player.stats.best_score ?? '--'}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>放铳平均打点:</span>
									<span className="font-medium text-red-500">{formatValue(player.stats.houjuu_average_score)}</span>
								</div>
								<div className="flex justify-between text-sm">
									<span>平着:</span>
									<span className="font-medium">{formatValue(player.stats.average_rank)}</span>
								</div>
							</div>
						</div>
					</div>
				</ModuleContainer>
			</main>
		</>
	);
}
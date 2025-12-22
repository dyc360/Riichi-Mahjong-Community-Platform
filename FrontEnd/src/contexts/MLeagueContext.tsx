import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface MLeagueRanking {
	id: number;
	rank: number;
	team_name: string;
	score: string;
	season: string;
	last_updated: string;
}

export interface PlayerStat {
	player_name: string;
	matches: number | null;
	total_games: number | null;
	points: number | null;
	average_rank: number | null;
	first_place: number | null;
	second_place: number | null;
	third_place: number | null;
	fourth_place: number | null;
	top_rate: number | null;
	renchan_rate: number | null;
	last_avoidance_rate: number | null;
	best_score: number | null;
	average_score: number | null;
	furo_rate: number | null;
	riichi_rate: number | null;
	agari_rate: number | null;
	houjuu_rate: number | null;
	houjuu_average_score: number | null;
}

export interface TeamPlayerStats {
	team_id: string;
	team_name: string;
	players: PlayerStat[];
	last_updated: string;
}

export interface MatchResultPlayer {
	rank: number;
	player_name: string;
	score: number | null;
	score_text: string;
	team_name: string | null;
	team_logo: string | null;
	player_avatar: string | null;
}

export interface MatchResultRound {
	round_name: string;
	round_number: number;
	results: MatchResultPlayer[];
}

export interface MatchResult {
	date?: string;
	rounds: MatchResultRound[];
}

export interface MatchTeam {
	name: string;
	logo: string;
}

export interface TeamPointsData {
	チーム名: string;
	累計ポイント: number | null;
	[key: string]: string | number | null;
}

export interface PointsData {
	total_points: TeamPointsData[];  // 综合积分（Regular+Semifinal+Final）
	regular_points: TeamPointsData[];  // Regular积分
	postseason_points: TeamPointsData[];  // Post-season积分（Semifinal+Final）
	semifinal_points: TeamPointsData[];  // Semifinal积分
	final_points: TeamPointsData[];  // Final积分
}

export interface MatchSchedule {
	match_id: string;
	date: string;
	day: number;
	month: number;
	year: number;
	day_week: string;
	teams: MatchTeam[];
	status: 'finished' | 'upcoming';
	result: MatchResult | null;
	last_updated: string;
}

// 队伍信息（从playerStats中提取）
export interface Team {
	name: string;
	logo?: string;
	players: PlayerStat[];
}

// 选手信息（增强版，包含队伍信息）
export interface Player {
	name: string;
	teamName: string;
	stats: PlayerStat;
}

interface MLeagueContextType {
	// 原始数据
	rankings: MLeagueRanking[];
	playerStats: TeamPlayerStats[];
	schedule: MatchSchedule[];
	pointsData: PointsData | null;

	// 结构化数据（从原始数据转换而来，便于查询）
	teams: Team[];
	players: Player[];
	teamsMap: Map<string, Team>; // 队伍名称 -> 队伍信息
	playersMap: Map<string, Player>; // 选手名称（标准化后）-> 选手信息
	scheduleMap: Map<string, MatchSchedule>; // 日期+队伍 -> 比赛信息

	// 加载状态
	loading: boolean;
	playerStatsLoading: boolean;
	scheduleLoading: boolean;
	pointsDataLoading: boolean;
	error: string | null;
	playerStatsError: string | null;
	scheduleError: string | null;
	pointsDataError: string | null;
	lastUpdated: number | null;
	playerStatsLastUpdated: number | null;
	scheduleLastUpdated: number | null;
	pointsDataLastUpdated: number | null;
	
	// 方法
	refreshRankings: () => Promise<void>;
	refreshPlayerStats: () => Promise<void>;
	fetchSchedule: (year?: number, month?: number, useCache?: boolean, accumulate?: boolean) => Promise<void>;
	fetchPointsData: () => Promise<void>;
	refreshPointsData: () => Promise<void>;
	clearSchedule: () => void;
	
	// 查询方法
	getTeamByName: (teamName: string) => Team | undefined;
	getPlayerByName: (playerName: string) => Player | undefined;
	getMatchByDateAndTeams: (date: string, teams: string[]) => MatchSchedule | undefined;
	getMatchesByDate: (date: string) => MatchSchedule[];
	getMatchesByYearMonth: (year: number, month: number) => MatchSchedule[];
	getRecentMatches: (limit?: number) => MatchSchedule[];
	getUpcomingMatches: (limit?: number) => MatchSchedule[];
}

const MLeagueContext = createContext<MLeagueContextType | undefined>(undefined);

const CACHE_KEY = 'mleague_rankings_cache';
const PLAYER_STATS_CACHE_KEY = 'mleague_player_stats_cache';
const SCHEDULE_CACHE_KEY = 'mleague_schedule_cache';
const POINTS_DATA_CACHE_KEY = 'mleague_points_data_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CachedData {
	rankings: MLeagueRanking[];
	timestamp: number;
}

interface PlayerStatsCachedData {
	playerStats: TeamPlayerStats[];
	timestamp: number;
}

interface ScheduleCachedData {
	schedule: MatchSchedule[];
	year: number;
	month: number;
	timestamp: number;
}

interface PointsDataCachedData {
	pointsData: PointsData;
	timestamp: number;
}

export function MLeagueProvider({ children }: { children: ReactNode }) {
	const [rankings, setRankings] = useState<MLeagueRanking[]>([]);
	const [playerStats, setPlayerStats] = useState<TeamPlayerStats[]>([]);
	const [schedule, setSchedule] = useState<MatchSchedule[]>([]);
	const [pointsData, setPointsData] = useState<PointsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
	const [scheduleLoading, setScheduleLoading] = useState(false);
	const [pointsDataLoading, setPointsDataLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [playerStatsError, setPlayerStatsError] = useState<string | null>(null);
	const [scheduleError, setScheduleError] = useState<string | null>(null);
	const [pointsDataError, setPointsDataError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<number | null>(null);
	const [playerStatsLastUpdated, setPlayerStatsLastUpdated] = useState<number | null>(null);
	const [scheduleLastUpdated, setScheduleLastUpdated] = useState<number | null>(null);
	const [pointsDataLastUpdated, setPointsDataLastUpdated] = useState<number | null>(null);

	// 标准化名称（去除空格）- 需要在useMemo之前定义
	const normalizeName = useCallback((name: string): string => {
		return name.replace(/\s+/g, '').trim();
	}, []);

	// 结构化数据（从原始数据转换）
	const teams = useMemo(() => {
		return playerStats.map(teamStat => ({
			name: teamStat.team_name,
			players: teamStat.players
		}));
	}, [playerStats]);
	
	const players = useMemo(() => {
		const playersList: Player[] = [];
		playerStats.forEach(teamStat => {
			teamStat.players.forEach(playerStat => {
				playersList.push({
					name: playerStat.player_name,
					teamName: teamStat.team_name,
					stats: playerStat
				});
			});
		});
		return playersList;
	}, [playerStats]);
	
	// 创建索引Map以便快速查询
	const teamsMap = useMemo(() => {
		const map = new Map<string, Team>();
		teams.forEach(team => {
			map.set(team.name, team);
			// 也添加标准化后的名称作为key
			map.set(normalizeName(team.name), team);
		});
		return map;
	}, [teams, normalizeName]);
	
	const playersMap = useMemo(() => {
		const map = new Map<string, Player>();
		players.forEach(player => {
			// 使用原始名称和标准化名称作为key
			map.set(player.name, player);
			map.set(normalizeName(player.name), player);
		});
		return map;
	}, [players, normalizeName]);
	
	const scheduleMap = useMemo(() => {
		const map = new Map<string, MatchSchedule>();
		schedule.forEach(match => {
			// 使用日期+队伍名称作为key
			const teamsKey = match.teams.map(t => t.name).sort().join('|');
			const key = `${match.date}|${teamsKey}`;
			map.set(key, match);
		});
		return map;
	}, [schedule]);

	const fetchRankings = useCallback(async (useCache: boolean = true) => {
		try {
			// 尝试从缓存获取
			if (useCache) {
				const cached = localStorage.getItem(CACHE_KEY);
				if (cached) {
					const { rankings: cachedRankings, timestamp }: CachedData = JSON.parse(cached);
					const now = Date.now();

					if (now - timestamp < CACHE_DURATION) {
						setRankings(cachedRankings);
						setLastUpdated(timestamp);
						setLoading(false);
						setError(null);
						return;
					}
				}
			}

			setLoading(true);
			setError(null);

			// 从后端API获取最新数据
			const response = await axios.get<{ success: boolean; data: any[]; count?: number; last_updated?: string }>(
				`${API_BASE_URL}/m-league/rankings/`
			);

			if (response.data.success && response.data.data) {
				// 为每条数据添加id字段（如果没有的话）
				const rankingsData: MLeagueRanking[] = response.data.data.map((item: any, index: number) => ({
					id: item.id || index + 1, // 如果没有id，使用索引+1
					rank: item.rank,
					team_name: item.team_name,
					score: item.score,
					season: item.season || '',
					last_updated: item.last_updated || new Date().toISOString()
				}));
				setRankings(rankingsData);
				setLastUpdated(Date.now());

				// 保存到缓存
				const cacheData: CachedData = {
					rankings: rankingsData,
					timestamp: Date.now()
				};
				localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
			} else {
				throw new Error('获取排名数据失败');
			}
		} catch (err: any) {
			console.error('获取M-League排名失败:', err);
			setError(err.response?.data?.message || err.message || '获取排名数据失败');

			// 尝试使用缓存数据（即使过期）
			const cached = localStorage.getItem(CACHE_KEY);
			if (cached) {
				try {
					const { rankings: cachedRankings, timestamp }: CachedData = JSON.parse(cached);
					setRankings(cachedRankings);
					// 即使使用过期缓存，也更新 lastUpdated 为缓存时间
					if (timestamp) {
						setLastUpdated(timestamp);
					}
				} catch (e) {
					console.warn('使用过期缓存失败:', e);
				}
			}
		} finally {
			setLoading(false);
		}
	}, []);

	const refreshRankings = useCallback(async () => {
		await fetchRankings(false);
	}, [fetchRankings]);

	const fetchPlayerStats = useCallback(async (useCache: boolean = true) => {
		try {
			// 尝试从缓存获取
			if (useCache) {
				const cached = localStorage.getItem(PLAYER_STATS_CACHE_KEY);
				if (cached) {
					const { playerStats: cachedStats, timestamp }: PlayerStatsCachedData = JSON.parse(cached);
					const now = Date.now();

					if (now - timestamp < CACHE_DURATION) {
						setPlayerStats(cachedStats);
						setPlayerStatsLastUpdated(timestamp);
						setPlayerStatsLoading(false);
						setPlayerStatsError(null);
						return;
					}
				}
			}

			setPlayerStatsLoading(true);
			setPlayerStatsError(null);

			// 从后端API获取最新数据
			const response = await axios.get<{ success: boolean; data: TeamPlayerStats[]; count?: number; last_updated?: string }>(
				`${API_BASE_URL}/m-league/player-stats/`
			);

			if (response.data.success && response.data.data) {
				setPlayerStats(response.data.data);
				setPlayerStatsLastUpdated(Date.now());

				// 保存到缓存
				const cacheData: PlayerStatsCachedData = {
					playerStats: response.data.data,
					timestamp: Date.now()
				};
				localStorage.setItem(PLAYER_STATS_CACHE_KEY, JSON.stringify(cacheData));
			} else {
				throw new Error('获取选手统计数据失败');
			}
		} catch (err: any) {
			console.error('获取M-League选手统计失败:', err);
			setPlayerStatsError(err.response?.data?.message || err.message || '获取选手统计数据失败');

			// 尝试使用缓存数据（即使过期）
			const cached = localStorage.getItem(PLAYER_STATS_CACHE_KEY);
			if (cached) {
				try {
					const { playerStats: cachedStats, timestamp }: PlayerStatsCachedData = JSON.parse(cached);
					setPlayerStats(cachedStats);
					// 即使使用过期缓存，也更新 playerStatsLastUpdated 为缓存时间
					if (timestamp) {
						setPlayerStatsLastUpdated(timestamp);
					}
				} catch (e) {
					console.warn('使用过期缓存失败:', e);
				}
			}
		} finally {
			setPlayerStatsLoading(false);
		}
	}, []);

	const refreshPlayerStats = useCallback(async () => {
		await fetchPlayerStats(false);
	}, [fetchPlayerStats]);

	const fetchPointsData = useCallback(async (useCache: boolean = true) => {
		try {
			// 检查缓存
			if (useCache) {
				const cached = localStorage.getItem(POINTS_DATA_CACHE_KEY);
				if (cached) {
					try {
						const { pointsData: cachedPointsData, timestamp }: PointsDataCachedData = JSON.parse(cached);
						const now = Date.now();
						if (now - timestamp < CACHE_DURATION) {
							console.log('📋 使用积分数据缓存');
							setPointsData(cachedPointsData);
							setPointsDataLastUpdated(timestamp);
							return;
						}
					} catch (e) {
						console.warn('解析积分数据缓存失败:', e);
					}
				}
			}

			console.log('🔄 开始获取积分数据...');
			console.log('📡 API URL:', `${API_BASE_URL}/m-league/points/`);

			setPointsDataLoading(true);
			setPointsDataError(null);

			const response = await axios.get<{
				success: boolean;
				data: PointsData;
				message?: string;
			}>(`${API_BASE_URL}/m-league/points/`);

			console.log('✅ API响应状态:', response.status);
			console.log('📦 响应数据:', response.data);

			if (response.data.success) {
				console.log('✅ 数据获取成功，设置数据');
				const now = Date.now();
				setPointsData(response.data.data);
				setPointsDataLastUpdated(now);

				// 缓存数据
				const cacheData: PointsDataCachedData = {
					pointsData: response.data.data,
					timestamp: now
				};
				localStorage.setItem(POINTS_DATA_CACHE_KEY, JSON.stringify(cacheData));
				console.log('💾 积分数据已缓存');
			} else {
				console.log('❌ API返回失败:', response.data.message);
				setPointsDataError(response.data.message || '获取积分数据失败');
			}
		} catch (error) {
			console.error('❌ 获取积分数据失败:', error);

			if (axios.isAxiosError(error)) {
				console.error('🔍 Axios错误详情:');
				console.error('- 状态码:', error.response?.status);
				console.error('- 响应数据:', error.response?.data);
				console.error('- 请求URL:', error.config?.url);
			}

			const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: '获取积分数据失败，请稍后重试';
			setPointsDataError(errorMessage);
		} finally {
			console.log('🏁 设置加载状态为false');
			setPointsDataLoading(false);
		}
	}, []);

	const refreshPointsData = useCallback(async () => {
		await fetchPointsData(false); // 强制刷新，不使用缓存
	}, [fetchPointsData]);

	const clearSchedule = useCallback(() => {
		setSchedule([]);
		setScheduleLastUpdated(null);
		setScheduleError(null);
	}, []);

	const fetchSchedule = useCallback(async (year?: number, month?: number, useCache: boolean = true, accumulate: boolean = false) => {
		try {
			const now = new Date();
			const currentYear = now.getFullYear();
			
			// 判断是否为历史赛季查询（year存在，month为undefined，且year < 当前年份）
			const isHistoricalSeasonQuery = year !== undefined && month === undefined && year < currentYear;
			
			// 如果没有指定年份，使用当前年份
			if (!year) {
				year = currentYear;
			}
			
			// 如果不是历史赛季查询且没有指定月份，使用当前月份
			if (!isHistoricalSeasonQuery && !month) {
				month = now.getMonth() + 1;
			}

			// 构建缓存key（历史赛季使用不同的key）
			const cacheKey = isHistoricalSeasonQuery 
				? `${SCHEDULE_CACHE_KEY}_${year}_season`
				: `${SCHEDULE_CACHE_KEY}_${year}_${month}`;

			// 尝试从缓存获取
			if (useCache) {
				const cached = localStorage.getItem(cacheKey);
				if (cached) {
					const { schedule: cachedSchedule, timestamp }: ScheduleCachedData = JSON.parse(cached);
					const now = Date.now();

					if (now - timestamp < CACHE_DURATION) {
						if (accumulate) {
							setSchedule(prevSchedule => {
								// 生成唯一标识符的函数
								const getMatchKey = (match: MatchSchedule): string => {
									if (match.match_id && match.match_id.trim() !== '') {
										return `${match.date}-${match.match_id}`;
									}
									const teamNames = match.teams.map((t: { name: string }) => t.name).sort().join('-');
									return `${match.date}-${teamNames}`;
								};
								
								// 合并缓存数据，避免重复
								const existingIds = new Set(prevSchedule.map(getMatchKey));
								const newData = cachedSchedule.filter(match => {
									const matchKey = getMatchKey(match);
									return !existingIds.has(matchKey);
								});
								return [...prevSchedule, ...newData];
							});
						} else {
							setSchedule(cachedSchedule);
						}
						setScheduleLastUpdated(timestamp);
						setScheduleLoading(false);
						setScheduleError(null);
						return;
					}
				}
			}

			setScheduleLoading(true);
			setScheduleError(null);

			// 构建API请求参数
			const params: { year: number; month?: number } = { year };
			// 只有非历史赛季查询才添加month参数
			if (!isHistoricalSeasonQuery && month !== undefined) {
				params.month = month;
			}

			// 从后端API获取最新数据
			const response = await axios.get<{ success: boolean; data: MatchSchedule[]; count?: number; last_updated?: string }>(
				`${API_BASE_URL}/m-league/schedule/`,
				{ params }
			);

			if (response.data.success && response.data.data) {
				if (accumulate) {
					setSchedule(prevSchedule => {
						// 生成唯一标识符的函数
						const getMatchKey = (match: MatchSchedule): string => {
							// 如果match_id存在且不为空，使用match_id
							if (match.match_id && match.match_id.trim() !== '') {
								return `${match.date}-${match.match_id}`;
							}
							// 否则使用日期+队伍名称（排序后）
							const teamNames = match.teams.map((t: { name: string }) => t.name).sort().join('-');
							return `${match.date}-${teamNames}`;
						};
						
						// 合并数据，避免重复
						const existingIds = new Set(prevSchedule.map(getMatchKey));
						const newData = response.data.data.filter(match => {
							const matchKey = getMatchKey(match);
							return !existingIds.has(matchKey);
						});
						
						return [...prevSchedule, ...newData];
					});
				} else {
					setSchedule(response.data.data);
				}
				setScheduleLastUpdated(Date.now());

				// 保存到缓存（使用之前构建的cacheKey）
				const cacheData: ScheduleCachedData = {
					schedule: response.data.data,
					year,
					month: month || 0, // 历史赛季时month为0表示整个赛季
					timestamp: Date.now()
				};
				localStorage.setItem(cacheKey, JSON.stringify(cacheData));
			} else {
				throw new Error('获取比赛日程数据失败');
			}
		} catch (err: any) {
			console.error('获取M-League比赛日程失败:', err);
			setScheduleError(err.response?.data?.message || err.message || '获取比赛日程数据失败');

			// 尝试使用缓存数据（即使过期）
			// 重新构建cacheKey（因为year和month可能已被修改）
			const currentYear = new Date().getFullYear();
			const isHistorical = year !== undefined && month === undefined && year < currentYear;
			const fallbackCacheKey = isHistorical 
				? `${SCHEDULE_CACHE_KEY}_${year}_season`
				: `${SCHEDULE_CACHE_KEY}_${year}_${month || new Date().getMonth() + 1}`;
			const cached = localStorage.getItem(fallbackCacheKey);
			if (cached) {
				try {
					const { schedule: cachedSchedule, timestamp }: ScheduleCachedData = JSON.parse(cached);
					setSchedule(cachedSchedule);
					if (timestamp) {
						setScheduleLastUpdated(timestamp);
					}
				} catch (e) {
					console.warn('使用过期缓存失败:', e);
				}
			}
		} finally {
			setScheduleLoading(false);
		}
	}, []);

	// 初始化加载
	useEffect(() => {
		fetchRankings(true);
		fetchPlayerStats(true);
		fetchPointsData(true);
		// 默认加载当前月份的日程
		const now = new Date();
		fetchSchedule(now.getFullYear(), now.getMonth() + 1, true);
	}, [fetchRankings, fetchPlayerStats, fetchPointsData, fetchSchedule]);

	// 定期检查缓存是否过期，如果过期则自动刷新
	// 同时设置每天0:10自动更新数据
	useEffect(() => {
		const checkAndRefreshCache = () => {
			// 检查排名数据缓存
			const cached = localStorage.getItem(CACHE_KEY);
			if (cached) {
				try {
					const { timestamp }: CachedData = JSON.parse(cached);
					const now = Date.now();
					// 如果缓存过期，自动刷新
					if (now - timestamp >= CACHE_DURATION) {
						fetchRankings(false);
					}
				} catch (e) {
					console.warn('检查缓存失败:', e);
				}
			}

			// 检查选手统计数据缓存
			const cachedStats = localStorage.getItem(PLAYER_STATS_CACHE_KEY);
			if (cachedStats) {
				try {
					const { timestamp }: PlayerStatsCachedData = JSON.parse(cachedStats);
					const now = Date.now();
					// 如果缓存过期，自动刷新
					if (now - timestamp >= CACHE_DURATION) {
						fetchPlayerStats(false);
					}
				} catch (e) {
					console.warn('检查缓存失败:', e);
				}
			}

			// 检查积分数据缓存
			const cachedPoints = localStorage.getItem(POINTS_DATA_CACHE_KEY);
			if (cachedPoints) {
				try {
					const { timestamp }: PointsDataCachedData = JSON.parse(cachedPoints);
					const now = Date.now();
					// 如果缓存过期，自动刷新
					if (now - timestamp >= CACHE_DURATION) {
						fetchPointsData(false);
					}
				} catch (e) {
					console.warn('检查积分数据缓存失败:', e);
				}
			}
		};

		// 检查是否到了每天0:10的更新时间
		const checkDailyUpdate = () => {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			
			// 检查是否在0:10-0:11之间（给1分钟的窗口期）
			if (hours === 0 && minutes >= 10 && minutes < 11) {
				// 检查上次每日更新的时间戳
				const lastDailyUpdateKey = 'mleague_last_daily_update';
				const lastDailyUpdate = localStorage.getItem(lastDailyUpdateKey);
				const today = now.toDateString();
				
				// 如果今天还没有更新过，则执行更新
				if (!lastDailyUpdate || lastDailyUpdate !== today) {
					console.log('🔄 执行每日0:10自动更新...');
					// 强制刷新所有数据
					fetchRankings(false);
					fetchPlayerStats(false);
					fetchPointsData(false);
					
					// 刷新当前赛季的赛程数据
					const currentYear = now.getFullYear();
					const currentMonth = now.getMonth() + 1;
					const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
					const seasonEndYear = seasonStartYear + 1;
					
					// 清除赛程缓存并重新加载当前赛季数据
					clearSchedule();
					
					// 根据当前月份决定加载哪些月份的数据
					if (currentMonth >= 9) {
						// 当前在赛季前半段（9-12月），加载9月到当前月份的数据
						for (let month = 9; month <= currentMonth; month++) {
							fetchSchedule(seasonStartYear, month, false, true);
						}
						// 也加载下一年的1-5月数据（未来比赛）
						for (let month = 1; month <= 5; month++) {
							fetchSchedule(seasonEndYear, month, false, true);
						}
					} else {
						// 当前在赛季后半段（1-5月），需要加载：
						// 1. 上一年的9-12月（已完成比赛）
						for (let month = 9; month <= 12; month++) {
							fetchSchedule(seasonStartYear, month, false, true);
						}
						// 2. 当前年的1月到当前月份
						for (let month = 1; month <= currentMonth; month++) {
							fetchSchedule(seasonEndYear, month, false, true);
						}
						// 3. 当前年剩余月份（未来比赛）
						for (let month = currentMonth + 1; month <= 5; month++) {
							fetchSchedule(seasonEndYear, month, false, true);
						}
					}
					
					// 更新最后更新日期
					localStorage.setItem(lastDailyUpdateKey, today);
				}
			}
		};

		// 立即检查一次
		checkAndRefreshCache();
		checkDailyUpdate();

		// 每30秒检查一次缓存是否过期
		const interval = setInterval(() => {
			checkAndRefreshCache();
			checkDailyUpdate();
		}, 30 * 1000);

		return () => clearInterval(interval);
	}, [fetchRankings, fetchPlayerStats, fetchPointsData, fetchSchedule, clearSchedule]);

	// 查询方法
	const getTeamByName = useCallback((teamName: string): Team | undefined => {
		return teamsMap.get(teamName) || teamsMap.get(normalizeName(teamName));
	}, [teamsMap]);
	
	const getPlayerByName = useCallback((playerName: string): Player | undefined => {
		return playersMap.get(playerName) || playersMap.get(normalizeName(playerName));
	}, [playersMap]);
	
	const getMatchByDateAndTeams = useCallback((date: string, teams: string[]): MatchSchedule | undefined => {
		const teamsKey = [...teams].sort().join('|');
		const key = `${date}|${teamsKey}`;
		return scheduleMap.get(key);
	}, [scheduleMap]);
	
	const getMatchesByDate = useCallback((date: string): MatchSchedule[] => {
		return schedule.filter(match => match.date === date);
	}, [schedule]);
	
	const getMatchesByYearMonth = useCallback((year: number, month: number): MatchSchedule[] => {
		return schedule.filter(match => match.year === year && match.month === month);
	}, [schedule]);
	
	const getRecentMatches = useCallback((limit: number = 5): MatchSchedule[] => {
		return schedule
			.filter(match => match.status === 'finished' && match.result)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.slice(0, limit);
	}, [schedule]);
	
	const getUpcomingMatches = useCallback((limit: number = 4): MatchSchedule[] => {
		return schedule
			.filter(match => match.status === 'upcoming')
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.slice(0, limit);
	}, [schedule]);

	const value: MLeagueContextType = useMemo(
		() => ({
			rankings,
			playerStats,
			schedule,
			pointsData,
			teams,
			players,
			teamsMap,
			playersMap,
			scheduleMap,
			loading,
			playerStatsLoading,
			scheduleLoading,
			pointsDataLoading,
			error,
			playerStatsError,
			scheduleError,
			pointsDataError,
			lastUpdated,
			playerStatsLastUpdated,
			scheduleLastUpdated,
			pointsDataLastUpdated,
			refreshRankings,
			refreshPlayerStats,
			fetchSchedule,
			fetchPointsData,
			refreshPointsData,
			clearSchedule,
			getTeamByName,
			getPlayerByName,
			getMatchByDateAndTeams,
			getMatchesByDate,
			getMatchesByYearMonth,
			getRecentMatches,
			getUpcomingMatches
		}),
		[rankings, playerStats, schedule, pointsData, teams, players, teamsMap, playersMap, scheduleMap, loading, playerStatsLoading, scheduleLoading, pointsDataLoading, error, playerStatsError, scheduleError, pointsDataError, lastUpdated, playerStatsLastUpdated, scheduleLastUpdated, pointsDataLastUpdated, refreshRankings, refreshPlayerStats, fetchSchedule, fetchPointsData, refreshPointsData, clearSchedule, getTeamByName, getPlayerByName, getMatchByDateAndTeams, getMatchesByDate, getMatchesByYearMonth, getRecentMatches, getUpcomingMatches]
	);

	return <MLeagueContext.Provider value={value}>{children}</MLeagueContext.Provider>;
}

export function useMLeague() {
	const context = useContext(MLeagueContext);
	if (context === undefined) {
		throw new Error('useMLeague must be used within a MLeagueProvider');
	}
	return context;
}


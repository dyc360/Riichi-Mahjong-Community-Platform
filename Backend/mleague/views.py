"""
API视图：提供数据查询接口（从数据库读取）和手动触发抓取接口
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import generics
from rest_framework.views import APIView
from django.conf import settings
from django.db.models import Q
from datetime import datetime
from .scraper import MLeagueOfficialScraper
from .tasks import (
    update_rankings_from_scraper, 
    update_schedule_from_scraper,
    update_player_stats_from_scraper,
    update_points_data_from_scraper,
    update_all_mleague_data,
    update_current_season_schedule
)
from .models import TeamRanking, Match, TeamPlayerStats, PointsData
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])  # 仅管理员可触发
def trigger_scrape_rankings(request):
    """
    手动触发最新排名数据抓取
    POST /api/mleague-scraper/trigger/rankings/
    """
    try:
        success = update_rankings_from_scraper()
        
        if success:
            return Response({
                'success': True,
                'message': '成功更新最新排名数据'
            })
        else:
            return Response({
                'success': False,
                'message': '更新排名数据失败，请查看日志'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"触发排名抓取失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_schedule(request):
    """
    手动触发赛程数据抓取
    POST /api/mleague-scraper/trigger/schedule/
    请求体参数:
    - year: 年份（可选）
    - month: 月份（可选）
    - current_season: bool, 如果为true，则抓取整个当前赛季的数据（忽略year和month）
    """
    try:
        current_season = request.data.get('current_season', False)
        
        if current_season:
            # 抓取整个当前赛季的数据
            success = update_current_season_schedule()
            return Response({
                'success': success,
                'message': '当前赛季赛程数据抓取完成' if success else '当前赛季赛程数据抓取失败'
            })
        
        year = request.data.get('year')
        month = request.data.get('month')
        
        # 转换为整数（如果提供）
        year = int(year) if year else None
        month = int(month) if month else None
        
        schedule_data = update_schedule_from_scraper(
            year=year,
            month=month
        )
        
        return Response({
            'success': True,
            'data': schedule_data,
            'count': len(schedule_data) if schedule_data else 0
        })
        
    except Exception as e:
        logger.error(f"触发赛程抓取失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_player_stats(request):
    """
    手动触发选手统计数据抓取
    POST /api/mleague-scraper/trigger/player-stats/
    """
    try:
        success = update_player_stats_from_scraper()
        
        if success:
            return Response({
                'success': True,
                'message': '成功更新选手统计数据'
            })
        else:
            return Response({
                'success': False,
                'message': '更新选手统计数据失败，请查看日志'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"触发选手统计抓取失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_points(request):
    """
    手动触发积分数据抓取
    POST /api/mleague-scraper/trigger/points/
    """
    try:
        success = update_points_data_from_scraper()
        
        if success:
            return Response({
                'success': True,
                'message': '成功更新积分数据'
            })
        else:
            return Response({
                'success': False,
                'message': '更新积分数据失败，请查看日志'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"触发积分数据抓取失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_all(request):
    """
    手动触发所有数据抓取
    POST /api/mleague-scraper/trigger/all/
    请求体可选参数:
    - include_historical: bool, 是否包含历史赛季赛程数据（默认true）
    """
    try:
        include_historical = request.data.get('include_historical', True)
        results = update_all_mleague_data(include_historical_schedule=include_historical)
        
        return Response({
            'success': True,
            'message': '数据抓取完成',
            'results': results
        })
            
    except Exception as e:
        logger.error(f"触发全部数据抓取失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeagueRankingView(generics.GenericAPIView):
    """
    获取M-League最新排名数据（从数据库读取）
    GET /api/m-league/rankings/?season=2025赛季
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取查询参数
            season = request.query_params.get('season')
            
            # 如果没有指定赛季，获取最新的赛季
            if season:
                rankings_queryset = TeamRanking.objects.filter(season=season)
            else:
                # 获取最新赛季的数据
                latest_season = TeamRanking.objects.values_list('season', flat=True).distinct().order_by('-season').first()
                if latest_season:
                    rankings_queryset = TeamRanking.objects.filter(season=latest_season)
                else:
                    rankings_queryset = TeamRanking.objects.none()
            
            # 转换为字典列表
            rankings = []
            last_updated = None
            for ranking in rankings_queryset.order_by('rank'):
                rankings.append({
                    'id': ranking.rank,
                    'rank': ranking.rank,
                    'team_name': ranking.team_name,
                    'score': ranking.score,
                    'season': ranking.season,
                    'last_updated': ranking.last_updated.isoformat() if ranking.last_updated else None
                })
                if not last_updated or (ranking.last_updated and ranking.last_updated > last_updated):
                    last_updated = ranking.last_updated
            
            return Response({
                'success': True,
                'data': rankings,
                'count': len(rankings),
                'last_updated': last_updated.isoformat() if last_updated else None,
                'season': season or (latest_season if 'latest_season' in locals() else None)
            })
            
        except Exception as e:
            logger.error(f"获取排名数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeaguePlayerStatsView(generics.GenericAPIView):
    """
    获取M-League选手统计数据（从数据库读取）
    GET /api/m-league/player-stats/?season=2025赛季
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取查询参数
            season = request.query_params.get('season')
            
            # 如果没有指定赛季，获取最新的赛季
            if season:
                stats_queryset = TeamPlayerStats.objects.filter(season=season)
            else:
                # 获取最新赛季的数据
                latest_season = TeamPlayerStats.objects.values_list('season', flat=True).distinct().order_by('-season').first()
                if latest_season:
                    stats_queryset = TeamPlayerStats.objects.filter(season=latest_season)
                else:
                    stats_queryset = TeamPlayerStats.objects.none()
            
            # 转换为字典列表
            stats = []
            last_updated = None
            for team_stat in stats_queryset:
                stats.append({
                    'team_id': team_stat.team_id,
                    'team_name': team_stat.team_name,
                    'season': team_stat.season,
                    'players': team_stat.players,
                    'last_updated': team_stat.last_updated.isoformat() if team_stat.last_updated else None
                })
                if not last_updated or (team_stat.last_updated and team_stat.last_updated > last_updated):
                    last_updated = team_stat.last_updated
            
            return Response({
                'success': True,
                'data': stats,
                'count': len(stats),
                'last_updated': last_updated.isoformat() if last_updated else None,
                'season': season or (latest_season if 'latest_season' in locals() else None)
            })
            
        except Exception as e:
            logger.error(f"获取选手统计数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeaguePlayerDetailView(generics.GenericAPIView):
    """
    获取指定选手的详细统计数据（从数据库读取）
    GET /api/m-league/player-stats/{player_name}/?season=2025赛季
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, player_name, *args, **kwargs):
        try:
            # URL解码选手名
            from urllib.parse import unquote
            decoded_name = unquote(player_name)
            
            # 获取查询参数
            season = request.query_params.get('season')
            
            # 查询数据库
            if season:
                stats_queryset = TeamPlayerStats.objects.filter(season=season)
            else:
                # 获取最新赛季的数据
                latest_season = TeamPlayerStats.objects.values_list('season', flat=True).distinct().order_by('-season').first()
                if latest_season:
                    stats_queryset = TeamPlayerStats.objects.filter(season=latest_season)
                else:
                    stats_queryset = TeamPlayerStats.objects.none()
            
            # 在所有队伍中查找该选手
            found_player = None
            team_info = None
            
            for team_stat in stats_queryset:
                for player in team_stat.players:
                    if player.get('player_name') == decoded_name:
                        found_player = player
                        team_info = {
                            'team_id': team_stat.team_id,
                            'team_name': team_stat.team_name,
                            'season': team_stat.season,
                            'last_updated': team_stat.last_updated.isoformat() if team_stat.last_updated else None
                        }
                        break
                if found_player:
                    break
            
            if not found_player:
                return Response({
                    'success': False,
                    'message': f'未找到选手: {decoded_name}'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'success': True,
                'data': {
                    'player': found_player,
                    'team': team_info
                }
            })
            
        except Exception as e:
            logger.error(f"获取选手详细信息失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeagueScheduleView(generics.GenericAPIView):
    """
    获取M-League比赛日程数据（从数据库读取）
    GET /api/m-league/schedule/?year=2025&month=12&status=finished
    对于历史赛季（2024年及以前），可以只提供year参数
    如果不提供year和month参数，则使用当前日期
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取查询参数
            year = request.query_params.get('year')
            month = request.query_params.get('month')
            status_filter = request.query_params.get('status')  # upcoming, finished

            # 转换为整数（如果提供）
            year = int(year) if year else None
            month = int(month) if month else None

            # 构建查询
            queryset = Match.objects.all()

            # 判断是否为历史赛季查询（只提供了year，没有month，且year小于当前年份）
            now = datetime.now()
            current_year = now.year
            is_season_query = year and not month and year < current_year

            if is_season_query:
                # 历史赛季查询：返回该赛季的所有数据
                # M-League赛季：9-12月属于开始年份，1-5月属于结束年份（开始年份+1）
                # 需要查询：
                # 1. year年的9-12月数据
                # 2. (year+1)年的1-5月数据
                season_query = Q(
                    Q(year=year, month__gte=9, month__lte=12) |  # 开始年份的9-12月
                    Q(year=year+1, month__gte=1, month__lte=5)    # 结束年份的1-5月
                )
                queryset = queryset.filter(season_query)
                logger.info(f"历史赛季查询: {year}赛季 (包含{year}年9-12月和{year+1}年1-5月)")
            elif year:
                # 按年份过滤（当前赛季或指定年份）
                queryset = queryset.filter(year=year)
            
            # 按月份过滤（如果不是赛季查询）
            if month and not is_season_query:
                queryset = queryset.filter(month=month)
            
            # 按状态过滤
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # 如果没有提供参数，使用当前日期
            if not year and not month:
                queryset = queryset.filter(year=now.year, month=now.month)

            # 转换为字典列表
            schedule = []
            last_updated = None
            for match in queryset.order_by('-date', '-created_at'):
                schedule.append({
                    'match_id': match.match_id,
                    'date': match.date.strftime('%Y-%m-%d') if match.date else None,
                    'day': match.day,
                    'month': match.month,
                    'year': match.year,
                    'day_week': match.day_week,
                    'teams': match.teams,
                    'status': match.status,
                    'result': match.result,
                    'last_updated': match.last_updated.isoformat() if match.last_updated else None
                })
                if not last_updated or (match.last_updated and match.last_updated > last_updated):
                    last_updated = match.last_updated

            return Response({
                'success': True,
                'data': schedule,
                'count': len(schedule),
                'last_updated': last_updated.isoformat() if last_updated else None
            })

        except ValueError as e:
            logger.error(f"参数错误: {str(e)}")
            return Response({
                'success': False,
                'message': f'参数错误: year和month必须是数字'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"获取比赛日程数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def test_scraper(request):
    """
    测试抓取器，获取最新排名数据
    GET /api/mleague-scraper/test/
    """
    try:
        scraper = MLeagueOfficialScraper()
        rankings = scraper.fetch_rankings()
        
        return Response({
            'success': True,
            'data': rankings,
            'count': len(rankings)
        })
        
    except Exception as e:
        logger.error(f"测试抓取器失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_html_structure(request):
    """
    调试接口：返回网页HTML结构（用于分析）
    GET /api/mleague-scraper/debug-html/?url=https://m-league.jp
    """
    try:
        url = request.query_params.get('url', 'https://m-league.jp')
        
        import requests
        from bs4 import BeautifulSoup
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 提取关键信息
        structure_info = {
            'url': url,
            'status_code': response.status_code,
            'title': soup.title.string if soup.title else None,
            'tables': [
                {
                    'classes': table.get('class', []),
                    'id': table.get('id'),
                    'rows_count': len(table.find_all('tr')),
                    'sample_html': str(table)[:500]  # 前500字符
                }
                for table in soup.find_all('table')[:5]
            ],
            'ranking_keywords': [
                {'tag': tag.name, 'classes': tag.get('class', []), 'id': tag.get('id'), 'text_preview': tag.get_text(strip=True)[:50]}
                for tag in soup.find_all(['div', 'ul', 'table', 'section'],
                                        class_=lambda x: x and any(kw in str(x).lower() 
                                                                  for kw in ['rank', 'stand', 'team', 'league']))
            ][:20]
        }
        
        return Response({
            'success': True,
            'structure': structure_info
        })
        
    except Exception as e:
        logger.error(f"调试HTML结构失败: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'错误: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeaguePointsView(APIView):
    """
    获取M-League积分数据（从数据库读取）
    GET /api/m-league/points/?type=total_points
    如果不传递type参数，则返回所有积分类型的数据
    """
    permission_classes = [permissions.AllowAny]  # 允许所有用户访问

    def get(self, request):
        try:
            # 获取查询参数
            points_type = request.query_params.get('type')
            
            # 如果没有指定type，返回所有积分类型的数据
            if not points_type:
                # 获取所有积分类型的数据
                all_points_data = PointsData.objects.all()
                
                # 构建返回数据，包含所有积分类型
                result_data = {
                    'total_points': [],
                    'regular_points': [],
                    'postseason_points': [],
                    'semifinal_points': [],
                    'final_points': []
                }
                
                last_updated = None
                for points_data_obj in all_points_data:
                    result_data[points_data_obj.points_type] = points_data_obj.team_data
                    # 获取最新的更新时间
                    if points_data_obj.last_updated:
                        if not last_updated or points_data_obj.last_updated > last_updated:
                            last_updated = points_data_obj.last_updated
                
                return Response({
                    'success': True,
                    'data': result_data,
                    'last_updated': last_updated.isoformat() if last_updated else None
                })
            
            # 如果指定了type，只返回该类型的数据（保持向后兼容）
            try:
                points_data_obj = PointsData.objects.get(points_type=points_type)
                return Response({
                    'success': True,
                    'data': {
                        points_type: points_data_obj.team_data
                    },
                    'last_updated': points_data_obj.last_updated.isoformat() if points_data_obj.last_updated else None
                })
            except PointsData.DoesNotExist:
                # 如果数据库中没有数据，返回空数据
                return Response({
                    'success': True,
                    'data': {
                        points_type: []
                    },
                    'last_updated': None,
                    'message': '数据库中暂无积分数据，请先触发数据抓取'
                })

        except Exception as e:
            logger.error(f"获取积分数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'获取积分数据失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


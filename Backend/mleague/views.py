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
from .tasks import update_rankings_from_scraper, update_schedule_from_scraper
from .models import PointsData, Match, TeamRanking, TeamPlayerStats
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
            # 抓取整个当前赛季的数据（暂时使用普通抓取）
            schedule_data = update_schedule_from_scraper()
            return Response({
                'success': True,
                'data': schedule_data,
                'count': len(schedule_data),
                'message': '当前赛季赛程数据抓取完成'
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
            'count': len(schedule_data)
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
    # 暂时返回功能未实现
    return Response({
        'success': False,
        'message': '选手统计数据抓取功能尚未实现'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_points(request):
    """
    手动触发积分数据抓取
    POST /api/mleague-scraper/trigger/points/
    """
    # 暂时返回功能未实现
    return Response({
        'success': False,
        'message': '积分数据抓取功能尚未实现'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def trigger_scrape_all(request):
    """
    手动触发所有数据抓取
    POST /api/mleague-scraper/trigger/all/
    """
    # 暂时返回功能未实现
    return Response({
        'success': False,
        'message': '全部数据抓取功能尚未实现'
    }, status=status.HTTP_501_NOT_IMPLEMENTED)


class MLeagueRankingView(generics.GenericAPIView):
    """
    获取M-League最新排名数据（从数据库读取）
    GET /api/m-league/rankings/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取所有有数据的赛季
            seasons = TeamRanking.objects.values_list('season', flat=True).distinct()
            if not seasons:
                # 如果数据库中没有数据，返回空数据
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'last_updated': None,
                    'message': '数据库中暂无排名数据，请先触发数据抓取'
                })
            
            # 找到最新更新的赛季
            latest_season = None
            latest_time = None
            for season in seasons:
                latest_rank = TeamRanking.objects.filter(season=season).order_by('-last_updated').first()
                if latest_rank and (not latest_time or latest_rank.last_updated > latest_time):
                    latest_time = latest_rank.last_updated
                    latest_season = season
            
            if not latest_season:
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'last_updated': None
                })
            
            # 从数据库查询最新赛季的数据
            queryset = TeamRanking.objects.filter(season=latest_season).order_by('rank')
            
            # 将数据库对象转换为前端期望的格式
            rankings = []
            latest_last_updated = None
            
            for ranking in queryset:
                # 记录最新的last_updated时间
                if ranking.last_updated:
                    if latest_last_updated is None or ranking.last_updated > latest_last_updated:
                        latest_last_updated = ranking.last_updated
                
                # 构建返回数据
                ranking_item = {
                    'id': ranking.id,
                    'rank': ranking.rank,
                    'team_name': ranking.team_name,
                    'score': ranking.score,
                    'season': ranking.season,
                    'last_updated': ranking.last_updated.isoformat() if ranking.last_updated else None
                }
                rankings.append(ranking_item)
            
            # 转换最新的last_updated为字符串
            last_updated_str = latest_last_updated.isoformat() if latest_last_updated else None
            
            return Response({
                'success': True,
                'data': rankings,
                'count': len(rankings),
                'last_updated': last_updated_str
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
    GET /api/m-league/player-stats/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取所有有数据的赛季
            seasons = TeamPlayerStats.objects.values_list('season', flat=True).distinct()
            if not seasons:
                # 如果数据库中没有数据，返回空数据
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'last_updated': None,
                    'message': '数据库中暂无选手统计数据，请先触发数据抓取'
                })
            
            # 找到最新更新的赛季
            latest_season = None
            latest_time = None
            for season in seasons:
                latest_stat = TeamPlayerStats.objects.filter(season=season).order_by('-last_updated').first()
                if latest_stat and (not latest_time or latest_stat.last_updated > latest_time):
                    latest_time = latest_stat.last_updated
                    latest_season = season
            
            if not latest_season:
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'last_updated': None
                })
            
            # 从数据库查询最新赛季的数据
            queryset = TeamPlayerStats.objects.filter(season=latest_season).order_by('team_name')
            
            # 将数据库对象转换为前端期望的格式
            stats = []
            latest_last_updated = None
            
            for team_stat in queryset:
                # 记录最新的last_updated时间
                if team_stat.last_updated:
                    if latest_last_updated is None or team_stat.last_updated > latest_last_updated:
                        latest_last_updated = team_stat.last_updated
                
                # 构建返回数据
                stat_item = {
                    'team_id': team_stat.team_id,
                    'team_name': team_stat.team_name,
                    'players': team_stat.players if team_stat.players else [],
                    'last_updated': team_stat.last_updated.isoformat() if team_stat.last_updated else None
                }
                stats.append(stat_item)
            
            # 转换最新的last_updated为字符串
            last_updated_str = latest_last_updated.isoformat() if latest_last_updated else None
            
            return Response({
                'success': True,
                'data': stats,
                'count': len(stats),
                'last_updated': last_updated_str
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
    GET /api/m-league/player-stats/{player_name}/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, player_name, *args, **kwargs):
        try:
            # URL解码选手名
            from urllib.parse import unquote
            decoded_name = unquote(player_name)
            
            # 获取所有有数据的赛季
            seasons = TeamPlayerStats.objects.values_list('season', flat=True).distinct()
            if not seasons:
                return Response({
                    'success': False,
                    'message': '数据库中暂无选手统计数据，请先触发数据抓取'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 找到最新更新的赛季
            latest_season = None
            latest_time = None
            for season in seasons:
                latest_stat = TeamPlayerStats.objects.filter(season=season).order_by('-last_updated').first()
                if latest_stat and (not latest_time or latest_stat.last_updated > latest_time):
                    latest_time = latest_stat.last_updated
                    latest_season = season
            
            if not latest_season:
                return Response({
                    'success': False,
                    'message': '数据库中暂无选手统计数据'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # 从数据库查询最新赛季的所有队伍数据
            queryset = TeamPlayerStats.objects.filter(season=latest_season)
            
            # 在所有队伍中查找该选手
            found_player = None
            team_info = None
            
            for team_stat in queryset:
                players = team_stat.players if team_stat.players else []
                for player in players:
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
    GET /api/m-league/schedule/?year=2025&month=12
    对于历史赛季（2024年及以前），可以只提供year参数
    如果不提供year和month参数，则使用当前日期
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            # 获取查询参数
            year = request.query_params.get('year')
            month = request.query_params.get('month')

            # 转换为整数（如果提供）
            year = int(year) if year else None
            month = int(month) if month else None

            # 对于历史赛季（2024年及以前），如果没有提供月份，则获取整个赛季的数据
            now = datetime.now()
            current_year = now.year
            
            # 如果没有指定年份，使用当前年份
            if not year:
                year = current_year
            
            is_historical_season = year < current_year

            if is_historical_season and month is None:
                logger.info(f"获取历史赛季 {year} 年的完整数据")
            elif not is_historical_season and month is None:
                # 当前赛季需要月份信息
                month = month or now.month

            # 从数据库查询数据
            queryset = Match.objects.filter(year=year)
            
            # 如果不是历史赛季查询，根据月份过滤
            if not is_historical_season and month:
                queryset = queryset.filter(month=month)
            
            # 按日期排序
            queryset = queryset.order_by('date', 'created_at')
            
            # 将数据库对象转换为前端期望的格式
            schedule = []
            latest_last_updated = None
            
            for match in queryset:
                # 转换日期格式为字符串 (YYYY-MM-DD)
                date_str = match.date.strftime('%Y-%m-%d')
                
                # 转换last_updated为字符串
                match_last_updated_str = match.last_updated.isoformat() if match.last_updated else None
                
                # 记录最新的last_updated时间
                if match.last_updated:
                    if latest_last_updated is None or match.last_updated > latest_last_updated:
                        latest_last_updated = match.last_updated
                
                # 构建返回数据
                schedule_item = {
                    'match_id': match.match_id or '',
                    'date': date_str,
                    'day': match.day,
                    'month': match.month,
                    'year': match.year,
                    'day_week': match.day_week,
                    'teams': match.teams if match.teams else [],
                    'status': match.status,
                    'result': match.result,
                    'last_updated': match_last_updated_str
                }
                schedule.append(schedule_item)

            # 转换最新的last_updated为字符串
            last_updated_str = latest_last_updated.isoformat() if latest_last_updated else None

            return Response({
                'success': True,
                'data': schedule,
                'count': len(schedule),
                'last_updated': last_updated_str
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
    """
    permission_classes = [permissions.AllowAny]  # 允许所有用户访问

    def get(self, request):
        try:
            # 获取查询参数
            points_type = request.query_params.get('type', 'total_points')
            
            # 从数据库读取
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


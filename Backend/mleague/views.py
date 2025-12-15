"""
API视图：提供数据抓取和手动触发接口
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import generics
from rest_framework.views import APIView
from django.conf import settings
from .scraper import MLeagueOfficialScraper
from .tasks import update_rankings_from_scraper, update_schedule_from_scraper
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
    """
    try:
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        schedule_data = update_schedule_from_scraper(
            start_date=start_date,
            end_date=end_date
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


class MLeagueRankingView(generics.GenericAPIView):
    """
    获取M-League最新排名数据（直接从官网抓取）
    GET /api/m-league/rankings/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            scraper = MLeagueOfficialScraper()
            rankings = scraper.fetch_rankings()
            
            # 获取最后更新时间（从第一条数据中获取）
            last_updated = None
            if rankings:
                last_updated = rankings[0].get('last_updated')
            
            return Response({
                'success': True,
                'data': rankings,
                'count': len(rankings),
                'last_updated': last_updated
            })
            
        except Exception as e:
            logger.error(f"获取排名数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeaguePlayerStatsView(generics.GenericAPIView):
    """
    获取M-League选手统计数据（直接从官网抓取）
    GET /api/m-league/player-stats/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            scraper = MLeagueOfficialScraper()
            stats = scraper.fetch_player_stats()
            
            # 获取最后更新时间（从第一条数据中获取）
            last_updated = None
            if stats:
                last_updated = stats[0].get('last_updated')
            
            return Response({
                'success': True,
                'data': stats,
                'count': len(stats),
                'last_updated': last_updated
            })
            
        except Exception as e:
            logger.error(f"获取选手统计数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'错误: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MLeaguePlayerDetailView(generics.GenericAPIView):
    """
    获取指定选手的详细统计数据
    GET /api/m-league/player-stats/{player_name}/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, player_name, *args, **kwargs):
        try:
            # URL解码选手名
            from urllib.parse import unquote
            decoded_name = unquote(player_name)
            
            scraper = MLeagueOfficialScraper()
            player_stats = scraper.fetch_player_stats()
            
            # 在所有队伍中查找该选手
            found_player = None
            team_info = None
            
            for team_stat in player_stats:
                for player in team_stat.get('players', []):
                    if player.get('player_name') == decoded_name:
                        found_player = player
                        team_info = {
                            'team_id': team_stat.get('team_id'),
                            'team_name': team_stat.get('team_name'),
                            'season': team_stat.get('season'),
                            'last_updated': team_stat.get('last_updated')
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
    获取M-League比赛日程数据（直接从官网抓取）
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
            from datetime import datetime
            current_year = datetime.now().year
            is_historical_season = year and year < current_year

            if is_historical_season and month is None:
                logger.info(f"获取历史赛季 {year} 年的完整数据")
            elif not is_historical_season and month is None:
                # 当前赛季需要月份信息
                now = datetime.now()
                month = month or now.month

            scraper = MLeagueOfficialScraper()
            schedule = scraper.fetch_schedule(year=year, month=month)

            # 获取最后更新时间（从第一条数据中获取）
            last_updated = None
            if schedule:
                last_updated = schedule[0].get('last_updated')

            return Response({
                'success': True,
                'data': schedule,
                'count': len(schedule),
                'last_updated': last_updated
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
    """获取M-League积分数据"""
    permission_classes = [permissions.AllowAny]  # 允许所有用户访问

    def get(self, request):
        try:
            from .scraper import fetch_points_data
            points_data = fetch_points_data()
            return Response(points_data)

        except Exception as e:
            logger.error(f"获取积分数据失败: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'获取积分数据失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


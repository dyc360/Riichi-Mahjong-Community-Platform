"""
API视图：提供数据抓取和手动触发接口
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import generics
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


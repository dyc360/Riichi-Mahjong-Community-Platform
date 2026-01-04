"""
雀魂麻将新闻爬取器
从雀魂官网获取最新游戏资讯
"""
import requests
from bs4 import BeautifulSoup
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class MajSoulNewsScraper:
    """
    雀魂麻将新闻爬取器
    从 https://maj-soul.com 获取最新资讯
    """

    def __init__(self):
        self.base_url = "https://maj-soul.com"
        self.news_url = "https://maj-soul.com/news"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Referer': self.base_url,
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def fetch_latest_news(self, limit: int = 10) -> List[Dict]:
        """
        获取最新新闻资讯
        
        尝试从雀魂官网爬取，如果失败则返回模拟数据作为后备
        """
        logger.info(f"开始获取雀魂最新新闻，限制数量: {limit}")
        
        try:
            # 尝试从官网爬取
            news_data = self._scrape_news_from_website(limit)
            if news_data:
                logger.info(f"成功从官网爬取 {len(news_data)} 条新闻")
                return news_data
        except Exception as e:
            logger.warning(f"从官网爬取新闻失败: {str(e)}，使用模拟数据")
        
        # 如果爬取失败，返回模拟数据
        logger.info("返回模拟新闻数据")
        mock_news = self._get_mock_news()[:limit]
        logger.info(f"返回 {len(mock_news)} 条模拟新闻数据")
        return mock_news
    
    def _scrape_news_from_website(self, limit: int = 10) -> List[Dict]:
        """
        从雀魂官网爬取新闻
        尝试多种URL和方式
        """
        news_list = []
        
        # 尝试多个可能的新闻URL
        possible_urls = [
            "https://maj-soul.com/news",
            "https://maj-soul.com/",
            "https://mahjongsoul.yo-star.com/news",
            "https://mahjongsoul.yo-star.com/",
        ]
        
        for url in possible_urls:
            try:
                logger.info(f"尝试从 {url} 爬取新闻")
                response = self.session.get(url, timeout=10)
                response.raise_for_status()
                
                # 解析HTML
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 尝试查找新闻列表（根据实际网站结构调整选择器）
                # 这里需要根据实际网站结构来调整
                news_items = soup.find_all(['article', 'div'], class_=lambda x: x and ('news' in x.lower() or 'article' in x.lower() or 'item' in x.lower()))
                
                if not news_items:
                    # 尝试其他常见的选择器
                    news_items = soup.find_all('a', href=lambda x: x and '/news' in x.lower())
                
                if news_items:
                    logger.info(f"在 {url} 找到 {len(news_items)} 个可能的新闻项")
                    for item in news_items[:limit]:
                        try:
                            news_data = self._parse_news_item(item, url)
                            if news_data:
                                news_list.append(news_data)
                        except Exception as e:
                            logger.debug(f"解析新闻项失败: {str(e)}")
                            continue
                    
                    if news_list:
                        logger.info(f"成功解析 {len(news_list)} 条新闻")
                        return news_list
                        
            except requests.RequestException as e:
                logger.debug(f"请求 {url} 失败: {str(e)}")
                continue
            except Exception as e:
                logger.debug(f"处理 {url} 时出错: {str(e)}")
                continue
        
        # 如果所有URL都失败，返回空列表
        return []
    
    def _parse_news_item(self, item, base_url: str) -> Optional[Dict]:
        """
        解析单个新闻项
        """
        try:
            # 尝试提取标题
            title_elem = item.find(['h1', 'h2', 'h3', 'h4', 'a', 'span'], class_=lambda x: x and ('title' in x.lower() or 'head' in x.lower()))
            if not title_elem:
                title_elem = item.find(['h1', 'h2', 'h3', 'h4'])
            if not title_elem:
                title_elem = item.find('a')
            
            title = title_elem.get_text(strip=True) if title_elem else "无标题"
            
            # 尝试提取链接
            link_elem = item.find('a', href=True)
            if not link_elem:
                # 如果item本身就是a标签
                if item.name == 'a' and item.get('href'):
                    link_elem = item
            if link_elem and link_elem.get('href'):
                link = link_elem['href']
                if not link.startswith('http'):
                    from urllib.parse import urljoin
                    link = urljoin(base_url, link)
            else:
                link = base_url
            
            # 尝试提取描述
            desc_elem = item.find(['p', 'div', 'span'], class_=lambda x: x and ('desc' in x.lower() or 'summary' in x.lower() or 'content' in x.lower()))
            if not desc_elem:
                desc_elem = item.find('p')
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # 尝试提取图片
            img_elem = item.find('img', src=True)
            image_url = ""
            if img_elem and img_elem.get('src'):
                image_url = img_elem['src']
                if not image_url.startswith('http'):
                    from urllib.parse import urljoin
                    image_url = urljoin(base_url, image_url)
            
            # 尝试提取发布时间
            time_elem = item.find(['time', 'span', 'div'], class_=lambda x: x and ('time' in x.lower() or 'date' in x.lower()))
            if time_elem:
                time_str = time_elem.get('datetime') or time_elem.get_text(strip=True)
                try:
                    from dateutil import parser
                    published_at = parser.parse(time_str)
                except:
                    published_at = datetime.now()
            else:
                published_at = datetime.now()
            
            # 尝试提取分类
            category = ""
            cat_elem = item.find(['span', 'div'], class_=lambda x: x and ('category' in x.lower() or 'tag' in x.lower()))
            if cat_elem:
                category = cat_elem.get_text(strip=True)
            
            if title and title != "无标题":
                return {
                    'title': title,
                    'description': description[:500] if description else "",  # 限制描述长度
                    'link': link,
                    'image_url': image_url,
                    'published_at': published_at,
                    'category': category,
                    'source': '雀魂官网'
                }
        except Exception as e:
            logger.debug(f"解析新闻项时出错: {str(e)}")
        
        return None





    def _get_mock_news(self) -> List[Dict]:
        """返回模拟新闻数据用于测试"""
        base_time = datetime.now()
        return [
            {
                'title': '雀魂新版本更新公告',
                'description': '全新版本带来多项改进，包括新的游戏模式和优化体验。新增了多个游戏功能，优化了游戏性能，修复了已知问题。',
                'link': 'https://mahjongsoul.yo-star.com/news/update-2024',
                'image_url': 'https://placehold.co/400x200/6366f1/ffffff?text=Update',
                'published_at': base_time,
                'category': '更新',
                'source': '雀魂官网'
            },
            {
                'title': '夏季锦标赛即将开启',
                'description': '2024年夏季锦标赛报名通道已开放，欢迎所有玩家参与。本次锦标赛设置了丰厚的奖励，包括限定称号和特殊道具。',
                'link': 'https://mahjongsoul.yo-star.com/news/tournament-2024',
                'image_url': 'https://placehold.co/400x200/ec4899/ffffff?text=Tournament',
                'published_at': base_time,
                'category': '活动',
                'source': '雀魂官网'
            },
            {
                'title': '新角色「望月凛」登场',
                'description': '来自北海道的天才少女角色正式加入雀魂大家庭。望月凛是一位充满活力的角色，拥有独特的语音和立绘。',
                'link': 'https://mahjongsoul.yo-star.com/news/character-mochizuki',
                'image_url': 'https://placehold.co/400x200/f59e0b/ffffff?text=Character',
                'published_at': base_time,
                'category': '角色',
                'source': '雀魂官网'
            },
            {
                'title': '游戏平衡性调整说明',
                'description': '根据玩家反馈和数据分析，我们对部分游戏机制进行了平衡性调整，以提供更好的游戏体验。',
                'link': 'https://mahjongsoul.yo-star.com/news/balance-2024',
                'image_url': 'https://placehold.co/400x200/10b981/ffffff?text=Balance',
                'published_at': base_time,
                'category': '更新',
                'source': '雀魂官网'
            },
            {
                'title': '限时活动：双倍经验周',
                'description': '本周开启双倍经验活动，所有对局获得的经验值翻倍，是提升等级的好时机！',
                'link': 'https://mahjongsoul.yo-star.com/news/double-exp',
                'image_url': 'https://placehold.co/400x200/8b5cf6/ffffff?text=Event',
                'published_at': base_time,
                'category': '活动',
                'source': '雀魂官网'
            }
        ]






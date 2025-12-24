"""
雀魂麻将新闻爬取器
从雀魂官网获取最新游戏资讯
注意：雀魂官网使用Vue.js单页应用，内容通过JavaScript动态加载
"""
import requests
from bs4 import BeautifulSoup
import logging
from typing import Dict, List, Optional
from datetime import datetime
import re
import time

logger = logging.getLogger(__name__)


class MajSoulNewsScraper:
    """
    雀魂麻将新闻爬取器
    从 https://mahjongsoul.yo-star.com 获取最新资讯

    注意：雀魂官网是Vue.js单页应用，传统爬虫无法获取动态内容
    需要使用Selenium或其他方式执行JavaScript
    """

    def __init__(self):
        self.base_url = "https://mahjongsoul.yo-star.com"
        self.news_url = "https://mahjongsoul.yo-star.com/news"
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

        由于雀魂官网是Vue.js SPA，这里提供临时解决方案：
        1. 如果安装了Selenium，使用它爬取动态内容
        2. 否则返回模拟数据作为示例
        """
        # 首先尝试使用Selenium
        selenium_news = self._fetch_with_selenium(limit)
        if selenium_news:
            logger.info("成功使用Selenium获取新闻")
            return selenium_news

        # 如果Selenium失败，返回模拟数据
        logger.warning("Selenium不可用或失败，返回模拟新闻数据")
        mock_news = self._get_mock_news()[:limit]
        logger.info(f"返回 {len(mock_news)} 条模拟新闻数据")
        return mock_news

    def _fetch_with_selenium(self, limit: int) -> List[Dict]:
        """使用Selenium爬取"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC

            logger.info(f"使用Selenium访问雀魂官网新闻页面: {self.news_url}")

            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument(f"--user-agent={self.headers['User-Agent']}")

            driver = webdriver.Chrome(options=chrome_options)
            driver.get(self.news_url)

            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            time.sleep(5)  # 等待JS加载

            soup = BeautifulSoup(driver.page_source, 'html.parser')
            driver.quit()

            news_items = self._parse_news_list(soup)
            return news_items[:limit]

        except Exception as e:
            logger.error(f"Selenium爬取失败: {str(e)}")
            return []

    def _get_mock_news(self) -> List[Dict]:
        """返回模拟新闻数据用于测试"""
        return [
            {
                'title': '雀魂新版本更新公告',
                'description': '全新版本带来多项改进，包括新的游戏模式和优化体验',
                'link': 'https://mahjongsoul.yo-star.com/news',
                'image_url': 'https://placehold.co/400x200/6366f1/ffffff?text=Update',
                'published_at': datetime.now(),
                'source': '雀魂官网'
            },
            {
                'title': '夏季锦标赛即将开启',
                'description': '2024年夏季锦标赛报名通道已开放，欢迎所有玩家参与',
                'link': 'https://mahjongsoul.yo-star.com/news',
                'image_url': 'https://placehold.co/400x200/ec4899/ffffff?text=Tournament',
                'published_at': datetime.now(),
                'source': '雀魂官网'
            },
            {
                'title': '新角色「望月凛」登场',
                'description': '来自北海道的天才少女角色正式加入雀魂大家庭',
                'link': 'https://mahjongsoul.yo-star.com/news',
                'image_url': 'https://placehold.co/400x200/f59e0b/ffffff?text=Character',
                'published_at': datetime.now(),
                'source': '雀魂官网'
            }
        ]

    def fetch_latest_news(self, limit: int = 10) -> List[Dict]:
        """
        获取最新新闻资讯
        """
        try:
            logger.info(f"访问雀魂官网新闻页面: {self.news_url}")
            response = self.session.get(self.news_url, timeout=30)
            response.raise_for_status()
            logger.info(f"成功获取页面，状态码: {response.status_code}")

            soup = BeautifulSoup(response.content, 'html.parser')
            logger.info(f"页面标题: {soup.title.string if soup.title else '无标题'}")
            
            # 保存HTML内容用于调试
            debug_file = 'majsoul_news_debug.html'
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            logger.info(f"HTML内容已保存到 {debug_file} 用于调试")
            
            news_items = self._parse_news_list(soup)

            # 限制数量
            news_items = news_items[:limit]

            logger.info(f"成功获取 {len(news_items)} 条雀魂新闻")
            return news_items

        except Exception as e:
            logger.error(f"爬取雀魂新闻失败: {str(e)}", exc_info=True)
            return []

    def _parse_news_list(self, soup: BeautifulSoup) -> List[Dict]:
        """
        解析新闻列表
        根据雀魂官网 https://mahjongsoul.yo-star.com/news 的实际结构调整
        """
        news_list = []

        # 尝试多种可能的容器选择器（需要根据实际页面调整）
        possible_containers = [
            soup.find_all('div', class_=re.compile(r'news-item|article|post|news-list-item')),
            soup.find_all('article'),
            soup.find_all('li', class_=re.compile(r'news|article')),
            soup.find_all('div', class_=re.compile(r'news-card|news-block')),
        ]

        news_containers = []
        for containers in possible_containers:
            if containers:
                news_containers = containers
                break

        # 如果没找到，尝试查找所有包含标题的div
        if not news_containers:
            all_divs = soup.find_all('div')
            news_containers = [div for div in all_divs if div.find('h1') or div.find('h2') or div.find('h3')]

        logger.info(f"找到 {len(news_containers)} 个可能的新闻容器")

        for container in news_containers[:10]:  # 限制处理数量
            try:
                # 提取标题 - 尝试多种选择器
                title = None
                for selector in ['h1', 'h2', 'h3', '.title', '.news-title']:
                    title_elem = container.select_one(selector)
                    if title_elem:
                        title = title_elem.get_text(strip=True)
                        break

                # 如果没找到标题，跳过
                if not title:
                    continue

                # 提取链接
                link_elem = container.find('a') or container.find_parent('a')
                link = ""
                if link_elem and link_elem.get('href'):
                    link = link_elem['href']
                    if link and not link.startswith('http'):
                        link = f"{self.base_url}{link}"

                # 提取摘要或描述
                description = ""
                desc_selectors = ['p', '.summary', '.description', '.excerpt', '.content']
                for selector in desc_selectors:
                    desc_elem = container.select_one(selector)
                    if desc_elem:
                        description = desc_elem.get_text(strip=True)
                        break

                # 提取发布时间
                published_at = None
                time_selectors = ['time', '.date', '.time', '.publish-date']
                for selector in time_selectors:
                    time_elem = container.select_one(selector)
                    if time_elem:
                        time_text = time_elem.get_text(strip=True) or time_elem.get('datetime', '')
                        try:
                            published_at = self._parse_date(time_text)
                        except:
                            pass
                        break

                # 提取图片
                img_elem = container.find('img')
                image_url = ""
                if img_elem:
                    image_url = img_elem.get('src', '') or img_elem.get('data-src', '')
                    if image_url and not image_url.startswith('http'):
                        image_url = f"{self.base_url}{image_url}"

                if title:
                    news_list.append({
                        'title': title,
                        'description': description,
                        'link': link,
                        'image_url': image_url,
                        'published_at': published_at,
                        'source': '雀魂官网'
                    })

            except Exception as e:
                logger.warning(f"解析新闻项失败: {str(e)}")
                continue

        """
        解析日期字符串
        """
        # 这里需要根据实际的日期格式实现解析
        # 示例：支持 "2024-12-24", "2024年12月24日" 等格式
        date_str = date_str.strip()

        # 尝试常见格式
        formats = [
            '%Y-%m-%d',
            '%Y年%m月%d日',
            '%m月%d日',
            '%Y/%m/%d'
        ]

        for fmt in formats:
            try:
                if fmt == '%m月%d日':
                    # 如果只有月日，添加当前年份
                    parsed = datetime.strptime(date_str, fmt)
                    now = datetime.now()
                    return parsed.replace(year=now.year)
                else:
                    return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        # 如果都失败，返回当前时间
        return datetime.now()

    def fetch_news_detail(self, url: str) -> Dict:
        """
        获取新闻详情（如果需要）
        """
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # 提取详细内容
            content_elem = soup.find('div', class_=re.compile(r'content|article-body'))
            content = content_elem.get_text(strip=True) if content_elem else ""

            return {
                'content': content,
                'url': url
            }

        except Exception as e:
            logger.error(f"获取新闻详情失败 {url}: {str(e)}")
            return {}
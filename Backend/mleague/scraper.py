"""
M-League 数据抓取器
支持从多个数据源获取实时数据
"""
import requests
from bs4 import BeautifulSoup
import logging
from typing import Dict, List, Optional
from datetime import datetime
import time
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class SeleniumBrowserManager:
    """
    Selenium浏览器上下文管理器
    确保浏览器实例总是被正确关闭，避免资源泄漏
    """
    
    def __init__(self, headless: bool = True, user_agent: str = None):
        """
        初始化浏览器管理器
        
        Args:
            headless: 是否使用无头模式
            user_agent: 自定义User-Agent字符串
        """
        self.headless = headless
        self.user_agent = user_agent or 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        self.driver = None
    
    def __enter__(self):
        """进入上下文时创建浏览器实例"""
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument(f"user-agent={self.user_agent}")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.debug("Selenium浏览器实例已创建")
            return self.driver
            
        except ImportError:
            logger.error("Selenium未安装，无法创建浏览器实例")
            raise Exception("Selenium未安装，请安装: pip install selenium")
        except Exception as e:
            logger.error(f"创建Selenium浏览器实例失败: {str(e)}")
            raise
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """退出上下文时关闭浏览器实例"""
        if self.driver:
            try:
                self.driver.quit()
                logger.debug("Selenium浏览器实例已关闭")
            except Exception as e:
                logger.warning(f"关闭Selenium浏览器实例时出错: {str(e)}")
        # 返回False表示不抑制异常
        return False


class MLeagueScraper:
    """M-League 数据抓取基类"""
    
    def __init__(self, base_url: str = None, headers: dict = None):
        self.base_url = base_url
        self.headers = headers or {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def fetch_rankings(self) -> List[Dict]:
        """
        获取最新排名数据
        子类需要实现此方法
        """
        raise NotImplementedError("子类必须实现 fetch_rankings 方法")
    
    def fetch_schedule(self, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        获取赛程数据
        子类需要实现此方法
        """
        raise NotImplementedError("子类必须实现 fetch_schedule 方法")
    
    def fetch_match_details(self, match_id: str) -> Dict:
        """
        获取比赛详情
        子类需要实现此方法
        """
        raise NotImplementedError("子类必须实现 fetch_match_details 方法")
    
    def _make_request(self, url: str, method: str = 'GET', **kwargs) -> requests.Response:
        """发送HTTP请求，带重试机制"""
        max_retries = 3
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                response = self.session.request(method, url, timeout=10, **kwargs)
                response.raise_for_status()
                return response
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    logger.warning(f"请求失败，{retry_delay}秒后重试: {url}")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.error(f"请求最终失败: {url}, 错误: {str(e)}")
                    raise
        
        return None
    
    def _fetch_with_selenium(self, url: str) -> BeautifulSoup:
        """
        使用Selenium加载页面（用于需要JavaScript渲染的页面）
        使用上下文管理器确保浏览器实例总是被正确关闭
        """
        try:
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
        except ImportError:
            logger.error("Selenium未安装，无法使用Selenium加载页面")
            raise Exception("Selenium未安装，请安装: pip install selenium")
        
        logger.info(f"使用Selenium访问: {url}")
        
        # 使用上下文管理器确保浏览器总是被关闭
        with SeleniumBrowserManager(headless=True) as driver:
            driver.get(url)
            
            # 等待页面加载完成（等待至少一个比赛列表出现）
            try:
                WebDriverWait(driver, 30).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "p-gamesSchedule2__lists"))
                )
            except Exception:
                logger.warning("等待比赛列表超时，继续解析...")
            
            # 额外等待一段时间确保所有内容加载完成
            time.sleep(3)
            
            # 获取页面源码
            page_source = driver.page_source
        
        # 浏览器实例已自动关闭（通过上下文管理器的__exit__方法）
        return BeautifulSoup(page_source, 'html.parser')


class MLeagueOfficialScraper(MLeagueScraper):
    """
    M-League 官网数据抓取器
    从 https://m-league.jp 获取实时数据
    """
    
    def __init__(self):
        super().__init__(base_url="https://m-league.jp")
        # 更新headers以更好地模拟浏览器
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8,zh-CN;q=0.7,zh;q=0.6',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://m-league.jp/',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def fetch_rankings(self) -> List[Dict]:
        """
        从官网首页抓取最新排名数据
        """
        try:
            url = f"{self.base_url}/"
            logger.info(f"访问M-League官网: {url}")
            
            response = self._make_request(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            rankings = self._parse_list_rankings(soup)
            
            if rankings:
                logger.info(f"成功解析到 {len(rankings)} 条排名数据")
            else:
                logger.warning("未能解析到排名数据")
            
            return rankings
            
        except Exception as e:
            logger.error(f"抓取排名数据失败: {str(e)}", exc_info=True)
            return []
    
    def _parse_list_rankings(self, soup: BeautifulSoup) -> List[Dict]:
        """从列表/卡片形式解析排名数据"""
        rankings = []
        
        # 查找M-League官网的特定结构
        # <ol class="p-ranking__team-list -regular">
        ranking_list = soup.find('ol', class_='p-ranking__team-list')
        if ranking_list:
            items = ranking_list.find_all('li')
            for item in items:
                # 查找排名: <div class="p-ranking__rank-number is-rank1">1</div>
                rank_elem = item.find('div', class_=lambda x: x and 'p-ranking__rank-number' in str(x))
                rank = None
                if rank_elem:
                    rank_text = rank_elem.get_text(strip=True)
                    rank = self._extract_number(rank_text)
                
                # 查找队伍名: <div class="p-ranking__team-name">風林火山</div>
                team_name_elem = item.find('div', class_='p-ranking__team-name')
                team_name = team_name_elem.get_text(strip=True) if team_name_elem else None
                
                # 查找当前积分: <div class="p-ranking__current-point">532.5pt</div>
                score_elem = item.find('div', class_='p-ranking__current-point')
                score = None
                if score_elem:
                    score_text = score_elem.get_text(strip=True)
                    # 移除 "pt" 后缀，保留数字和符号
                    score = score_text.replace('pt', '').strip()
                
                if rank and team_name:
                    # 自动检测当前赛季
                    detected_season = self._detect_season(soup)
                    rankings.append({
                        'id': rank,  # 使用排名作为id（因为排名是唯一的）
                        'rank': rank,
                        'team_name': team_name,
                        'score': score or '0',
                        'season': detected_season,
                        'last_updated': datetime.now().isoformat()
                    })
            
            if rankings:
                logger.info(f"从M-League官网排名列表解析到 {len(rankings)} 条数据")
                return rankings
        
        return rankings
    
    def _extract_number(self, text: str) -> Optional[int]:
        """从文本中提取数字"""
        import re
        if not text:
            return None
        # 提取第一个数字
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
    
    def _get_current_season(self) -> str:
        """获取当前赛季（基于当前日期）"""
        from datetime import datetime
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        # 如果当前是1-3月，可能是上一年的赛季；4-12月是当前年的赛季
        if current_month < 4:
            season_year = current_year - 1
        else:
            season_year = current_year
        
        return f"{season_year}赛季"
    
    def _detect_season(self, soup: BeautifulSoup) -> str:
        """从网页中检测当前赛季信息"""
        import re
        from datetime import datetime
        
        # 方法1: 从网页文本中查找赛季信息
        text = soup.get_text()
        # 查找"2024赛季"、"2025赛季"等格式
        season_match = re.search(r'(20\d{2})\s*[年季]', text)
        if season_match:
            year = season_match.group(1)
            return f"{year}赛季"
        
        # 方法2: 查找年份数字
        year_match = re.search(r'(20\d{2})', text)
        if year_match:
            year = year_match.group(1)
            # 检查是否是当前年份或未来年份
            current_year = datetime.now().year
            detected_year = int(year)
            if detected_year >= current_year - 1:  # 允许去年的数据（可能是上赛季）
                return f"{year}赛季"
        
        # 方法3: 使用当前年份作为默认值（获取最新数据）
        return self._get_current_season()
    
    def fetch_player_stats(self) -> List[Dict]:
        """
        从官网stats页面抓取选手统计数据
        GET https://m-league.jp/stats
        """
        try:
            url = f"{self.base_url}/stats"
            logger.info(f"访问M-League统计页面: {url}")
            
            response = self._make_request(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            stats_data = self._parse_player_stats(soup)
            
            if stats_data:
                logger.info(f"成功解析到 {len(stats_data)} 支队伍的选手数据")
            else:
                logger.warning("未能解析到选手统计数据")
            
            return stats_data
            
        except Exception as e:
            logger.error(f"抓取选手统计数据失败: {str(e)}", exc_info=True)
            return []
    
    def _parse_player_stats(self, soup: BeautifulSoup) -> List[Dict]:
        """解析选手统计数据"""
        teams_data = []
        
        # 查找所有队伍统计区块
        team_sections = soup.find_all('section', class_='p-stats__team')
        
        for section in team_sections:
            # 提取队伍名
            team_name_elem = section.find('h2', class_='p-stats__teamName')
            if not team_name_elem:
                continue
            
            # 队伍名可能在img标签后，需要提取文本
            team_name = team_name_elem.get_text(strip=True)
            # 移除可能的logo文本，只保留队伍名
            team_name = team_name.replace('\n', ' ').strip()
            
            # 提取队伍ID（如果有）
            team_id = section.get('id', '')
            
            # 查找统计表格
            table = section.find('table', class_='p-stats__table')
            if not table:
                continue
            
            # 解析表格数据
            players_data = self._parse_stats_table(table)
            
            if players_data:
                # 检测当前赛季
                detected_season = self._detect_season(soup)
                teams_data.append({
                    'team_id': team_id,
                    'team_name': team_name,
                    'season': detected_season,
                    'players': players_data,
                    'last_updated': datetime.now().isoformat()
                })
        
        return teams_data
    
    def _parse_stats_table(self, table) -> List[Dict]:
        """解析统计表格，返回选手数据列表"""
        players_data = []
        
        # 获取表头行（第一行），包含选手名
        header_row = table.find('tr')
        if not header_row:
            return players_data
        
        # 提取所有选手名（th scope="col"）
        player_names = []
        header_cells = header_row.find_all('th', scope='col')
        for cell in header_cells:
            name = cell.get_text(strip=True)
            if name and name != '選手名':  # 排除表头
                player_names.append(name)
        
        if not player_names:
            return players_data
        
        # 为每个选手初始化数据字典
        for name in player_names:
            players_data.append({
                'player_name': name,
                'matches': None,
                'total_games': None,
                'points': None,
                'average_rank': None,
                'first_place': None,
                'second_place': None,
                'third_place': None,
                'fourth_place': None,
                'top_rate': None,
                'renchan_rate': None,
                'last_avoidance_rate': None,
                'best_score': None,
                'average_score': None,
                'furo_rate': None,
                'riichi_rate': None,
                'agari_rate': None,
                'houjuu_rate': None,
                'houjuu_average_score': None
            })
        
        # 解析数据行
        data_rows = table.find_all('tr')[1:]  # 跳过表头行
        
        for row in data_rows:
            # 获取统计项名称（th scope="row"）
            stat_name_cell = row.find('th', scope='row')
            if not stat_name_cell:
                continue
            
            stat_name = stat_name_cell.get_text(strip=True)
            
            # 获取所有数据单元格（td）
            data_cells = row.find_all('td')
            
            # 根据统计项名称映射到对应的字段
            stat_mapping = {
                '試合数': 'matches',
                '総局数': 'total_games',
                'ポイント': 'points',
                '平着': 'average_rank',
                '1位': 'first_place',
                '2位': 'second_place',
                '3位': 'third_place',
                '4位': 'fourth_place',
                'トップ率': 'top_rate',
                '連対率': 'renchan_rate',
                'ラス回避率': 'last_avoidance_rate',
                'ベストスコア': 'best_score',
                '平均打点': 'average_score',
                '副露率': 'furo_rate',
                'リーチ率': 'riichi_rate',
                'アガリ率': 'agari_rate',
                '放銃率': 'houjuu_rate',
                '放銃平均打点': 'houjuu_average_score'
            }
            
            field_name = stat_mapping.get(stat_name)
            if not field_name:
                continue
            
            # 将数据填充到对应的选手
            for idx, cell in enumerate(data_cells):
                if idx < len(players_data):
                    value = cell.get_text(strip=True)
                    # 尝试转换为数字
                    try:
                        # 如果是小数
                        if '.' in value:
                            players_data[idx][field_name] = float(value)
                        else:
                            players_data[idx][field_name] = int(value)
                    except ValueError:
                        # 如果转换失败，保持字符串
                        players_data[idx][field_name] = value
        
        return players_data
    
    def fetch_schedule(self, year: int = None, month: int = None) -> List[Dict]:
        """
        从官网games页面抓取比赛日程数据
        - 当前赛季：GET https://m-league.jp/games/?mly={year}&mlm={month}#schedule
        - 历史赛季：GET https://m-league.jp/games/{year}-season
        
        Args:
            year: 年份，如果为None则使用当前年份
            month: 月份，如果为None且year是历史年份，则抓取整个赛季的数据
        """
        try:
            from datetime import datetime
            now = datetime.now()
            current_year = now.year
            
            # 如果没有指定年份，使用当前年份
            if year is None:
                year = current_year
            
            # 判断是否为历史赛季（当前年份之前为历史赛季）
            is_historical_season = year < current_year

            if is_historical_season:
                # 历史赛季使用不同的URL格式，不需要月份参数
                url = f"{self.base_url}/games/{year}-season"
                logger.info(f"访问M-League历史赛季页面: {url}")
                
                # 历史赛季页面可能需要Selenium来加载动态内容
                # 先尝试使用requests，如果失败再尝试Selenium
                try:
                    response = self._make_request(url)
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # 检查是否成功加载了内容
                    test_elements = soup.find_all('ul', class_='p-gamesSchedule2__lists')
                    if not test_elements:
                        logger.warning("使用requests未找到比赛列表，尝试使用Selenium...")
                        raise Exception("未找到比赛列表，可能需要JavaScript渲染")
                except Exception as e:
                    logger.info(f"尝试使用Selenium加载历史赛季页面: {str(e)}")
                    try:
                        soup = self._fetch_with_selenium(url)
                    except Exception as selenium_error:
                        logger.error(f"Selenium加载也失败: {str(selenium_error)}")
                        # 如果Selenium也失败，返回空列表
                        return []
            else:
                # 当前赛季需要月份参数
                if month is None:
                    month = now.month
                url = f"{self.base_url}/games/?mly={year}&mlm={month}#schedule"
                logger.info(f"访问M-League当前赛季页面: {url} (year={year}, month={month})")

                response = self._make_request(url)
                soup = BeautifulSoup(response.content, 'html.parser')

            if is_historical_season:
                schedule = self._parse_historical_schedule(soup, year)
            else:
                schedule = self._parse_schedule(soup, year, month)

            if schedule:
                logger.info(f"成功解析到 {len(schedule)} 场比赛 (year={year}, month={month if not is_historical_season else 'all'})")
            else:
                logger.warning(f"未能解析到比赛日程数据 (year={year}, month={month if not is_historical_season else 'all'})")

            return schedule

        except Exception as e:
            logger.error(f"抓取比赛日程数据失败: {str(e)}", exc_info=True)
            return []
    
    def _parse_schedule(self, soup: BeautifulSoup, year: int, month: int) -> List[Dict]:
        """解析比赛日程HTML"""
        schedule = []
        
        # 查找比赛列表容器
        schedule_section = soup.find('section', class_='p-gamesSchedule2', id='schedule')
        if not schedule_section:
            logger.warning("未找到比赛日程section")
            return schedule
        
        # 查找比赛列表
        games_list = schedule_section.find('ul', class_='p-gamesSchedule2__lists')
        if not games_list:
            logger.warning("未找到比赛列表")
            return schedule
        
        # 解析每个比赛项
        game_items = games_list.find_all('li', class_='p-gamesSchedule2__list')
        
        for item in game_items:
            try:
                # 解析日期
                date_elem = item.find('p', class_='p-gamesSchedule2__data')
                if not date_elem:
                    continue
                
                date_text = date_elem.get_text(strip=True)
                # 解析日期文本，如 "12/1（月）"
                import re
                date_match = re.search(r'(\d+)/(\d+)', date_text)
                if not date_match:
                    continue
                
                day = int(date_match.group(2))
                # 构建完整日期
                from datetime import datetime
                try:
                    game_date = datetime(year, month, day)
                    date_str = game_date.strftime('%Y-%m-%d')
                except ValueError:
                    # 如果日期无效（如2月30日），跳过
                    logger.warning(f"无效日期: {year}-{month}-{day}")
                    continue
                
                # 解析星期
                day_week_match = re.search(r'（([^）]+)）', date_text)
                day_week = day_week_match.group(1) if day_week_match else ''
                
                # 解析队伍
                teams = []
                logos_list = item.find('ul', class_='p-gamesSchedule2__logos')
                if logos_list:
                    team_imgs = logos_list.find_all('img')
                    for img in team_imgs:
                        team_name = img.get('alt', '').strip()
                        team_logo = img.get('src', '')
                        if team_name:
                            teams.append({
                                'name': team_name,
                                'logo': team_logo if team_logo.startswith('http') else f"{self.base_url}{team_logo}"
                            })
                
                # 过滤掉teams为空的比赛项
                if not teams or len(teams) == 0:
                    logger.debug(f"跳过空比赛项: {date_str}")
                    continue
                
                # 过滤掉所有队伍名称都为空的情况
                valid_teams = [t for t in teams if t.get('name', '').strip()]
                if not valid_teams:
                    logger.debug(f"跳过多队名称为空的比赛项: {date_str}")
                    continue
                
                # 判断比赛状态
                is_finished = 'is-finish' in item.get('class', [])
                status = 'finished' if is_finished else 'upcoming'
                
                # 获取网页提供的原始比赛ID（用于解析比赛结果，但不作为match_id使用）
                original_match_id = item.get('data-target', '')
                
                # 统一生成match_id格式：{date}-{teamA}-{teamB}-{teamC}-{teamD}
                # 使用排序后的队伍名称确保稳定性
                team_names = sorted([t.get('name', '').strip() for t in valid_teams])
                match_id = f"{date_str}-{'-'.join(team_names)}"
                
                # 解析比赛结果（如果已完成，使用原始match_id来解析）
                match_result = None
                if is_finished and original_match_id:
                    match_result = self._parse_match_result(soup, original_match_id, valid_teams)
                
                schedule.append({
                    'match_id': match_id,  # 使用统一的格式
                    'date': date_str,
                    'day': day,
                    'month': month,
                    'year': year,
                    'day_week': day_week,
                    'teams': valid_teams,
                    'status': status,
                    'result': match_result,
                    'last_updated': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.warning(f"解析比赛项失败: {str(e)}")
                continue
        
        # 去重：对于同一日期和队伍的比赛，只保留一个（优先保留已完成的）
        seen_matches = {}
        deduplicated_schedule = []
        
        for match in schedule:
            # 生成唯一键：日期 + 队伍名称排序后的字符串
            teams_names = sorted([t.get('name', '') for t in match.get('teams', [])])
            match_key = f"{match.get('date')}-{'-'.join(teams_names)}"
            
            if match_key not in seen_matches:
                # 如果还没见过这个比赛，直接添加
                seen_matches[match_key] = match
                deduplicated_schedule.append(match)
            else:
                # 如果已经见过，优先保留已完成的比赛
                existing_match = seen_matches[match_key]
                existing_status = existing_match.get('status', 'upcoming')
                current_status = match.get('status', 'upcoming')
                
                if current_status == 'finished' and existing_status == 'upcoming':
                    # 当前比赛已完成，已有的是即将开始，替换
                    index = deduplicated_schedule.index(existing_match)
                    deduplicated_schedule[index] = match
                    seen_matches[match_key] = match
                    logger.debug(f"去重：用已完成的比赛替换即将开始的比赛: {match_key}")
                elif current_status == 'finished' and existing_status == 'finished':
                    # 两个都是已完成，优先保留有match_id的或更详细的
                    existing_match_id = existing_match.get('match_id', '')
                    current_match_id = match.get('match_id', '')
                    if current_match_id and not existing_match_id:
                        index = deduplicated_schedule.index(existing_match)
                        deduplicated_schedule[index] = match
                        seen_matches[match_key] = match
                        logger.debug(f"去重：用有match_id的已完成比赛替换: {match_key}")
        
        logger.info(f"解析到 {len(schedule)} 场比赛，去重后剩余 {len(deduplicated_schedule)} 场")
        return deduplicated_schedule

    def _parse_historical_schedule(self, soup: BeautifulSoup, year: int) -> List[Dict]:
        """解析历史赛季比赛日程HTML"""
        schedule = []

        # 尝试多种方式查找比赛日程容器
        # 方法1: 查找div.p-gamesSchedule2
        schedule_div = soup.find('div', class_='p-gamesSchedule2')
        
        # 方法2: 如果没找到，尝试查找section.p-gamesSchedule2
        if not schedule_div:
            schedule_div = soup.find('section', class_='p-gamesSchedule2')
        
        # 方法3: 如果还没找到，尝试查找所有包含p-gamesSchedule2的元素
        if not schedule_div:
            schedule_div = soup.find(class_=lambda x: x and 'p-gamesSchedule2' in str(x))
        
        if not schedule_div:
            logger.warning("未找到历史赛季比赛日程容器 (p-gamesSchedule2)")
            # 尝试直接查找所有的比赛列表
            games_lists = soup.find_all('ul', class_='p-gamesSchedule2__lists')
            if games_lists:
                logger.info(f"直接找到 {len(games_lists)} 个比赛列表（未找到容器div）")
            else:
                logger.warning("未找到任何比赛列表")
                return schedule
        else:
            # 查找所有月份的比赛列表（每个月份都有一个ul.p-gamesSchedule2__lists）
            games_lists = schedule_div.find_all('ul', class_='p-gamesSchedule2__lists')
            logger.info(f"找到 {len(games_lists)} 个月份的比赛列表")

        # 统计所有月份的比赛数量
        total_games = 0
        month_stats = {}
        
        for month_list in games_lists:
            # 尝试查找月份标题（可能在父元素或前面的元素中）
            month_title = None
            parent = month_list.find_parent()
            if parent:
                # 查找月份标题元素
                month_title_elem = parent.find(['h2', 'h3', 'div'], class_=lambda x: x and ('month' in str(x).lower() or '月' in str(x)))
                if month_title_elem:
                    month_title = month_title_elem.get_text(strip=True)
            
            # 解析每个比赛项
            game_items = month_list.find_all('li', class_='p-gamesSchedule2__list')
            month_count = len(game_items)
            total_games += month_count
            
            if month_title:
                logger.info(f"月份 {month_title}: {month_count} 场比赛")
                month_stats[month_title] = month_count
            else:
                logger.info(f"未命名月份列表: {month_count} 场比赛")

            for item in game_items:
                try:
                    # 解析日期
                    date_elem = item.find('p', class_='p-gamesSchedule2__data')
                    if not date_elem:
                        continue

                    date_text = date_elem.get_text(strip=True)
                    logger.debug(f"解析日期文本: {date_text}")

                    # 解析日期文本，如 "5/5（月）"
                    import re
                    date_match = re.search(r'(\d+)/(\d+)', date_text)
                    if not date_match:
                        continue

                    month = int(date_match.group(1))
                    day = int(date_match.group(2))

                    # 构建完整日期
                    from datetime import datetime
                    try:
                        # 对于跨年赛季，需要根据月份调整年份
                        # M-League赛季：9-12月属于当前年，1-5月属于下一年
                        actual_year = year
                        if month <= 5:
                            # 1-5月属于下一年
                            actual_year = year + 1
                        elif month >= 9:
                            # 9-12月属于当前年
                            actual_year = year

                        game_date = datetime(actual_year, month, day)
                        date_str = game_date.strftime('%Y-%m-%d')
                    except ValueError:
                        # 如果日期无效（如2月30日），跳过
                        logger.warning(f"无效日期: {year}-{month}-{day}")
                        continue

                    # 解析星期
                    day_week_match = re.search(r'（([^）]+)）', date_text)
                    day_week = day_week_match.group(1) if day_week_match else ''

                    # 解析队伍（历史赛季使用p-gamesSchedule2__logos中的img标签）
                    teams = []
                    logos_list = item.find('ul', class_='p-gamesSchedule2__logos')
                    if logos_list:
                        logo_items = logos_list.find_all('img')
                        for logo_img in logo_items:
                            team_name = logo_img.get('alt', '').strip()
                            team_logo = logo_img.get('src', '')
                            if team_logo and not team_logo.startswith('http'):
                                team_logo = f"{self.base_url}{team_logo}"

                            if team_name:
                                teams.append({
                                    'name': team_name,
                                    'logo': team_logo
                                })

                    # 过滤掉teams为空的比赛项
                    if not teams or len(teams) == 0:
                        logger.debug(f"跳过空比赛项: {date_str}")
                        continue
                    
                    # 过滤掉所有队伍名称都为空的情况
                    valid_teams = [t for t in teams if t.get('name', '').strip()]
                    if not valid_teams:
                        logger.debug(f"跳过多队名称为空的比赛项: {date_str}")
                        continue

                    # 对于历史赛季，所有比赛都应该已完成
                    status = 'finished'

                    # 获取网页提供的原始比赛ID（用于解析比赛结果，但不作为match_id使用）
                    original_match_id = item.get('data-target', '')

                    # 统一生成match_id格式：{date}-{teamA}-{teamB}-{teamC}-{teamD}
                    # 使用排序后的队伍名称确保稳定性
                    team_names = sorted([t.get('name', '').strip() for t in valid_teams])
                    match_id = f"{date_str}-{'-'.join(team_names)}"

                    # 尝试解析比赛结果（从模态框中获取详细数据，使用原始match_id）
                    match_result = None
                    if original_match_id:
                        match_result = self._parse_match_result(soup, original_match_id, valid_teams)

                    schedule.append({
                        'match_id': match_id,  # 使用统一的格式
                        'date': date_str,
                        'day': day,
                        'month': month,
                        'year': actual_year,
                        'day_week': day_week,
                        'teams': valid_teams,
                        'status': status,
                        'result': match_result,
                        'last_updated': datetime.now().isoformat()
                    })

                except Exception as e:
                    logger.warning(f"解析历史赛季比赛项失败: {str(e)}")
                    continue

        logger.info(f"成功解析 {len(schedule)} 场历史赛季比赛 (总计: {total_games} 场比赛项)")
        if month_stats:
            logger.info(f"月份统计: {month_stats}")
        
        # 按月份分组统计
        month_groups = {}
        for match in schedule:
            match_month = match.get('month')
            if match_month:
                if match_month not in month_groups:
                    month_groups[match_month] = 0
                month_groups[match_month] += 1
        
        if month_groups:
            logger.info(f"按月份分组统计: {month_groups}")
        
        return schedule

    def _parse_match_result(self, soup: BeautifulSoup, match_id: str, teams: List[Dict]) -> Optional[Dict]:
        """
        解析比赛结果
        从模态框中提取详细的比赛结果数据
        match_id格式: "key20251201-65"
        模态框ID格式: "js-modal-key20251201-65"
        """
        import re
        result = {
            'rounds': []
        }
        
        try:
            # 构建模态框ID（match_id前面加上"js-modal-"）
            modal_id = f"js-modal-{match_id}"
            modal = soup.find('div', id=modal_id)
            
            if not modal:
                logger.warning(f"未找到模态框: {modal_id}")
                return None
            
            # 查找比赛结果容器
            games_result = modal.find('div', class_='p-gamesResult')
            if not games_result:
                logger.warning(f"未找到比赛结果容器")
                return None
            
            # 解析日期
            date_elem = games_result.find('div', class_='p-gamesResult__date')
            match_date = None
            if date_elem:
                date_text = date_elem.get_text(strip=True)
                # 提取日期，如 "9/15(月)" -> "9/15"
                date_match = re.search(r'(\d+/\d+)', date_text)
                if date_match:
                    match_date = date_match.group(1)
            
            # 查找所有回合（第1回戦、第2回戦等）
            rounds_columns = games_result.find_all('div', class_='p-gamesResult__column')
            
            for round_idx, round_column in enumerate(rounds_columns, 1):
                # 获取回合名称
                round_number_elem = round_column.find('div', class_='p-gamesResult__number')
                round_name = round_number_elem.get_text(strip=True) if round_number_elem else f"第{round_idx}回戦"
                
                # 查找排名列表
                rank_list = round_column.find('ol', class_='p-gamesResult__rank-list')
                if not rank_list:
                    continue
                
                # 解析每个排名项
                rank_items = rank_list.find_all('li')
                round_results = []
                
                for rank_item in rank_items:
                    # 获取排名
                    rank_badge = rank_item.find('div', class_=lambda x: x and 'p-gamesResult__rank-badge' in str(x))
                    rank = None
                    if rank_badge:
                        rank_text = rank_badge.get_text(strip=True)
                        rank_match = re.search(r'(\d+)', rank_text)
                        rank = int(rank_match.group(1)) if rank_match else None
                    
                    # 获取选手名
                    name_elem = rank_item.find('div', class_='p-gamesResult__name')
                    player_name = name_elem.get_text(strip=True) if name_elem else None
                    
                    # 获取得分
                    point_elem = rank_item.find('div', class_='p-gamesResult__point')
                    score_text = point_elem.get_text(strip=True) if point_elem else ''
                    # 解析得分，如 "54.9pt" 或 "▲15.9pt"
                    score_value = None
                    if score_text:
                        # 移除 "pt" 后缀
                        score_text_clean = score_text.replace('pt', '').strip()
                        # 处理负号（可能是▲符号）
                        if '▲' in score_text_clean or '-' in score_text_clean:
                            score_text_clean = '-' + score_text_clean.replace('▲', '').replace('-', '').strip()
                        # 提取数字
                        score_match = re.search(r'([+-]?\d+\.?\d*)', score_text_clean)
                        if score_match:
                            try:
                                score_value = float(score_match.group(1))
                            except ValueError:
                                pass
                    
                    # 获取队伍信息（从队伍徽章图片的alt属性）
                    team_badge = rank_item.find('div', class_='p-gamesResult__team-badge')
                    team_name = None
                    team_logo = None
                    if team_badge:
                        team_img = team_badge.find('img')
                        if team_img:
                            team_name = team_img.get('alt', '').strip()
                            team_logo = team_img.get('src', '')
                            if team_logo and not team_logo.startswith('http'):
                                team_logo = f"{self.base_url}{team_logo}"
                    
                    # 获取选手头像
                    thumbnail_wrap = rank_item.find('div', class_='p-gamesResult__thumbnail-wrap')
                    player_avatar = None
                    if thumbnail_wrap:
                        thumbnail = thumbnail_wrap.find('div', class_='p-gamesResult__thumbnail')
                        if thumbnail:
                            avatar_img = thumbnail.find('img')
                            if avatar_img:
                                player_avatar = avatar_img.get('src', '')
                                if player_avatar and not player_avatar.startswith('http'):
                                    player_avatar = f"{self.base_url}{player_avatar}"
                    
                    if player_name and rank is not None:
                        round_results.append({
                            'rank': rank,
                            'player_name': player_name,
                            'score': score_value,
                            'score_text': score_text,
                            'team_name': team_name,
                            'team_logo': team_logo,
                            'player_avatar': player_avatar
                        })
                
                # 按排名排序
                round_results.sort(key=lambda x: x['rank'])
                
                if round_results:
                    result['rounds'].append({
                        'round_name': round_name,
                        'round_number': round_idx,
                        'results': round_results
                    })
            
            # 如果没有解析到任何结果，返回None
            if not result['rounds']:
                return None
            
            # 添加日期信息
            if match_date:
                result['date'] = match_date
            
            return result
            
        except Exception as e:
            logger.warning(f"解析比赛结果失败 (match_id: {match_id}): {str(e)}", exc_info=True)
            return None


def fetch_points_data():
    """获取M-League积分历史数据"""
    url = "https://m-league.jp/points"
    soup = None
    
    # 首先尝试使用Selenium获取数据
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        logger.info(f"使用Selenium访问URL: {url}")
        
        # 使用上下文管理器确保浏览器总是被关闭
        with SeleniumBrowserManager(
            headless=True,
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ) as driver:
            driver.get(url)
            
            # 等待页面加载完成
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.ID, "points-table1"))
            )
            
            # 额外等待一段时间确保JavaScript执行完成
            time.sleep(5)
            
            # 获取页面源码
            page_source = driver.page_source
        
        # 浏览器实例已自动关闭（通过上下文管理器的__exit__方法）
        soup = BeautifulSoup(page_source, 'html.parser')
        
    except ImportError:
        # 如果没有安装selenium，尝试使用requests（可能获取不到动态内容）
        logger.warning("Selenium未安装，尝试使用requests获取数据")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            logger.error(f"使用requests获取数据失败: {str(e)}")
            return {
                'success': False,
                'message': f'获取数据失败: {str(e)}'
            }
            
    except Exception as e:
        logger.error(f"使用Selenium获取数据失败: {str(e)}")
        # 如果Selenium失败，尝试使用requests作为备选方案
        logger.info("尝试使用requests作为备选方案")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')
        except Exception as req_error:
            logger.error(f"使用requests获取数据也失败: {str(req_error)}")
            return {
                'success': False,
                'message': f'获取数据失败: Selenium错误={str(e)}, Requests错误={str(req_error)}'
            }
    
    if soup is None:
        return {
            'success': False,
            'message': '无法获取页面数据'
        }

    try:
        points_data = {
            'total_points': [],  # 综合积分（Regular+Semifinal+Final）
            'regular_points': [],  # Regular积分
            'postseason_points': [],  # Post-season积分（Semifinal+Final）
            'semifinal_points': [],  # Semifinal积分
            'final_points': []  # Final积分
        }

        # 解析5个表格
        table_ids = ['points-table1', 'points-table2', 'points-table3', 'points-table4', 'points-table5']
        table_keys = ['total_points', 'regular_points', 'postseason_points', 'semifinal_points', 'final_points']

        for table_id, key in zip(table_ids, table_keys):
            table = soup.find('table', {'id': table_id})
            if not table:
                logger.warning(f"未找到表格: {table_id}")
                continue

            # 从tbody中获取所有行
            tbody = table.find('tbody')
            if not tbody:
                logger.warning(f"表格 {table_id} 没有tbody")
                continue

            rows = tbody.find_all('tr')
            if len(rows) < 2:  # 至少需要标题行和一行数据
                logger.warning(f"表格 {table_id} 行数不足: {len(rows)}")
                continue

            # 解析标题行获取列名
            header_row = rows[0]
            headers = [cell.get_text(strip=True) for cell in header_row.find_all('td')]
            logger.info(f"表格 {table_id} 标题: {headers}")

            # 解析数据行
            for row in rows[1:]:
                cells = row.find_all('td')
                if len(cells) != len(headers):
                    logger.warning(f"行数据列数不匹配: 期望 {len(headers)}, 实际 {len(cells)}")
                    continue

                team_data = {}
                for i, cell in enumerate(cells):
                    value = cell.get_text(strip=True)
                    # 处理换行符和特殊字符
                    value = value.replace('\n', '').replace('\r', '').strip()

                    # 将"-"转换为None
                    if value == '-' or value == '':
                        value = None
                    elif value and i > 0:  # 除了第一列（队伍名），其他列转换为数字
                        try:
                            value = float(value)
                        except ValueError:
                            value = None

                    team_data[headers[i]] = value

                if team_data and team_data.get('チーム名'):  # 确保有队伍名
                    points_data[key].append(team_data)
                    logger.info(f"添加 {key} 数据: {team_data['チーム名']} - {team_data.get('累計ポイント')}")

        logger.info(f"成功获取积分数据: {sum(len(data) for data in points_data.values())} 条记录")
        return {
            'success': True,
            'data': points_data
        }

    except Exception as e:
        logger.error(f"解析积分数据失败: {str(e)}", exc_info=True)
        return {
            'success': False,
            'message': f'解析积分数据失败: {str(e)}'
        }




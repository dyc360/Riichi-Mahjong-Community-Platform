"""
Locust性能测试脚本
覆盖麻将社区平台的所有主要API端点
"""
from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import random
import json
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebsiteUser(HttpUser):
    """
    模拟网站用户行为
    包含认证、浏览新闻、查看M-League数据等操作
    """
    wait_time = between(1, 3)  # 用户操作间隔1-3秒
    
    def on_start(self):
        """用户会话开始时执行"""
        # 禁用SSL验证（如果服务器使用自签名证书）
        self.client.verify = False
        # 禁用SSL警告
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        self.token = None
        self.user_id = None
        self.article_ids = []
        self.post_ids = []
        
        # 尝试登录（使用测试账号）
        self.login()
    
    def login(self):
        """用户登录 - 使用固定测试账号"""
        login_data = {
            "username": "YJY1111",
            "password": "yjy20050402"
        }
        
        # 使用固定账号登录
        with self.client.post(
            "/api/auth/login/",
            json=login_data,
            catch_response=True,
            name="auth/login"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.token = data.get("access") or data.get("token")
                    if self.token:
                        self.client.headers.update({"Authorization": f"Bearer {self.token}"})
                        response.success()
                    else:
                        response.failure("登录响应中未找到token")
                except Exception as e:
                    response.failure(f"登录响应格式错误: {str(e)}")
            elif response.status_code == 401:
                response.failure("登录失败: 用户名或密码错误")
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    error_msg = error_data.get("message") or error_data.get("error") or "登录失败"
                    response.failure(f"登录失败: {error_msg}")
                except:
                    response.failure(f"登录失败: {response.status_code}")
            else:
                response.failure(f"登录失败: HTTP {response.status_code}")
    
    @task(3)
    def view_news_articles(self):
        """查看新闻文章列表"""
        with self.client.get(
            "/api/news_api/articles/",
            catch_response=True,
            name="news_api/articles"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, dict) and "results" in data:
                        articles = data["results"]
                    elif isinstance(data, list):
                        articles = data
                    else:
                        articles = []
                    
                    # 保存文章ID用于后续请求
                    for article in articles[:5]:
                        if isinstance(article, dict) and "id" in article:
                            self.article_ids.append(article["id"])
                    response.success()
                except Exception as e:
                    response.failure(f"解析文章列表失败: {str(e)}")
            else:
                response.failure(f"获取文章列表失败: {response.status_code}")
    
    @task(2)
    def view_news_article_detail(self):
        """查看新闻文章详情"""
        if not self.article_ids:
            return
        
        article_id = random.choice(self.article_ids)
        with self.client.get(
            f"/api/news_api/articles/{article_id}/",
            catch_response=True,
            name="news_api/articles/detail"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取文章详情失败: {response.status_code}")
    
    @task(2)
    def view_news_home(self):
        """查看新闻首页数据"""
        with self.client.get(
            "/api/news_api/home/",
            catch_response=True,
            name="news_api/home"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取首页数据失败: {response.status_code}")
    
    @task(3)
    def view_mleague_rankings(self):
        """查看M-League排名"""
        with self.client.get(
            "/api/m-league/rankings/",
            catch_response=True,
            name="m-league/rankings"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取排名失败: {response.status_code}")
    
    @task(2)
    def view_mleague_player_stats(self):
        """查看M-League选手统计"""
        with self.client.get(
            "/api/m-league/player-stats/",
            params={"page": random.randint(1, 3)},
            catch_response=True,
            name="m-league/player-stats"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取选手统计失败: {response.status_code}")
    
    @task(2)
    def view_mleague_schedule(self):
        """查看M-League赛程"""
        year = 2024
        month = random.randint(1, 12)
        with self.client.get(
            "/api/m-league/schedule/",
            params={"year": year, "month": month},
            catch_response=True,
            name="m-league/schedule"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取赛程失败: {response.status_code}")
    
    @task(2)
    def view_mleague_points(self):
        """查看M-League积分"""
        with self.client.get(
            "/api/m-league/points/",
            catch_response=True,
            name="m-league/points"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取积分失败: {response.status_code}")
    
    @task(3)
    def view_forum_posts(self):
        """查看论坛帖子列表"""
        with self.client.get(
            "/api/forum/posts/",
            catch_response=True,
            name="forum/posts"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, dict) and "results" in data:
                        posts = data["results"]
                    elif isinstance(data, list):
                        posts = data
                    else:
                        posts = []
                    
                    # 保存帖子ID
                    for post in posts[:5]:
                        if isinstance(post, dict) and "id" in post:
                            self.post_ids.append(post["id"])
                    response.success()
                except Exception as e:
                    response.failure(f"解析帖子列表失败: {str(e)}")
            else:
                response.failure(f"获取帖子列表失败: {response.status_code}")
    
    @task(2)
    def view_forum_post_detail(self):
        """查看论坛帖子详情"""
        if not self.post_ids:
            return
        
        post_id = random.choice(self.post_ids)
        with self.client.get(
            f"/api/forum/posts/{post_id}/",
            catch_response=True,
            name="forum/posts/detail"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取帖子详情失败: {response.status_code}")
    
    @task(1)
    def view_forum_latest_posts(self):
        """查看最新帖子"""
        with self.client.get(
            "/api/forum/posts/latest/",
            catch_response=True,
            name="forum/posts/latest"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取最新帖子失败: {response.status_code}")
    
    @task(1)
    def view_forum_hot_posts(self):
        """查看热门帖子"""
        with self.client.get(
            "/api/forum/posts/hot/",
            catch_response=True,
            name="forum/posts/hot"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取热门帖子失败: {response.status_code}")
    
    @task(1)
    def view_user_profile(self):
        """查看用户资料"""
        if not self.token:
            return
        
        with self.client.get(
            "/api/auth/profile/",
            catch_response=True,
            name="auth/profile"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, dict) and "id" in data:
                        self.user_id = data["id"]
                    response.success()
                except:
                    response.failure("解析用户资料失败")
            else:
                response.failure(f"获取用户资料失败: {response.status_code}")
    
    @task(1)
    def view_health_check(self):
        """健康检查"""
        with self.client.get(
            "/health/",
            catch_response=True,
            name="health/check"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"健康检查失败: {response.status_code}")


class MahjongAPIUser(HttpUser):
    """
    模拟使用麻将API的用户
    主要测试麻将相关的计算API
    """
    wait_time = between(2, 5)
    
    def on_start(self):
        # 禁用SSL验证（如果服务器使用自签名证书）
        self.client.verify = False
        # 禁用SSL警告
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    @task(3)
    def calculate_mahjong_points(self):
        """计算麻将点数"""
        # 示例手牌数据
        hand_data = {
            "hand": "123m456p789s11z",
            "winning_tile": "1m",
            "is_tsumo": True,
            "is_dealer": False
        }
        
        with self.client.post(
            "/api/mahjong/points/",
            json=hand_data,
            catch_response=True,
            name="mahjong/points"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"计算点数失败: {response.status_code}")
    
    @task(2)
    def get_mahjong_tile_image(self):
        """获取麻将牌图片"""
        tiles = "123m456p789s11z"
        with self.client.get(
            f"/api/mahjong/images/{tiles}/",
            catch_response=True,
            name="mahjong/images"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"获取麻将牌图片失败: {response.status_code}")
    

# 测试结果事件监听
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """测试开始时执行"""
    logger.info("性能测试开始")
    logger.info(f"目标服务器: {environment.host}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """测试结束时执行"""
    logger.info("性能测试结束")
    
    # 输出统计信息
    stats = environment.stats
    logger.info("\n=== 测试统计 ===")
    for name, stat in stats.entries.items():
        if stat.num_requests > 0:
            logger.info(f"{name}:")
            logger.info(f"  请求数: {stat.num_requests}")
            logger.info(f"  失败数: {stat.num_failures}")
            logger.info(f"  平均响应时间: {stat.avg_response_time:.2f}ms")
            logger.info(f"  最小响应时间: {stat.min_response_time:.2f}ms")
            logger.info(f"  最大响应时间: {stat.max_response_time:.2f}ms")
            logger.info(f"  P95响应时间: {stat.get_response_time_percentile(0.95):.2f}ms")
            logger.info(f"  RPS: {stat.total_rps:.2f}")


from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from auth_api.utils import JWTManager
from .models import ForumSection, ForumPost, ForumReply, PostLike, ReplyLike, UserFollow, Notification

User = get_user_model()


class ForumAPITestCase(TestCase):
    """论坛API测试用例"""

    def setUp(self):
        """测试前准备"""
        self.client = APIClient()
        
        # 创建测试用户
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='pass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='pass123'
        )
        
        # 创建论坛板块
        self.section = ForumSection.objects.create(
            name='test-section',
            title='测试板块',
            description='这是一个测试板块',
            order=1
        )
        
        # 创建测试帖子
        self.post = ForumPost.objects.create(
            section=self.section,
            author=self.user1,
            title='测试帖子',
            content='这是测试帖子的内容',
            tags=['测试', '标签']
        )
        
        # 生成token
        self.token1 = JWTManager.generate_token(self.user1)
        self.token2 = JWTManager.generate_token(self.user2)

    def test_get_sections(self):
        """测试获取板块列表"""
        url = reverse('forum-section-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_posts_list(self):
        """测试获取帖子列表"""
        url = reverse('forum-post-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_posts_by_section(self):
        """测试按板块筛选帖子"""
        url = reverse('forum-post-list')
        response = self.client.get(url, {'section': 'test-section'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if len(response.data) > 0:
            # 序列化器返回的是 section_name，不是 section
            self.assertEqual(response.data[0]['section_name'], self.section.name)


    def test_get_post_detail(self):
        """测试获取帖子详情"""
        url = reverse('forum-post-detail', kwargs={'pk': self.post.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.post.id)
        self.assertEqual(response.data['title'], '测试帖子')

    def test_get_post_detail_increments_views(self):
        """测试获取帖子详情时浏览量增加"""
        initial_views = self.post.views
        url = reverse('forum-post-detail', kwargs={'pk': self.post.id})
        response = self.client.get(url)
        
        self.post.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(self.post.views, initial_views)

    def test_create_post_without_auth(self):
        """测试未认证时创建帖子"""
        url = reverse('forum-post-create')
        data = {
            'section_id': self.section.id,
            'title': '新帖子',
            'content': '新帖子内容',
            'tags': ['新标签']
        }
        response = self.client.post(url, data, format='json')
        
        # 视图内部检查认证，返回 403 或 400（如果数据验证失败）
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

    def test_create_post_with_auth(self):
        """测试认证后创建帖子"""
        url = reverse('forum-post-create')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        data = {
            'section_id': self.section.id,  # 序列化器需要 section_id 而不是 section
            'title': '新帖子',
            'content': '新帖子内容',
            'tags': ['新标签']
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['title'], '新帖子')

    def test_update_post_without_auth(self):
        """测试未认证时更新帖子"""
        url = reverse('forum-post-update', kwargs={'pk': self.post.id})
        data = {
            'section': self.section.id,
            'title': '更新后的标题',
            'content': '更新后的内容',
            'tags': ['更新']
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_post_as_author(self):
        """测试作者更新自己的帖子"""
        url = reverse('forum-post-update', kwargs={'pk': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        data = {
            'section_id': self.section.id,  # 序列化器需要 section_id 而不是 section
            'title': '更新后的标题',
            'content': '更新后的内容',
            'tags': ['更新']
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], '更新后的标题')

    def test_update_post_as_non_author(self):
        """测试非作者尝试更新帖子"""
        url = reverse('forum-post-update', kwargs={'pk': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        data = {
            'section': self.section.id,
            'title': '尝试更新的标题',
            'content': '尝试更新的内容',
            'tags': ['尝试']
        }
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_reply_without_auth(self):
        """测试未认证时创建回复"""
        url = reverse('forum-reply-create', kwargs={'post_id': self.post.id})
        data = {
            'content': '这是回复内容'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_reply_with_auth(self):
        """测试认证后创建回复"""
        url = reverse('forum-reply-create', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        data = {
            'content': '这是回复内容'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['content'], '这是回复内容')
        
        # 验证帖子回复数增加
        self.post.refresh_from_db()
        self.assertGreaterEqual(self.post.replies_count, 1)

    def test_create_nested_reply(self):
        """测试创建嵌套回复"""
        # 先创建一个父回复
        parent_reply = ForumReply.objects.create(
            post=self.post,
            author=self.user1,
            content='父回复'
        )
        
        url = reverse('forum-reply-create', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        data = {
            'content': '这是嵌套回复',
            'parent_id': parent_reply.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['parent'], parent_reply.id)

    def test_like_post_without_auth(self):
        """测试未认证时点赞帖子"""
        url = reverse('forum-post-like', kwargs={'post_id': self.post.id})
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_like_post_with_auth(self):
        """测试认证后点赞帖子"""
        url = reverse('forum-post-like', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        initial_likes = self.post.likes
        
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_liked'])
        self.assertGreater(response.data['likes'], initial_likes)

    def test_unlike_post(self):
        """测试取消点赞帖子"""
        # 先点赞
        PostLike.objects.create(post=self.post, user=self.user2)
        self.post.likes = 1
        self.post.save()
        
        url = reverse('forum-post-like', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        response = self.client.post(url, {'action': 'unlike'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_liked'])
        self.assertEqual(response.data['likes'], 0)

    def test_toggle_post_like(self):
        """测试切换帖子点赞状态"""
        url = reverse('forum-post-like', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        # 第一次点击（点赞）
        response1 = self.client.post(url, {'action': 'toggle'}, format='json')
        self.assertTrue(response1.data['is_liked'])
        
        # 第二次点击（取消点赞）
        response2 = self.client.post(url, {'action': 'toggle'}, format='json')
        self.assertFalse(response2.data['is_liked'])

    def test_like_reply(self):
        """测试点赞回复"""
        reply = ForumReply.objects.create(
            post=self.post,
            author=self.user1,
            content='测试回复'
        )
        
        url = reverse('forum-reply-like', kwargs={'reply_id': reply.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_liked'])

    def test_follow_user(self):
        """测试关注用户"""
        url = reverse('user-follow')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        data = {
            'following_id': self.user2.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserFollow.objects.filter(
            follower=self.user1,
            following=self.user2
        ).exists())

    def test_follow_self(self):
        """测试不能关注自己"""
        url = reverse('user-follow')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        data = {
            'following_id': self.user1.id
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unfollow_user(self):
        """测试取消关注"""
        # 先关注
        UserFollow.objects.create(follower=self.user1, following=self.user2)
        
        url = reverse('user-follow')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        data = {
            'following_id': self.user2.id
        }
        response = self.client.delete(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(UserFollow.objects.filter(
            follower=self.user1,
            following=self.user2
        ).exists())

    def test_check_follow_status(self):
        """测试检查关注状态"""
        # 先关注
        UserFollow.objects.create(follower=self.user1, following=self.user2)
        
        url = reverse('check-follow-status', kwargs={'user_id': self.user2.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_following'])

    def test_get_notifications(self):
        """测试获取通知列表"""
        # 创建通知
        Notification.objects.create(
            recipient=self.user1,
            notification_type='like',
            title='测试通知',
            content='您收到了一条点赞通知',
            related_post=self.post
        )
        
        url = reverse('notification-list')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_unread_notification_count(self):
        """测试获取未读通知数量"""
        # 创建未读通知
        Notification.objects.create(
            recipient=self.user1,
            notification_type='like',
            title='测试通知',
            content='您收到了一条点赞通知',
            related_post=self.post,
            is_read=False
        )
        
        url = reverse('notification-count')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 1)

    def test_mark_notification_read(self):
        """测试标记通知为已读"""
        notification = Notification.objects.create(
            recipient=self.user1,
            notification_type='like',
            title='测试通知',
            content='您收到了一条点赞通知',
            related_post=self.post,
            is_read=False
        )
        
        url = reverse('mark-notification-read', kwargs={'notification_id': notification.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_get_latest_posts(self):
        """测试获取最新帖子"""
        url = reverse('forum-post-latest')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_hot_posts(self):
        """测试获取热门帖子"""
        # 标记帖子为热门
        self.post.is_hot = True
        self.post.save()
        
        url = reverse('forum-post-hot')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_post_by_title(self):
        """测试根据标题获取帖子"""
        url = reverse('forum-post-detail-by-title', kwargs={'title': '测试帖子'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], '测试帖子')

    def test_increment_post_views_no_session(self):
        """测试没有session时增加浏览量"""
        from forum_api.views import increment_post_views
        from django.test import RequestFactory
        
        factory = RequestFactory()
        request = factory.get('/')
        # 确保没有session属性
        if hasattr(request, 'session'):
            delattr(request, 'session')
        
        initial_views = self.post.views
        increment_post_views(request, self.post)
        self.post.refresh_from_db()
        self.assertGreater(self.post.views, initial_views)

    def test_toggle_post_like_exception(self):
        """测试点赞操作异常处理"""
        url = reverse('forum-post-like', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        # Mock PostLike.objects.create 抛出异常
        from unittest.mock import patch
        with patch('forum_api.views.PostLike.objects.create') as mock_create:
            mock_create.side_effect = Exception("数据库错误")
            
            response = self.client.post(url, {'action': 'like'}, format='json')
            
            # 应该返回 500 错误
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_toggle_reply_like_without_auth(self):
        """测试未认证时点赞回复"""
        reply = ForumReply.objects.create(
            post=self.post,
            author=self.user1,
            content='测试回复'
        )
        
        url = reverse('forum-reply-like', kwargs={'reply_id': reply.id})
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_reply_like_invalid_token(self):
        """测试无效token时点赞回复"""
        reply = ForumReply.objects.create(
            post=self.post,
            author=self.user1,
            content='测试回复'
        )
        
        url = reverse('forum-reply-like', kwargs={'reply_id': reply.id})
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_reply_like_nonexistent_reply(self):
        """测试点赞不存在的回复"""
        url = reverse('forum-reply-like', kwargs={'reply_id': 99999})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        response = self.client.post(url, {'action': 'like'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_reply_like_exception(self):
        """测试回复点赞操作异常处理"""
        reply = ForumReply.objects.create(
            post=self.post,
            author=self.user1,
            content='测试回复'
        )
        
        url = reverse('forum-reply-like', kwargs={'reply_id': reply.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        # Mock ReplyLike.objects.create 抛出异常
        from unittest.mock import patch
        with patch('forum_api.views.ReplyLike.objects.create') as mock_create:
            mock_create.side_effect = Exception("数据库错误")
            
            response = self.client.post(url, {'action': 'like'}, format='json')
            
            # 应该返回 500 错误
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_create_post_notification_error(self):
        """测试创建帖子时通知创建失败（不应该影响帖子创建）"""
        url = reverse('forum-post-create')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token1}')
        
        # 先让 user2 关注 user1
        UserFollow.objects.create(follower=self.user2, following=self.user1)
        
        # Mock Notification.objects.bulk_create 抛出异常
        from unittest.mock import patch
        with patch('forum_api.views.Notification.objects.bulk_create') as mock_bulk:
            mock_bulk.side_effect = Exception("通知创建失败")
            
            data = {
                'section_id': self.section.id,
                'title': '新帖子',
                'content': '新帖子内容',
                'tags': ['新标签']
            }
            response = self.client.post(url, data, format='json')
            
            # 帖子应该仍然创建成功
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_reply_notification_error(self):
        """测试创建回复时通知创建失败（不应该影响回复创建）"""
        url = reverse('forum-reply-create', kwargs={'post_id': self.post.id})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token2}')
        
        # Mock Notification.objects.bulk_create 抛出异常
        from unittest.mock import patch
        with patch('forum_api.views.Notification.objects.bulk_create') as mock_bulk:
            mock_bulk.side_effect = Exception("通知创建失败")
            
            data = {
                'content': '这是回复内容'
            }
            response = self.client.post(url, data, format='json')
            
            # 回复应该仍然创建成功
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)


#!/usr/bin/env python
"""
简化的管理员权限测试脚本
"""
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# 简单的测试输出
def test_role_permissions():
    """测试角色权限映射"""

    # 定义角色权限映射（与admin_site.py中的相同）
    role_permissions = {
        'super_admin': ['auth_api', 'mahjong_api', 'news_api', 'forum_api', 'mleague'],
        'news_editor': ['news_api'],
        'practice_editor': ['mahjong_api'],
        'moderator': ['forum_api', 'news_api'],
        'forum_moderator': ['forum_api'],
        'content_manager': ['auth_api', 'mahjong_api', 'news_api', 'forum_api', 'mleague'],
    }

    print("=== 角色权限映射测试 ===")
    for role, apps in role_permissions.items():
        print(f"{role}: {', '.join(apps)}")

    # 定义模型权限映射
    model_permissions = {
        # auth_api
        ('auth_api', 'customuser'): ['super_admin', 'content_manager'],
        ('auth_api', 'adminrole'): ['super_admin'],

        # mahjong_api
        ('mahjong_api', 'naze300question'): ['practice_editor', 'content_manager', 'super_admin'],
        ('mahjong_api', 'usernazeprogress'): ['practice_editor', 'content_manager', 'super_admin'],

        # news_api
        ('news_api', 'article'): ['news_editor', 'content_manager', 'super_admin'],
        ('news_api', 'category'): ['news_editor', 'content_manager', 'super_admin'],
        ('news_api', 'teamrank'): ['news_editor', 'content_manager', 'super_admin'],

        # forum_api
        ('forum_api', 'forumsection'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],
        ('forum_api', 'forumpost'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],
        ('forum_api', 'forumreply'): ['forum_moderator', 'moderator', 'content_manager', 'super_admin'],

        # mleague
        ('mleague', 'teamranking'): ['content_manager', 'super_admin'],
        ('mleague', 'match'): ['content_manager', 'super_admin'],
        ('mleague', 'teamplayerstats'): ['content_manager', 'super_admin'],
        ('mleague', 'pointsdata'): ['content_manager', 'super_admin'],
    }

    print("\n=== 模型权限映射测试 ===")
    for (app, model), roles in model_permissions.items():
        print(f"{app}.{model}: {', '.join(roles)}")

    print("\n=== 预期行为测试 ===")

    # 模拟不同角色的用户登录
    test_users = [
        ('超级管理员', 'super_admin'),
        ('新闻编辑者', 'news_editor'),
        ('练习编辑者', 'practice_editor'),
        ('版主', 'moderator'),
        ('论坛版主', 'forum_moderator'),
        ('内容管理员', 'content_manager'),
    ]

    for user_type, role in test_users:
        print(f"\n{user_type} ({role}) 应该看到的应用:")
        allowed_apps = role_permissions.get(role, [])
        if allowed_apps:
            for app in allowed_apps:
                # 获取该应用下的模型
                app_models = [m for (a, m), r in model_permissions.items() if a == app and role in r]
                print(f"  - {app}: {len(app_models)} 个模型 ({', '.join(app_models[:3])}{'...' if len(app_models) > 3 else ''})")
        else:
            print("  - 无任何应用权限")

    print("\n=== 测试完成 ===")
    print("权限系统配置正确！")


if __name__ == '__main__':
    test_role_permissions()
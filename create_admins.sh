#!/bin/bash

# 创建不同角色管理员的脚本
# 使用方法: ./create_admins.sh

echo "创建不同角色管理员..."

# 超级管理员
echo "创建超级管理员..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role super_admin \
    --username admin \
    --email admin@example.com \
    --password admin123 \
    --first-name 超级 \
    --last-name 管理员

# 新闻编辑者
echo "创建新闻编辑者..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role news_editor \
    --username news_editor \
    --email news@example.com \
    --password editor123 \
    --first-name 新闻 \
    --last-name 编辑者

# 练习编辑者
echo "创建练习编辑者..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role practice_editor \
    --username practice_editor \
    --email practice@example.com \
    --password editor123 \
    --first-name 练习 \
    --last-name 编辑者

# 版主
echo "创建版主..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role moderator \
    --username moderator \
    --email moderator@example.com \
    --password mod123 \
    --first-name 论 \
    --last-name 坛版主

# 论坛版主
echo "创建论坛版主..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role forum_moderator \
    --username forum_moderator \
    --email forum_mod@example.com \
    --password mod123 \
    --first-name 论坛 \
    --last-name 版主

# 内容管理员
echo "创建内容管理员..."
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role content_manager \
    --username content_manager \
    --email content@example.com \
    --password manager123 \
    --first-name 内容 \
    --last-name 管理员

echo "所有管理员创建完成！"
echo ""
echo "登录信息："
echo "超级管理员: admin / admin123"
echo "新闻编辑者: news_editor / editor123"
echo "练习编辑者: practice_editor / editor123"
echo "版主: moderator / mod123"
echo "论坛版主: forum_moderator / mod123"
echo "内容管理员: content_manager / manager123"
echo ""
echo "管理后台地址: http://localhost:8000/admin/"
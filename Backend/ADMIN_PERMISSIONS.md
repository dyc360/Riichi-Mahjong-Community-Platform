# 管理员权限管理系统

## 概述

本系统实现了基于角色的管理员权限管理，不同权限的管理员只能执行特定操作，并且在登录后台管理界面时只能看到他们有权限管理的模块。

## 管理员角色

系统预定义了以下管理员角色：

1. **超级管理员 (super_admin)** - 拥有系统所有权限，可以看到所有模块
2. **新闻编辑者 (news_editor)** - 负责新闻内容的编辑和管理，只看到新闻相关模块
3. **练习编辑者 (practice_editor)** - 负责练习题目的编辑和管理，只看到练习相关模块
4. **版主 (moderator)** - 负责论坛内容的审核和管理，看到论坛和新闻模块
5. **论坛版主 (forum_moderator)** - 专门负责论坛内容的审核和管理，只看到论坛模块
6. **内容管理员 (content_manager)** - 负责各类内容的综合管理和审核，看到所有内容模块

## 界面显示控制

### 基于角色的模块过滤
- **超级管理员**: 可以看到所有应用和模块
- **新闻编辑者**: 只显示 `news_api` 应用（文章、分类、队伍排名）
- **练习编辑者**: 只显示 `mahjong_api` 应用（练习题目、用户进度）
- **版主**: 显示 `forum_api` 和 `news_api` 应用
- **论坛版主**: 只显示 `forum_api` 应用（论坛板块、帖子、回复）
- **内容管理员**: 显示所有内容相关应用（`auth_api`、`mahjong_api`、`news_api`、`forum_api`、`mleague`）

### 权限检查机制
系统通过以下方式控制界面显示：
1. **应用级过滤**: 根据用户角色过滤整个应用
2. **模型级过滤**: 在应用内进一步过滤具体模型
3. **操作级权限**: 每个模型的增删改查操作都有独立的权限控制

## 权限说明

## 权限说明

### 练习题目管理 (Naze300Question)
- **添加**: practice_editor, content_manager, super_admin
- **编辑**: practice_editor, content_manager, super_admin
- **删除**: content_manager, super_admin, practice-editor组, moderator组
- **查看**: practice_editor, content_manager, super_admin, practice-editor组, moderator组, staff用户

### 新闻管理 (Article, Category, TeamRank)
- **添加**: news_editor, content_manager, super_admin
- **编辑**: news_editor, content_manager, super_admin
- **删除**: content_manager, super_admin, news-editor组, moderator组
- **查看**: news_editor, content_manager, super_admin, news-editor组, moderator组, staff用户

### 论坛管理 (ForumSection, ForumPost, ForumReply)
- **添加**: forum_moderator, content_manager, super_admin (ForumSection)
- **编辑**: forum_moderator, content_manager, super_admin
- **删除**: forum_moderator, content_manager, super_admin, moderator组, forum_moderator组
- **查看**: forum_moderator, content_manager, super_admin, moderator组, forum_moderator组, staff用户

## 使用方法

### 1. 加载角色数据
```bash
cd Backend
python manage.py load_admin_roles
```

### 2. 在Django Admin中分配角色
1. 进入Django Admin界面 (`/admin`)
2. 选择 "用户" -> 编辑用户
3. 在 "角色" 字段中选择合适的管理员角色
4. 保存用户

### 3. 登录测试
使用不同角色的用户登录后台，会看到不同的界面：
- 新闻编辑者登录后只看到"新闻API"应用
- 练习编辑者登录后只看到"麻将API"应用
- 版主登录后看到"论坛API"和"新闻API"应用
- 超级管理员看到所有应用

### 4. 传统组权限兼容
系统仍然支持基于Django用户组的权限分配：
- `news-editor` 组
- `practice-editor` 组
- `moderator` 组
- `forum_moderator` 组

## 技术实现

### 自定义AdminSite
系统使用自定义的 `RoleBasedAdminSite` 类：
- 重写 `get_app_list()` 方法根据用户角色过滤应用
- 重写 `has_permission()` 方法控制访问权限
- 实现 `_user_has_model_permission()` 方法进行细粒度权限检查

### 权限继承
- 超级用户拥有所有权限
- 角色权限优先于组权限
- 向后兼容现有的组权限系统

## 注意事项

1. 超级用户 (`is_superuser=True`) 拥有所有权限和完整的界面访问
2. 角色权限系统与传统的Django组权限系统兼容
3. 如果用户既没有角色也没有相关组，则无法访问管理界面
4. 建议为管理员用户设置 `is_staff=True` 以确保他们可以访问Admin界面
5. 界面过滤是实时的，根据用户的当前角色动态显示
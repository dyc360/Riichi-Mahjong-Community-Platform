# 创建不同角色管理员

本项目支持创建不同角色的管理员，每个角色有不同的权限范围。

## 可用角色

- `super_admin`: 超级管理员 - 可以管理所有模块
- `news_editor`: 新闻编辑者 - 只能管理新闻相关内容
- `practice_editor`: 练习编辑者 - 只能管理麻将练习内容
- `moderator`: 版主 - 可以管理论坛和新闻内容
- `forum_moderator`: 论坛版主 - 只能管理论坛内容
- `content_manager`: 内容管理员 - 可以管理内容相关模块

## Docker命令创建管理员

### 基本语法

```bash
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role <角色名> \
    --username <用户名> \
    --email <邮箱> \
    --password <密码> \
    --first-name <名> \
    --last-name <姓>
```

### 参数说明

- `--role`: 必需，角色名称（见上文可用角色）
- `--username`: 必需，用户名
- `--email`: 必需，邮箱地址
- `--password`: 可选，默认密码为 `admin123`
- `--first-name`: 可选，名字
- `--last-name`: 可选，姓氏

### 创建示例

#### 1. 创建超级管理员

```bash
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role super_admin \
    --username admin \
    --email admin@example.com \
    --password admin123 \
    --first-name 超级 \
    --last-name 管理员
```

#### 2. 创建新闻编辑者

```bash
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role news_editor \
    --username news_editor \
    --email news@example.com \
    --password editor123 \
    --first-name 新闻 \
    --last-name 编辑者
```

#### 3. 创建论坛版主

```bash
docker exec riichi-mahjong-community-platform-backend-1 python manage.py create_admin_user \
    --role forum_moderator \
    --username forum_mod \
    --email forum@example.com \
    --password mod123 \
    --first-name 论坛 \
    --last-name 版主
```

## 批量创建脚本

运行项目根目录下的 `create_admins.sh` 脚本可以一次性创建所有角色的管理员：

```bash
./create_admins.sh
```

该脚本会创建以下用户：

| 角色 | 用户名 | 密码 | 权限范围 |
|------|--------|------|----------|
| 超级管理员 | admin | admin123 | 所有模块 |
| 新闻编辑者 | news_editor | editor123 | 新闻模块 |
| 练习编辑者 | practice_editor | editor123 | 练习模块 |
| 版主 | moderator | mod123 | 论坛+新闻模块 |
| 论坛版主 | forum_moderator | mod123 | 论坛模块 |
| 内容管理员 | content_manager | manager123 | 内容管理模块 |

## 登录管理后台

创建管理员后，可以通过以下地址登录管理后台：

```
http://localhost:8000/admin/
```

使用创建的用户凭据登录，不同角色的管理员会看到不同的管理界面。

## 注意事项

1. 用户名必须唯一
2. 邮箱地址必须唯一
3. 超级管理员会自动获得 `is_superuser` 权限
4. 所有管理员用户都会自动获得 `is_staff` 权限
5. 用户会被自动添加到对应角色的用户组中，获得相应的权限
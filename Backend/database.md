# MySQL数据库配置说明

## 安装MySQL
- 在本机安装MySQL(官网下载链接: http://www.mysql.com/downloads/ ,安装详细教程可参考: https://blog.csdn.net/piupiu78/article/details/122482685)
- 如已安装可以跳过此步骤

## 数据库
- 执行命令:
```cmd
mysql -h 183.173.104.29 -u majhub_developer -p
```
- 提示输入密码,输入:mahjong123

- 登录成功后执行命令:
```cmd
show databases;
```
- 显示的数据库中应当包含mahjong_db

- 查看当前数据库中所有表:
```cmd
show tables;
```

- 查看表中数据
```cmd
select * from <table_name>;
```
- 例如,执行`select * from news_api_article`应当能够查看添加过的所有新闻

- 如果以上都没有问题,说明已经能够正常查看项目的MySQL数据库

## 项目配置
- 在Backend文件夹安装mysqlclient
```
pip install mysqlclient
```

## 数据迁移
```
python manage.py makemigrations
python manage.py migrate
```
- 之后,数据库中应该能看到你之前在SQLite本地数据库中添加的数据

## TODO
- 在服务器上创建数据库: 已经在云服务器上创建了名为mahjong_db的数据库,密码为:Mahjong123!(注意和本地不一样)
- 但由于服务器暂时还未开放3306端口(后续需要找),因此暂时还无法建立连接
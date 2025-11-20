# 功能
mahjim是Github上一个开源项目，可以实现麻将牌的摆放与显示

# 运行方法
- 构建镜像
```cmd
docker build -t mahjim .
```
- 运行镜像
```cmd
docker run -p 8081:8080 mahjim
```
容器内暴露的端口是8080，主机端口可指定


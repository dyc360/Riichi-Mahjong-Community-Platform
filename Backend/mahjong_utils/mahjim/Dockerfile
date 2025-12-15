# 使用较新的 Go 版本作为构建环境
FROM golang:1.22 AS build

# 设置环境变量
ENV GO111MODULE=on \
    GOPROXY=https://goproxy.cn,direct \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

WORKDIR /app

# 复制源代码
COPY . .

# 下载依赖并构建
# -ldflags="-s -w" 用于减小二进制体积
RUN go mod download && \
    go build -ldflags="-s -w" -o mahjim .

# 运行阶段：使用 scratch 作为基础镜像以保持最小体积
FROM scratch AS prod

# 从构建阶段复制二进制文件
COPY --from=build /app/mahjim /mahjim

# 暴露端口 8080
EXPOSE 8080

# 启动服务
CMD ["/mahjim"]

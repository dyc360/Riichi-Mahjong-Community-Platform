# 构建阶段
FROM golang:1.22 AS build
ENV GO111MODULE=on GOPROXY=https://goproxy.cn,direct CGO_ENABLED=0 GOOS=linux GOARCH=amd64
WORKDIR /app
COPY . .
RUN go mod download && go build -ldflags="-s -w" -o mahjim .

# 运行阶段
FROM scratch
COPY --from=build /app/mahjim /mahjim
EXPOSE 8080
CMD ["/mahjim"]

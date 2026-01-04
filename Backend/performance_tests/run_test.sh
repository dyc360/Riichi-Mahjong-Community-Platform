#!/bin/bash
# 性能测试运行脚本
# 使用方法: ./run_test.sh [test_type] [host]

set -e

# 默认配置
DEFAULT_HOST="https://120.53.120.90"
DEFAULT_TEST_TYPE="load"
RESULTS_DIR="performance_tests/results"

# 解析参数
TEST_TYPE=${1:-$DEFAULT_TEST_TYPE}
HOST=${2:-$DEFAULT_HOST}

# 创建结果目录
mkdir -p $RESULTS_DIR

echo "=========================================="
echo "性能测试启动"
echo "=========================================="
echo "测试类型: $TEST_TYPE"
echo "目标服务器: $HOST"
echo "结果目录: $RESULTS_DIR"
echo "=========================================="

# 根据测试类型设置参数
case $TEST_TYPE in
    load)
        USERS=200
        SPAWN_RATE=5
        RUN_TIME=10m
        REPORT_FILE="$RESULTS_DIR/load_test_$(date +%Y%m%d_%H%M%S).html"
        CSV_PREFIX="$RESULTS_DIR/load_test_$(date +%Y%m%d_%H%M%S)"
        ;;
    stress)
        USERS=500
        SPAWN_RATE=10
        RUN_TIME=20m
        REPORT_FILE="$RESULTS_DIR/stress_test_$(date +%Y%m%d_%H%M%S).html"
        CSV_PREFIX="$RESULTS_DIR/stress_test_$(date +%Y%m%d_%H%M%S)"
        ;;
    stability)
        USERS=100
        SPAWN_RATE=5
        RUN_TIME=30m
        REPORT_FILE="$RESULTS_DIR/stability_test_$(date +%Y%m%d_%H%M%S).html"
        CSV_PREFIX="$RESULTS_DIR/stability_test_$(date +%Y%m%d_%H%M%S)"
        ;;
    spike)
        USERS=300
        SPAWN_RATE=50
        RUN_TIME=5m
        REPORT_FILE="$RESULTS_DIR/spike_test_$(date +%Y%m%d_%H%M%S).html"
        CSV_PREFIX="$RESULTS_DIR/spike_test_$(date +%Y%m%d_%H%M%S)"
        ;;
    *)
        echo "未知的测试类型: $TEST_TYPE"
        echo "支持的测试类型: load, stress, stability, spike"
        exit 1
        ;;
esac

echo ""
echo "测试参数:"
echo "  并发用户数: $USERS"
echo "  用户增长速率: $SPAWN_RATE/秒"
echo "  运行时间: $RUN_TIME"
echo ""

# 运行Locust测试
echo "开始运行性能测试..."
locust -f performance_tests/locustfile.py \
    --host=$HOST \
    --users $USERS \
    --spawn-rate $SPAWN_RATE \
    --run-time $RUN_TIME \
    --headless \
    --html $REPORT_FILE \
    --csv $CSV_PREFIX

echo ""
echo "=========================================="
echo "测试完成！"
echo "=========================================="
echo "报告文件: $REPORT_FILE"
echo "CSV文件: ${CSV_PREFIX}_*.csv"
echo "=========================================="


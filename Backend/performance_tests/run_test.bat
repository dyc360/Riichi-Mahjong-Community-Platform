@echo off
REM 性能测试运行脚本 (Windows)
REM 使用方法: run_test.bat [test_type] [host]

setlocal enabledelayedexpansion

REM 默认配置
if "%1"=="" set TEST_TYPE=load
if "%2"=="" set HOST=https://120.53.120.90

set TEST_TYPE=%1
set HOST=%2
set RESULTS_DIR=performance_tests\results

REM 创建结果目录
if not exist %RESULTS_DIR% mkdir %RESULTS_DIR%

echo ==========================================
echo 性能测试启动
echo ==========================================
echo 测试类型: %TEST_TYPE%
echo 目标服务器: %HOST%
echo 结果目录: %RESULTS_DIR%
echo ==========================================

REM 根据测试类型设置参数
if "%TEST_TYPE%"=="load" (
    set USERS=200
    set SPAWN_RATE=5
    set RUN_TIME=10m
    set REPORT_FILE=%RESULTS_DIR%\load_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.html
    set CSV_PREFIX=%RESULTS_DIR%\load_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
) else if "%TEST_TYPE%"=="stress" (
    set USERS=500
    set SPAWN_RATE=10
    set RUN_TIME=20m
    set REPORT_FILE=%RESULTS_DIR%\stress_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.html
    set CSV_PREFIX=%RESULTS_DIR%\stress_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
) else if "%TEST_TYPE%"=="stability" (
    set USERS=100
    set SPAWN_RATE=5
    set RUN_TIME=30m
    set REPORT_FILE=%RESULTS_DIR%\stability_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.html
    set CSV_PREFIX=%RESULTS_DIR%\stability_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
) else if "%TEST_TYPE%"=="spike" (
    set USERS=300
    set SPAWN_RATE=50
    set RUN_TIME=5m
    set REPORT_FILE=%RESULTS_DIR%\spike_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.html
    set CSV_PREFIX=%RESULTS_DIR%\spike_test_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
) else (
    echo 未知的测试类型: %TEST_TYPE%
    echo 支持的测试类型: load, stress, stability, spike
    exit /b 1
)

echo.
echo 测试参数:
echo   并发用户数: %USERS%
echo   用户增长速率: %SPAWN_RATE%/秒
echo   运行时间: %RUN_TIME%
echo.

REM 运行Locust测试
echo 开始运行性能测试...
locust -f performance_tests\locustfile.py --host=%HOST% --users %USERS% --spawn-rate %SPAWN_RATE% --run-time %RUN_TIME% --headless --html %REPORT_FILE% --csv %CSV_PREFIX%

echo.
echo ==========================================
echo 测试完成！
echo ==========================================
echo 报告文件: %REPORT_FILE%
echo CSV文件: %CSV_PREFIX%_*.csv
echo ==========================================


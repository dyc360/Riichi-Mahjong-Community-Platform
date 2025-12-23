@echo off
REM Celery Worker启动脚本（Windows）
REM 使用方法: 双击运行或在任务计划程序中配置

cd /d "%~dp0.."
call venv\Scripts\activate.bat

echo ==========================================
echo 启动Celery Worker
echo ==========================================
echo 项目目录: %CD%
echo 时间: %DATE% %TIME%
echo ==========================================

celery -A backend worker --loglevel=info --concurrency=4

pause

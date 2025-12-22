@echo off
REM Celery Beat启动脚本（Windows）
REM 使用方法: 双击运行或在任务计划程序中配置

cd /d "%~dp0.."
call venv\Scripts\activate.bat

echo ==========================================
echo 启动Celery Beat
echo ==========================================
echo 项目目录: %CD%
echo 时间: %DATE% %TIME%
echo ==========================================

celery -A backend beat --loglevel=info

pause

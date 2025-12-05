import { useTheme } from '../../contexts/ThemeContext';

// 主题切换按钮组件
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/30"
      aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
    </button>
  );
}
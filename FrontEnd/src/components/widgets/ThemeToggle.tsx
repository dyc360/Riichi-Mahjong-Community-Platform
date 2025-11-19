import { useTheme } from '../../contexts/ThemeContext';

// 主题切换按钮组件
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="absolute right-4 top-4 rounded-full p-2 text-sm font-medium transition-colors hover:bg-slate-800/50 dark:hover:bg-white/10"
      aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
    </button>
  );
}
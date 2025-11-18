import { type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

export function HomePageHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="py-6 bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">MajHub</h1>
            <nav>
                <ul className="flex space-x-4">
                    <li>
                        <Link to="/profile" className="hover:underline">个人中心</Link>
                    </li>
                    <li>
                        <Link to="/settings" className="hover:underline">设置</Link>
                    </li>
                    {/* 主题切换按钮 */}
                    <li>
                        <button 
                            onClick={toggleTheme}
                            className="hover:underline focus:outline-none"
                        >
                            {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    </header>
  )
}
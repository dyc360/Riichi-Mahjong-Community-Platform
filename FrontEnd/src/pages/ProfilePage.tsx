import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HomePageHeader } from '../components/homePageComp';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// 定义用户资料数据类型
type UserProfile = {
  username: string;
  email: string;
  avatar: string;
  joinDate: string;
  practiceStats: {
    completed: number;
    accuracy: number;
    rank: string;
  };
  forumStats: {
    posts: number;
    replies: number;
    likes: number;
  };
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    username: user?.username || '用户名',
    email: user?.email || 'user@example.com',
    avatar: 'https://placehold.co/100x100/6366f1/ffffff?text=User',
    joinDate: '2023-01-15',
    practiceStats: {
      completed: 42,
      accuracy: 78,
      rank: '四段',
    },
    forumStats: {
      posts: 12,
      replies: 36,
      likes: 89,
    },
  });

  // 未登录状态重定向到登录页
  /*if (!user) {
    navigate('/login', { replace: true });
    return null;
  }*/

  const handleLogout = () => {
    logout();
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  };

  // 返回主页的处理函数
  const handleGoHome = () => {
    navigate('/home'); // 跳转到首页路径
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <HomePageHeader />

      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          {/* 返回主页按钮 */}
          <button
            onClick={handleGoHome}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回主页
          </button>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {/* 用户资料卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧个人信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative z-0">
                {/* 封面图区域 */}
                <button className="absolute right-4 bottom-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 pb-6">
                <div className="flex justify-center -mt-16">
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden z-10">
                    <img src={profile.avatar} alt="用户头像" className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <div className="text-center mt-4">
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleInputChange}
                      className="w-full text-center text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-indigo-400 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.username}</h1>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    加入于 {profile.joinDate}
                  </p>
                  
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={toggleEditMode}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors"
                    >
                      {isEditing ? '保存' : '编辑资料'}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧详细信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 联系信息 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">联系信息</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">邮箱</span>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleInputChange}
                      className="text-sm text-slate-900 dark:text-white bg-transparent border-b border-indigo-400 focus:outline-none"
                    />
                  ) : (
                    <span className="text-sm text-slate-900 dark:text-white">{profile.email}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">账号状态</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">已验证</span>
                </div>
                
                <div className="pt-2">
                  <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                    修改密码
                  </button>
                </div>
              </div>
            </div>
            
            {/* 统计数据 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 练习统计 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">练习数据</h2>
                <div className="space-y-3">
                  <StatItem label="已完成练习" value={profile.practiceStats.completed} suffix="题" />
                  <StatItem label="平均正确率" value={profile.practiceStats.accuracy} suffix="%" />
                  <StatItem label="当前段位" value={profile.practiceStats.rank} />
                </div>
                <Link 
                  to="/practice" 
                  className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  继续练习 →
                </Link>
              </div>
              
              {/* 论坛统计 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">论坛数据</h2>
                <div className="space-y-3">
                  <StatItem label="发布主题" value={profile.forumStats.posts} suffix="个" />
                  <StatItem label="回复数" value={profile.forumStats.replies} suffix="条" />
                  <StatItem label="获得点赞" value={profile.forumStats.likes} suffix="个" />
                </div>
                <Link 
                  to="/forum" 
                  className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  查看我的帖子 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 统计项组件
const StatItem = ({ label, value, suffix = '' }: { label: string; value: number | string; suffix?: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value}{suffix}</span>
  </div>
);

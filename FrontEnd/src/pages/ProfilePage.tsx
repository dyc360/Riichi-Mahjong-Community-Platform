import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader } from '../components/homePageComp';
import { useAuth, type UserProfile } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';


// 添加 API 响应类型
type ApiResponse = {
  success: boolean;
  user: UserProfile;
  message?: string;
};

export default function ProfilePage() {
  const { user, logout, token, isLoading, userProfile, profileLoading, fetchUserProfile, updateUserProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 计算注册天数
  const calculateDaysSinceJoin = (joinDate: string) => {
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceJoin = userProfile ? calculateDaysSinceJoin(userProfile.joinDate) : 0;

  // 从后端获取用户资料（只在认证完成后且没有缓存时执行）
  useEffect(() => {
    if (!isLoading && user && !userProfile) {
      fetchUserProfile();
    }
  }, [isLoading, user, userProfile, fetchUserProfile]);

  // 未登录状态重定向到登录页
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (userProfile) {
      const updatedProfile = { ...userProfile, [name]: value };
      updateUserProfile(updatedProfile);
    }
  };

  // 处理头像文件上传
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userProfile) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }

      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const updatedProfile = { ...userProfile, avatar: result };
        updateUserProfile(updatedProfile);
        setShowAvatarModal(false);
        setError(null);
      };
      reader.onerror = () => {
        setError('读取图片失败');
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理头像URL输入
  const handleAvatarUrlChange = (url: string) => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, avatar: url };
      updateUserProfile(updatedProfile);
      setShowAvatarModal(false);
      setError(null);
    }
  };

  // 返回主页的处理函数
  const handleGoHome = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleEditMode = async () => {
    if (isEditing) {
      // 保存修改
      await saveProfile();
    }
    setIsEditing(!isEditing);
  };

  const saveProfile = async () => {
    if (!userProfile) return;

    try {
      setSaving(true);

      // 只更新用户名和头像
      const response = await fetch('/api/auth/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userProfile.username,
          avatar: userProfile.avatar
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '更新失败');
      }

      // 更新缓存的用户资料
      updateUserProfile(data.user);

    } catch (err) {
      console.error('保存失败:', err);
      setError(err instanceof Error ? err.message : '保存失败');
      // 重新获取最新数据
      await fetchUserProfile();
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    fetchUserProfile();
  };

  // 加载状态（包括认证初始化和数据加载）
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <HomePageHeader />
        <main className="container mx-auto px-4 py-20">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              {isLoading ? '初始化认证中...' : '加载用户资料中...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // 错误状态
  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <HomePageHeader />
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">加载失败</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-6 py-2 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              重试
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 如果没有获取到数据，使用默认数据
  const getDefaultProfile = (): UserProfile => {
    return {
      id: user?.id || 0,
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
      isEmailVerified: true,
    };
  };

  const displayProfile = userProfile || getDefaultProfile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <HomePageHeader />

      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
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

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className={`inline-block w-4 h-4 mr-1 ${saving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {saving ? '保存中...' : '刷新数据'}
          </button>
        </div>
      </nav>

      {error && (
        <div className="container mx-auto px-4 py-2">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* 用户资料卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧个人信息 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative z-0">
                {/* 封面图区域 */}
                {isEditing && (
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute right-4 bottom-4 text-white bg-black/30 p-2 rounded-full hover:bg-black/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="px-6 pb-6">
                <div className="flex justify-center -mt-16">
                  <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden z-10">
                    <img src={displayProfile.avatar} alt="用户头像" className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="text-center mt-4">
                  {isEditing ? (
                    <input
                      type="text"
                      name="username"
                      value={displayProfile.username}
                      onChange={handleInputChange}
                      className="w-full text-center text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-indigo-400 focus:outline-none"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{displayProfile.username}</h1>
                  )}
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    加入于 {displayProfile.joinDate}
                  </p>

                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={toggleEditMode}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEditing ? (saving ? '保存中...' : '保存') : '编辑资料'}
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
                  <span className="text-sm text-slate-900 dark:text-white">{displayProfile.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">账号状态</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {displayProfile.isEmailVerified ? '已验证' : '未验证'}
                  </span>
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
                  <StatItem
                    label="已完成练习"
                    value={displayProfile.practiceStats.completed}
                    suffix="题"
                    isEditing={false}
                    type="number"
                  />
                  <StatItem
                    label="平均正确率"
                    value={displayProfile.practiceStats.accuracy}
                    suffix="%"
                    isEditing={false}
                    type="number"
                    step="0.01"
                  />
                  <StatItem
                    label="当前段位"
                    value={displayProfile.practiceStats.rank}
                    isEditing={false}
                    type="text"
                  />
                  <StatItem label="注册天数" value={daysSinceJoin} suffix="天" />
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
                  <StatItem
                    label="发布主题"
                    value={displayProfile.forumStats.posts}
                    suffix="个"
                    isEditing={false}
                    type="number"
                  />
                  <StatItem
                    label="回复数"
                    value={displayProfile.forumStats.replies}
                    suffix="条"
                    isEditing={false}
                    type="number"
                  />
                  <StatItem
                    label="获得点赞"
                    value={displayProfile.forumStats.likes}
                    suffix="个"
                    isEditing={false}
                    type="number"
                  />
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

      {/* 头像编辑模态框 */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">修改头像</h3>

            <div className="space-y-4">
              {/* 文件上传选项 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  从本地上传
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="block w-full text-sm text-slate-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    dark:file:bg-indigo-900/30 dark:file:text-indigo-300
                    hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/30"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  支持 JPG、PNG、GIF 格式，最大 5MB
                </p>
              </div>

              {/* URL输入选项 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  或输入图片链接
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
                    bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      handleAvatarUrlChange(target.value);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
                  bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600
                  transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg
                  hover:bg-indigo-700 transition-colors"
              >
                选择文件
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 更新后的统计项组件
interface StatItemProps {
  label: string;
  value: number | string;
  suffix?: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  type?: string;
  step?: string;
}

const StatItem = ({
  label,
  value,
  suffix = '',
  isEditing = false,
  onChange,
  type = 'text',
  step
}: StatItemProps) => {
  if (isEditing && onChange) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm font-medium text-slate-900 dark:text-white bg-transparent border-b border-indigo-400 focus:outline-none w-20 text-right"
            step={step}
          />
          {suffix && <span className="text-sm text-slate-500 dark:text-slate-400">{suffix}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{value}{suffix}</span>
    </div>
  );
};
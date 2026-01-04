import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// 定义用户类型，根据后端返回的数据结构进行调整
export interface User {
  id: string | number;
  username: string;
  email?: string;
  avatar?: string;
  is_staff?: boolean;
  // 可以根据需要添加其他字段
}

// 定义用户资料类型（包含完整信息）
export interface UserProfile {
  id: string | number;
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
  isEmailVerified?: boolean;
  date_joined?: string;
  last_login?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  userProfile: UserProfile | null; // 添加用户资料缓存
  isAuthenticated: boolean;
  isLoading: boolean; // 添加加载状态，用于初始化检查
  profileLoading: boolean; // 用户资料加载状态
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  updateUserProfile: (profile: UserProfile) => void; // 更新用户资料
  fetchUserProfile: () => Promise<UserProfile | null>; // 获取用户资料
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    user: null,
    userProfile: null, // 初始化用户资料为null
    isAuthenticated: false,
    isLoading: true,
    profileLoading: false,
  });

  useEffect(() => {
    // 初始化时检查本地存储
    const initAuth = () => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuthState({
            token,
            user,
            userProfile: null,
            isAuthenticated: true,
            isLoading: false,
            profileLoading: false,
          });
        } catch (error) {
          console.error('解析用户信息失败:', error);
          // 解析失败则清除无效数据
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = (token: string, user: User) => {
    // 清理旧账号的缓存资料，避免跨账号混用
    localStorage.removeItem('userProfile');

    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    setAuthState({
      token,
      user,
      userProfile: null, // 登录时清空之前的资料缓存
      isAuthenticated: true,
      isLoading: false,
      profileLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userProfile'); // 登出时清除资料缓存
    
    setAuthState({
      token: null,
      user: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: false,
      profileLoading: false,
    });
  };

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setAuthState(prev => ({
      ...prev,
      user
    }));
  };

  const updateUserProfile = (profile: UserProfile) => {
    // 缓存用户资料到localStorage
    try {
      const serialized = JSON.stringify(profile);
      // 避免超大头像数据占满配额
      if (serialized.length > 4 * 1024 * 1024) {
        throw new Error('userProfile payload exceeds 4MB');
      }
      localStorage.setItem('userProfile', serialized);
    } catch (error) {
      console.warn('缓存用户资料失败, 将跳过本地缓存:', error);
      localStorage.removeItem('userProfile');
    }
    setAuthState(prev => ({
      ...prev,
      userProfile: profile,
      profileLoading: false,
    }));
  };

  const fetchUserProfile = async (): Promise<UserProfile | null> => {
    // 如果已有缓存的资料，直接返回
    if (authState.userProfile) {
      return authState.userProfile;
    }

    // 检查localStorage是否有缓存
    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
      try {
        const profile = JSON.parse(cachedProfile);
        // 只有当缓存资料与当前登录用户匹配时才使用
        if (authState.user && profile.id === authState.user.id) {
          setAuthState(prev => ({
            ...prev,
            userProfile: profile,
          }));
          return profile;
        }

        // 不匹配则清理，防止展示他人信息
        localStorage.removeItem('userProfile');
      } catch (error) {
        console.warn('缓存的用户资料解析失败:', error);
        localStorage.removeItem('userProfile');
      }
    }

    // 从服务器获取
    if (!authState.token) {
      return null;
    }

    try {
      setAuthState(prev => ({ ...prev, profileLoading: true }));

      const response = await fetch('/api/auth/profile/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);

      if (data.success && data.user) {
        updateUserProfile(data.user);
        return data.user;
      } else {
        throw new Error(data.message || '获取用户资料失败');
      }
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setAuthState(prev => ({ ...prev, profileLoading: false }));
      return null;
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    updateUserProfile,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
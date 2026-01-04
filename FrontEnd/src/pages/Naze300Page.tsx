import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';
import { useAuth } from '../contexts/AuthContext';

// 题目接口
interface Naze300Question {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Unsolved' | 'Solved';
  category: string;
  // 题目具体内容（在列表页不需要显示）
  hand_tiles?: string;
  waiting_tiles?: string;
  discard_options?: string[];
  correct_discard?: string;
  correct_reason?: string;
  additional_notes?: string;
}

export default function Naze300Page() {
  const { user, isLoading, token } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Naze300Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch('/api/auth/profile/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          // 认证失败，清除本地状态并重定向到登录页
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
        }
      } catch (error) {
        console.error('认证检查失败:', error);
        // 网络错误时也重定向到登录页
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login?redirect=' + encodeURIComponent(window.location.pathname), { replace: true });
      }
    };

    if (!isLoading && user) {
      checkAuth();
    }
  }, [user, token, isLoading, navigate]);

  // 模拟从数据库获取题目数据
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        // 生成300道模拟题目
        const mockQuestions: Naze300Question[] = [];
        const categories = ['基础', '进阶', '高级'];
        const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

        for (let i = 1; i <= 300; i++) {
          const categoryIndex = Math.floor((i - 1) / 100); // 每100题一个分类
          const difficultyIndex = Math.floor((i - 1) / 50) % 3; // 每50题一个难度循环
          const isSolved = Math.random() > 0.7; // 随机30%的题目已完成

          mockQuestions.push({
            id: i,
            title: `Q${i}: ${categories[categoryIndex]}练习题 ${i}`,
            difficulty: difficulties[difficultyIndex],
            status: isSolved ? 'Solved' : 'Unsolved',
            category: categories[categoryIndex]
          });
        }

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        setQuestions(mockQuestions);
      } catch (error) {
        console.error('获取题目失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // 过滤题目
  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.category === selectedCategory);

  // 分页逻辑
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  // 重置页码当筛选条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // 获取唯一分类
  const categories = ['all', ...Array.from(new Set(questions.map(q => q.category)))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <HomePageHeader />

      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">何切300</h1>
            <Link to="/practice" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium">
              ← 返回练习列表
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-600 dark:text-slate-400">
                来自《何切300问》的精选题目，涵盖多种复杂局面。通过实战练习提升你的打牌决策能力。
              </p>
            </div>
            {user?.is_staff && (
              <Link
                to="/practice/naze300/admin"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                管理题目
              </Link>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                }`}
              >
                {category === 'all' ? '全部题目' : category}
              </button>
            ))}
          </div>
        </div>
        {/* 快速跳转 */}
        <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">快速跳转到题目范围</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-15 gap-2">
            {Array.from({ length: 30 }, (_, i) => {
              const startNum = (i * 10) + 1;
              const endNum = Math.min((i + 1) * 10, 300);
              const isInRange = selectedCategory === 'all' && startNum <= endIndex && endNum >= startIndex;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedCategory('all');
                    const targetPage = Math.ceil(startNum / questionsPerPage);
                    setCurrentPage(targetPage);
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isInRange
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {startNum}-{endNum}
                </button>
              );
            })}
          </div>
        </div>
        {/* 题目列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600 dark:text-slate-400">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 当前页题目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestions.map(question => (
                <Link
                  key={question.id}
                  to={`/practice/naze300/${question.id}`}
                  className="block bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">
                        {question.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{question.category}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        question.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : question.difficulty === 'Medium'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        question.status === 'Solved'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {question.status === 'Solved' ? '已完成' : '未完成'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      题目 {question.id}
                    </span>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300">
                      开始练习 →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  显示第 {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} 题，共 {filteredQuestions.length} 题
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>

                  {/* 页码按钮 */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage === pageNum
                              ? 'bg-indigo-500 text-white border-indigo-500'
                              : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 统计信息 */}
        {!loading && (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">练习统计</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{questions.length}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">总题目数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {questions.filter(q => q.status === 'Solved').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {questions.filter(q => q.status === 'Unsolved').length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">未完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((questions.filter(q => q.status === 'Solved').length / questions.length) * 100)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">完成率</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
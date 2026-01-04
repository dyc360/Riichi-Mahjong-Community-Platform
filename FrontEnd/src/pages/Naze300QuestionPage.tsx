import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';
import { getCsrfToken } from '../utils';
import { useAuth } from '../contexts/AuthContext';

// Base URL for APIs - use absolute URL to work with both nginx proxy and direct access
const apiBaseUrl = window.location.protocol + '//' + window.location.hostname + '/api'
const imageUrlBase = window.location.protocol + '//' + window.location.hostname + '/api/mahjong/images/'

interface Naze300Question {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basic' | 'intermediate' | 'advanced';
  hand_tiles: string; // 手牌字符串表示（14张牌）
  discard_options: string[]; // 可选切牌列表
  round_wind: string; // 场风
  player_wind: string; // 自风
  tsumi_number: number; // 巡目/本场数
  dora_indicators: string; // 宝牌指示牌
  ura_dora_indicators: string; // 里宝牌指示牌
  correct_discard: string; // 正确切牌
  correct_reason: string; // 正确切牌理由
  additional_notes: string; // 补充说明
  total_attempts: number;
  correct_attempts: number;
  correct_rate: number;
  user_progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    attempts_count: number;
    is_correct: boolean | null;
  };
}

export default function Naze300QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading, token } = useAuth();
  const [question, setQuestion] = useState<Naze300Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [handPicture, setHandPicture] = useState<string | null>(null);
  const [doraPicture, setDoraPicture] = useState<string | null>(null);
  const [uraDoraPicture, setUraDoraPicture] = useState<string | null>(null);
  const [selectedDiscard, setSelectedDiscard] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 检查用户认证状态
  useEffect(() => {
    const checkAuth = async () => {
      if (!user || !token) return;

      try {
        const response = await fetch(`${apiBaseUrl}/auth/profile/`, {
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

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        // 重置状态
        setSelectedDiscard('');
        setShowAnswer(false);
        setHasSubmitted(false);
        setIsCorrect(null);

        const questionId = parseInt(id || '1');

        // 从API获取题目数据
        const response = await fetch(`${apiBaseUrl}/mahjong/naze300/${questionId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`获取题目失败: ${response.status}`);
        }

        const questionData = await response.json();

        // 设置手牌图片（14张牌）
        try {
          const handPictureUrl = `${imageUrlBase}${encodeURIComponent(questionData.hand_tiles)}/`;
          setHandPicture(handPictureUrl);
        } catch (decodeError) {
          console.error('Failed to set hand picture URL:', decodeError);
        }

        // 设置宝牌指示牌图片
        try {
          if (questionData.dora_indicators) {
            const doraPictureUrl = `${imageUrlBase}${encodeURIComponent(questionData.dora_indicators)}/`;
            setDoraPicture(doraPictureUrl);
          }
          if (questionData.ura_dora_indicators) {
            const uraDoraPictureUrl = `${imageUrlBase}${encodeURIComponent(questionData.ura_dora_indicators)}/`;
            setUraDoraPicture(uraDoraPictureUrl);
          }
        } catch (decodeError) {
          console.error('Failed to set dora picture URLs:', decodeError);
        }

        // 映射API字段到前端接口
        questionData.id = questionData.question_id;

        setQuestion(questionData);
      } catch (error) {
        console.error('获取题目失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestion();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8 flex flex-col items-center">
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600 dark:text-slate-400">加载题目中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8 flex flex-col items-center">
          <div className="text-center py-12">
            <div className="text-red-500 dark:text-red-400 mb-4">题目未找到</div>
            <Link
              to="/practice/naze300"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              返回题目列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <HomePageHeader />

      {/* 导航栏 */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        {/* 面包屑导航 */}
        <div className="w-full max-w-4xl mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/practice"
                  className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  练习
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <Link
                    to="/practice/naze300"
                    className="ml-1 text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 md:ml-2"
                  >
                    何切300
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-3 h-3 text-slate-400 mx-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                  </svg>
                  <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400 md:ml-2">
                    {question.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* 题目卡片 */}
        <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {question.title}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full ${
                  question.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : question.difficulty === 'medium'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {question.difficulty === 'easy' ? '简单' : question.difficulty === 'medium' ? '中等' : '困难'}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {question.category === 'basic' ? '基础' : question.category === 'intermediate' ? '进阶' : '高级'}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  (question.user_progress?.status === 'completed' || question.user_progress?.status === 'in_progress')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {(question.user_progress?.status === 'completed' || question.user_progress?.status === 'in_progress') ? '已完成' : '未完成'}
                </span>
              </div>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              请查看下面的手牌，选择最合适的切牌。
            </p>

            {/* 手牌和切牌选项合并 */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-6 mb-6">
              {/* 场况信息 */}
              <div className="mb-6 text-center text-lg font-medium text-indigo-700 dark:text-indigo-300 flex space-x-4 justify-center">
                <span>场风：{question.round_wind}</span>
                <span>自风：{question.player_wind}</span>
                <span>{question.tsumi_number}本场</span>
              </div>

              {/* 宝牌指示牌 */}
              {(doraPicture || uraDoraPicture) && (
                <div className="flex justify-center gap-12 mb-6">
                  {doraPicture && (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">宝牌指示牌</span>
                      <img
                        src={doraPicture}
                        alt="宝牌指示牌"
                        className="h-16 w-auto shadow-sm rounded"
                        onError={(e) => {
                          console.error('Dora picture failed to load:', doraPicture);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {uraDoraPicture && (
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">里宝牌指示牌</span>
                      <img
                        src={uraDoraPicture}
                        alt="里宝牌指示牌"
                        className="h-16 w-auto shadow-sm rounded"
                        onError={(e) => {
                          console.error('Ura dora picture failed to load:', uraDoraPicture);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 手牌显示（14张牌：手牌+进张） */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  当前手牌（14张）
                </h3>
                <div className="flex justify-center mb-3">
                  {handPicture ? (
                    <img
                      src={handPicture}
                      alt="当前手牌（14张）"
                      className="max-w-full h-32 object-contain shadow-sm rounded"
                      onError={(e) => {
                        console.error('Hand picture failed to load:', handPicture);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-500 dark:text-slate-400 mb-2">
                        🀄 手牌加载中...
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                  请选择要切的牌
                </p>
              </div>

              {/* 切牌选项 */}
              <div>
                <div className="flex justify-center gap-4 flex-wrap">
                  {question.discard_options.map((option, index) => {
                    const tilePictureUrl = `${imageUrlBase}${encodeURIComponent(option)}/`;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDiscard(option)}
                        className={`transition-all transform hover:scale-110 ${
                          selectedDiscard === option
                            ? 'scale-110'
                            : 'hover:brightness-110'
                        }`}
                      >
                        <img
                          src={tilePictureUrl}
                          alt={`切 ${option}`}
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            console.error('Tile picture failed to load:', tilePictureUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                {selectedDiscard && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 text-center mt-3">
                    已选择：{selectedDiscard}
                  </p>
                )}
              </div>
            </div>
            
            {/* 答案结果提示 */}
            {hasSubmitted && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                isCorrect
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-base">
                      {isCorrect ? '回答正确！' : '回答错误'}
                    </h3>
                    {!isCorrect && (
                      <p className="mt-1 text-sm">
                        正确答案是：{question.correct_discard}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 答案解析 */}
            {showAnswer && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4 mb-4">
                <h3 className="text-base font-semibold text-green-800 dark:text-green-200 mb-3">
                  正确答案解析
                </h3>

                <div className="space-y-3 text-sm">
                  {/* 正确切牌 */}
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 px-2 py-0.5 rounded bg-green-200/70 dark:bg-green-800/50 
                                    text-green-900 dark:text-green-100 text-xs font-semibold">
                      切牌
                    </span>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {question.correct_discard}
                      </div>
                      <div className="text-green-700 dark:text-green-300 mt-0.5 leading-snug">
                        {question.correct_reason}
                      </div>
                    </div>
                  </div>

                  {/* 补充说明 */}
                  {question.additional_notes && (
                    <div className="flex items-start gap-2 border-l-2 border-green-300 dark:border-green-700 pl-3">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                        补充
                      </span>
                      <div className="text-green-700 dark:text-green-300 leading-snug">
                        {question.additional_notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 操作按钮 */}
        <div className="w-full max-w-4xl flex justify-between">
          <Link
            to="/practice/naze300"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            ← 返回题目列表
          </Link>

          <div className="flex gap-3">
            {hasSubmitted && (
              <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {showAnswer ? '隐藏解析' : '显示解析'}
              </button>
            )}
            {!hasSubmitted ? (
              <button
                onClick={async () => {
                  if (!selectedDiscard || !question) return;

                  try {
                    const response = await fetch(`${apiBaseUrl}/mahjong/naze300/${question.id}/submit/`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken() || '',
                        'Authorization': token ? `Bearer ${token}` : '',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        selected_discard: selectedDiscard
                      })
                    });

                    if (!response.ok) {
                      throw new Error(`提交失败: ${response.status}`);
                    }

                    const result = await response.json();
                    setIsCorrect(result.is_correct);
                    setHasSubmitted(true);
                    setShowAnswer(true); // 提交后自动显示解析

                    setQuestion(prev => {
                      if (!prev) return prev;
                      const prevProgress = prev.user_progress ?? {
                        status: 'not_started' as const,
                        attempts_count: 0,
                        is_correct: null,
                      };

                      return {
                        ...prev,
                        total_attempts: result.question_stats.total_attempts,
                        correct_attempts: result.question_stats.correct_attempts,
                        correct_rate: result.question_stats.correct_rate,
                        user_progress: {
                          ...prevProgress,
                          status: 'completed',
                          attempts_count: result.attempts_count ?? prevProgress.attempts_count,
                          is_correct: result.is_correct,
                        },
                      };
                    });
                  } catch (error) {
                    console.error('提交答案失败:', error);
                    alert('提交答案失败，请重试');
                  }
                }}
                disabled={!selectedDiscard}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                提交答案
              </button>
            ) : (
              <button
                onClick={() => {
                  // 进入下一题
                  const nextId = parseInt(id || '1') + 1;
                  navigate(`/practice/naze300/${nextId}`);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                下一题
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
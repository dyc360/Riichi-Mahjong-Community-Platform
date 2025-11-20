import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HomePageHeader } from '../components/homePageComp'

// Mock data for a point calculation problem
// In a real app, this would come from an API
const MOCK_PROBLEM = {
  id: 'p1',
  imageUrl: 'http://localhost:8081/12345677799s||_888s?scale=0.6', 
  correctAnswer: 8000, // Example: Mangan
  explanation: '满贯 8000点 (4番 30符)',
}

export default function PointCalculationPage() {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [currentProblem, setCurrentProblem] = useState(MOCK_PROBLEM)
  const [isLoading, setIsLoading] = useState(false)

  // Simulate fetching a new problem
  const fetchNextProblem = () => {
    setIsLoading(true)
    setAnswer('')
    setFeedback(null)
    
    // Simulate API delay
    setTimeout(() => {
      // For demo purposes, we just use the same mock problem or slightly modify it
      // In reality, you'd fetch a new problem ID/Image here
      setCurrentProblem({
        ...MOCK_PROBLEM,
        id: Date.now().toString(), // Force re-render or just simulate new ID
        correctAnswer: 8000, 
      })
      setIsLoading(false)
    }, 500)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const numericAnswer = parseInt(answer, 10)
    
    if (isNaN(numericAnswer)) {
      return // Or show an error about invalid input
    }

    // Simple validation logic (mock backend validation)
    if (numericAnswer === currentProblem.correctAnswer) {
      setFeedback('correct')
    } else {
      setFeedback('incorrect')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <HomePageHeader />
      
      <main className="container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl">
          {/* Header / Back Link */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">手牌算点练习</h1>
            <Link to="/practice" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-sm font-medium">
              ← 返回练习列表
            </Link>
          </div>

          {/* Problem Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden p-8">
            
            {/* Hand Image Area */}
            <div className="mb-8 flex justify-center bg-slate-100 dark:bg-slate-900/50 rounded-xl p-8 border border-dashed border-slate-300 dark:border-slate-600">
              {isLoading ? (
                <div className="h-32 flex items-center text-slate-400">加载题目中...</div>
              ) : (
                <img 
                  src={currentProblem.imageUrl} 
                  alt="Mahjong Hand" 
                  className="max-w-full h-auto shadow-sm rounded"
                />
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="points" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  请输入点数
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="points"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={feedback !== null || isLoading}
                    className={`block w-full rounded-xl border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-3 px-4
                      ${feedback === 'correct' ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50 dark:bg-green-900/10' : ''}
                      ${feedback === 'incorrect' ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10' : ''}
                    `}
                    placeholder="例如: 8000"
                    autoFocus
                  />
                  {feedback === 'correct' && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {feedback === 'incorrect' && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback & Actions */}
              {feedback && (
                <div className={`rounded-xl p-4 ${
                  feedback === 'correct' 
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {feedback === 'correct' ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg">
                        {feedback === 'correct' ? '回答正确！' : '回答错误'}
                      </h3>
                      <p className="mt-1 opacity-90">
                        {feedback === 'correct' 
                          ? '太棒了！准备好迎接下一题了吗？' 
                          : `正确答案是 ${currentProblem.correctAnswer} 点。${currentProblem.explanation}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                {feedback === null ? (
                  <button
                    type="submit"
                    disabled={!answer || isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    提交答案
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fetchNextProblem}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    下一题 →
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

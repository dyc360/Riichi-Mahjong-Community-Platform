import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HomePageHeader } from '../components/homePageComp'
import { useAuth } from '../contexts/AuthContext'

// Base URL for the image API
const imageUrlBase = '/api/mahjong/images/'

export default function PointCalculationPage() {
  const { token } = useAuth()
  const [answer, setAnswer] = useState('')
  const [answerMain, setAnswerMain] = useState('')
  const [answerAdditional, setAnswerAdditional] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [dealerFeedback, setDealerFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [childFeedback, setChildFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [currentProblem, setCurrentProblem] = useState<any>(null)
  const [handPicture, setHandPicture] = useState<string | null>(null)
  const [doraPicture, setDoraPicture] = useState<string | null>(null)
  const [uraDoraPicture, setUraDoraPicture] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const fetchNextProblem = async () => {
    // if (!token) return

    setIsLoading(true)
    setAnswer('')
    setAnswerMain('')
    setAnswerAdditional('')
    setFeedback(null)
    setDealerFeedback(null)
    setChildFeedback(null)
    setShowExplanation(false)
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/mahjong/points/', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          type: 'practice_point'
        })
      })
      
      if (!response.ok) {
        const errorDetails = await response.text();  // 获取服务器返回的错误信息
        console.error(`Request failed with status: ${response.status}`);
        console.error(`Error details: ${errorDetails}`);
        throw new Error(`Failed to fetch problem: ${errorDetails}`);
      }
      
      const data = await response.json()
      
      // Map backend data to frontend structure
      const windMap: Record<number, string> = {
        27: '东', 28: '南', 29: '西', 30: '北'
      }
      
      const problem = {
        id: Date.now().toString(),
        tiles: data.display_hand, // Use display_hand for image
        correctAnswer: data.points.total,
        correctMain: data.points.main_cost,
        correctAdditional: data.points.additional_cost,
        // explanation: `${data.points.yaku.join(', ')} ${data.points.han}番 ${data.points.fu}符`,
        wind_of_round: windMap[data.hand_config.round_wind] || '东',
        wind_of_player: windMap[data.hand_config.player_wind] || '东',
        agari_type: data.hand_config.is_tsumo ? '自摸' : '荣和',
        is_riichi: data.hand_config.is_riichi,
        is_daburu_riichi: data.hand_config.is_daburu_riichi,
        is_haitei: data.hand_config.is_haitei,
        is_houtei: data.hand_config.is_houtei,
        is_chankan: data.hand_config.is_chankan,
        is_rinshan: data.hand_config.is_rinshan,
        is_ippatsu: data.hand_config.is_ippatsu,
        tsumi_number: data.hand_config.tsumi_number,
        han: data.points.han,
        fu: data.points.fu,
        yaku_name: data.points.yaku_name,
        yaku_hanshu: data.points.yaku_hanshu,
        fu_details: data.points.fu_details,
        main_bonus: data.points.main_bonus,
        additional_bonus: data.points.additional_bonus,
      }
      
      setCurrentProblem(problem)
      setHandPicture(`${imageUrlBase}${data.display_hand}`) // Placeholder for testing
      setDoraPicture(`${imageUrlBase}${data.dora_indicators}`)
      setUraDoraPicture(`${imageUrlBase}${data.ura_dora_indicators}`)
    } catch (error) {
      console.error(error)
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNextProblem()
  }, [token])

  const fu_before_rounding = currentProblem?.fu_details?.reduce((sum: number, item: any) => {
    return sum + (item.fu || 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentProblem) return

    const isChildTsumo = currentProblem.agari_type === '自摸' && currentProblem.wind_of_player !== '东'

    if (isChildTsumo) {
      const main = parseInt(answerMain, 10)
      const additional = parseInt(answerAdditional, 10)
      
      if (isNaN(main) || isNaN(additional)) return

      if (main === currentProblem.correctMain + currentProblem.main_bonus) {
        setDealerFeedback('correct')
      } else {
        setDealerFeedback('incorrect')
      }
      if (additional === currentProblem.correctAdditional + currentProblem.additional_bonus) {
        setChildFeedback('correct')
      } else {
        setChildFeedback('incorrect')
      }
      setFeedback((dealerFeedback === 'correct' && childFeedback === 'correct') ? 'correct' : 'incorrect')
    } else {
      const numericAnswer = parseInt(answer, 10)
      
      if (isNaN(numericAnswer)) {
        return // Or show an error about invalid input
      }

      // Simple validation logic
      if (numericAnswer === currentProblem.correctAnswer) {
        setFeedback('correct')
      } else {
        setFeedback('incorrect')
      }
    }
  }

  if (!currentProblem && !isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 flex items-center justify-center">
            <div className="text-center">
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">请先登录以进行练习</p>
                <Link to="/login" className="text-indigo-600 hover:text-indigo-500">前往登录</Link>
            </div>
        </div>
      )
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
            {isLoading || !currentProblem ? (
               <div className="h-64 flex items-center justify-center text-slate-400">加载题目中...</div>
            ) : (
            <>
            {/* Round Information */}
            <div className="mb-6 text-center text-xl font-bold text-slate-800 dark:text-slate-400">
              <span className="mr-4">{currentProblem.wind_of_round}场</span>
              <span className="mr-4">{currentProblem.wind_of_player}家</span>
              <span>{currentProblem.agari_type}</span>
            </div>

            <div className="mb-6 text-center text-lg font-medium text-indigo-700 dark:text-indigo-300 flex space-x-4 justify-center">
              {currentProblem.is_riichi && !currentProblem.is_daburu_riichi && (
                <span>立直</span>
              )}
              {currentProblem.is_daburu_riichi && (
                <span>双立直</span>
              )}
              {currentProblem.is_haitei && (
                <span>海底捞月</span>
              )}
              {currentProblem.is_houtei && (
                <span>河底捞鱼</span>
              )}
              {currentProblem.is_chankan && (
                <span>枪杠</span>
              )}
              {currentProblem.is_rinshan && (
                <span>岭上开花</span>
              )}
              {currentProblem.is_ippatsu && (
                <span>一发</span>
              )}
              <span>{currentProblem.tsumi_number}本场</span>
            </div>

            {/* Indicators Section */}
            <div className="flex justify-center gap-12 mb-4">
              {/* Dora Indicator */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">宝牌指示牌</span>
                <img 
                  src={doraPicture || ''} 
                  alt="Dora Indicators"
                  className="h-16 w-auto shadow-sm rounded"
                />
              </div>

              {/* Ura Dora Indicator */}
              {uraDoraPicture && (
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">里宝牌指示牌</span>
                  <img 
                    src={uraDoraPicture || ''} 
                    alt="Ura Dora Indicators"
                    className="h-16 w-auto shadow-sm rounded"
                  />
                </div>
              )}
            </div>

            {/* Hand Image Area */}
            <div className="mb-8 flex justify-center px-4">
                <img 
                  src={handPicture || ''} 
                  alt="Mahjong Hand" 
                  className="max-w-full h-auto shadow-sm rounded"
                />
            </div>
            
            {/* Input Area */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentProblem.agari_type === '自摸' && currentProblem.wind_of_player !== '东' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="points-main" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      庄家支付
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="points-main"
                        value={answerMain}
                        onChange={(e) => setAnswerMain(e.target.value)}
                        disabled={feedback !== null || isLoading}
                        className={`block w-full rounded-xl border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-3 px-4
                          ${dealerFeedback === 'correct' ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50 dark:!bg-green-900/40' : ''}
                          ${dealerFeedback === 'incorrect' ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:!bg-red-900/30' : ''}
                        `}
                        placeholder="例如: 2000"
                        autoFocus
                      />
                      {dealerFeedback === 'correct' && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {dealerFeedback === 'incorrect' && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="points-additional" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      子家支付
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="points-additional"
                        value={answerAdditional}
                        onChange={(e) => setAnswerAdditional(e.target.value)}
                        disabled={feedback !== null || isLoading}
                        className={`block w-full rounded-xl border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-3 px-4
                          ${childFeedback === 'correct' ? 'border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50 dark:!bg-green-900/40' : ''}
                          ${childFeedback === 'incorrect' ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:!bg-red-900/30' : ''}
                        `}
                        placeholder="例如: 1000"
                      />
                      {childFeedback === 'correct' && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {childFeedback === 'incorrect' && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
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
              )}

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
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">
                        {feedback === 'correct' ? '回答正确！' : '回答错误'}
                      </h3>
                      <p className="mt-1 opacity-90">
                        {feedback === 'correct' ? (
                          '太棒了！准备好迎接下一题了吗？'
                        ) : (
                          <span className="font-bold">
                            正确答案是 {currentProblem.han} 番 {currentProblem.fu} 符，
                            {currentProblem.agari_type === '自摸' && currentProblem.wind_of_player !== '东' ? (
                              <>
                                庄家 <span>{currentProblem.correctMain + currentProblem.main_bonus}</span> / 子家 <span>{currentProblem.correctAdditional + currentProblem.additional_bonus}</span>
                              </>
                            ) : (
                              <span>{currentProblem.correctAnswer}</span>
                            )}
                            点
                          </span>
                        )}
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                      >
                        {showExplanation ? (
                          <>
                            <span>收起详细解析</span>
                            <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>查看详细解析</span>
                            <svg className="ml-2 -mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                {feedback === null ? (
                  <button
                    type="submit"
                    disabled={(!answer && !answerAdditional) || isLoading}
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
            </>
            )}
          </div>

          {/* Explanation Card */}
          {showExplanation && currentProblem && (
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden p-8 animate-fade-in-up">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">本局解析</h3>
              
              {/* Part 1: Hand Review */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">牌型回顾</h4>
                
                {/* Indicators */}
                <div className="flex justify-center gap-8 mb-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-slate-500 mb-2">宝牌指示牌</span>
                    <img 
                      src={doraPicture || ''} 
                      alt="Dora Indicators"
                      className="h-12 w-auto shadow-sm rounded"
                    />
                  </div>
                  {uraDoraPicture && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-medium text-slate-500 mb-2">里宝牌指示牌</span>
                      <img 
                        src={uraDoraPicture || ''} 
                        alt="Ura Dora Indicators"
                        className="h-12 w-auto shadow-sm rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Hand */}
                <div className="flex justify-center px-2">
                  <img 
                    src={handPicture || ''} 
                    alt="Mahjong Hand" 
                    className="max-w-full h-auto shadow-sm rounded"
                  />
                </div>
              </div>

              {/* Part 2: Points Detail */}
              <div className="space-y-8">
                
                {/* Han Analysis */}
                <div>
                   <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">番数解析</h4>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                      {/* Total Han */}
                      <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[100px]">
                        <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{currentProblem.han}</span>
                        <span className="text-sm font-medium text-indigo-600/80 dark:text-indigo-400/80">番</span>
                      </div>
                      
                      {/* Divider */}
                      <div className="w-full h-px md:w-px md:h-16 bg-indigo-200 dark:bg-indigo-800"></div>

                      {/* Yaku List */}
                      <div className="flex-grow w-full">
                        <h5 className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-3 text-center md:text-left">役种构成</h5>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                          {currentProblem.yaku_name && currentProblem.yaku_name.map((y: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-900 shadow-sm">
                              <span>{y}</span>
                              <span className="ml-2 inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-1.5 py-0.5 rounded">
                                {currentProblem.yaku_hanshu[i]}番
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Fu Analysis */}
                <div>
                   <div className="flex items-baseline justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">符数解析</h4>
                      <div className="flex items-baseline gap-1">
                         <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">{currentProblem.fu}</span>
                         <span className="text-sm font-medium text-slate-500 dark:text-slate-400">符</span>
                      </div>
                   </div>
                   
                   {/* Fu Details Grid - Flexible Layout */}
                   <div className="flex flex-wrap gap-3 justify-center">
                      {currentProblem.fu_details && currentProblem.fu_details.map((detail: any, i: number) => (
                        <div key={i} className="flex-1 min-w-[120px] max-w-[160px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-400 mb-2 truncate w-full" title={detail.reason}>{detail.reason}</span>
                            <div className="h-14 w-full  rounded-lg flex items-center justify-center text-xs text-slate-400 mb-2 overflow-hidden">
                                {detail.fu_url ? (
                                    <img 
                                        src={`${imageUrlBase}${detail.fu_url}`} 
                                        alt={detail.reason}
                                        className="h-full w-auto object-contain"
                                    />
                                ) : (
                                    <span className="text-base font-bold break-words text-indigo-600 dark:text-indigo-400">{detail.description}</span>
                                )}
                            </div>
                            <span className="text-base font-bold text-slate-700 dark:text-slate-300">{detail.fu}符</span>
                        </div>
                      ))}

                      {/* Round Up Placeholder */}
                      <div className="flex-1 min-w-[120px] max-w-[160px] bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 flex flex-col items-center text-center border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-6 h-6 bg-indigo-500/10 rounded-bl-xl"></div>
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-2">最终结果</span>
                        <div className="h-14 w-full flex items-center justify-center mb-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg">
                           <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                             {fu_before_rounding} <span className="text-indigo-400 mx-1">→</span> {currentProblem.fu}
                           </span>
                        </div>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">向上取整</span>
                      </div>
                   </div>
                </div>

                {/* Score Calculation Analysis */}
                <div>
                   <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">点数构成</h4>
                   <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        {currentProblem.agari_type === '自摸' && currentProblem.wind_of_player !== '东' ? (
                          // Child Tsumo: Dealer / Child
                          <div className="flex items-center justify-center text-lg md:text-xl font-medium text-slate-700 dark:text-slate-300 font-mono">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">庄家</span>
                              <span>{currentProblem.correctMain - currentProblem.main_bonus}</span>
                            </div>
                            <span className="mx-2 text-slate-400">/</span>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">子家</span>
                              <span>{currentProblem.correctAdditional - currentProblem.additional_bonus}</span>
                            </div>
                            
                            <span className="mx-3 text-indigo-500 font-bold">+</span>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">场供</span>
                              <span>{currentProblem.main_bonus}</span>
                            </div>
                            <span className="mx-2 text-slate-400">/</span>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">场供</span>
                              <span>{currentProblem.additional_bonus}</span>
                            </div>
                            
                            <span className="mx-3 text-indigo-500 font-bold">=</span>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">庄家支付</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentProblem.correctMain}</span>
                            </div>
                            <span className="mx-2 text-slate-400">/</span>
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">子家支付</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentProblem.correctAdditional}</span>
                            </div>
                          </div>
                        ) : (
                          // Ron or Dealer Tsumo
                          <div className="flex items-center justify-center text-lg md:text-xl font-medium text-slate-700 dark:text-slate-300 font-mono">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">基本点</span>
                              <span>{currentProblem.correctMain}</span>
                            </div>
                            
                            <span className="mx-4 text-indigo-500 font-bold">+</span>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">场供</span>
                              <span>{currentProblem.main_bonus}</span>
                            </div>
                            
                            <span className="mx-4 text-indigo-500 font-bold">=</span>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">总计</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentProblem.correctMain+currentProblem.main_bonus}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          (基本点 + 本场数 × {currentProblem.agari_type === '自摸' ? (currentProblem.wind_of_player === '东' ? '100' : '100') : '300'})
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

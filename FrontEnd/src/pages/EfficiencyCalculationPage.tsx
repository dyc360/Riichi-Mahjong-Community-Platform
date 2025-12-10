import React, { useState, useEffect } from 'react';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';

// Types
interface TileInfo {
  improves_shanten: string;
  shanten_number: number;
  waiting_tiles: string[];
  num_waiting_tiles: number[];
}

interface AnalysisResult {
  isCorrect: boolean;
  status: 'optimal' | 'suboptimal' | 'bad';
  recommendation: string[]; // Changed to array of strings
  shanten: number;
  ukeire: number;
  details: string;
  fullHandStr: string; // Backend provided full hand string for image generation
  allOptions: number[]; // Indices of correct options
  tileInfo: TileInfo[]; // Detailed info for all tiles
  options: { 
      tileCode: string; 
      ukeire: number;
      detailedWaitings: { tile: string; count: number }[];
      shanten: number;
  }[]; // Pre-calculated options for display
  userChoice: {
      tileCode: string;
      ukeire: number;
      detailedWaitings: { tile: string; count: number }[];
  };
}

interface HistoryItem {
  turn: number;
  discardedTile: string;
  result: AnalysisResult;
}

// Helper functions

// Call backend efficiency API and return AnalysisResult-like payload
const callEfficiencyApi = async (payload: any) => {
  try {
    const res = await fetch('/api/mahjong/efficiency/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API error: ${res.status} ${txt}`);
    }
    return await res.json();
  } catch (err) {
    console.error('efficiency API error', err);
    return { error: String(err) };
  }
};

// Component for a single Tile
const MahjongTile = ({ 
  code, 
  onClick, 
  className = "",
  isHoverable = true 
}: { 
  code: string; 
  onClick?: () => void; 
  className?: string;
  isHoverable?: boolean;
}) => {
  // Using the backend URL pattern we found
  const imageUrl = `http://localhost:8000/api/mahjong/images/${code}`;

  return (
    <div 
      className={`
        relative h-14 lg:h-16 flex-shrink-0 
        ${isHoverable ? 'transition-transform duration-100 hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <img 
        src={imageUrl} 
        alt={code} 
        className="w-full h-full object-contain drop-shadow-md"
        onError={(e) => {
          // Fallback if image fails
          e.currentTarget.src = 'https://placehold.co/40x60?text=' + code;
        }}
      />
    </div>
  );
};

const EfficiencyCalculationPage = () => {
  // State
  const [handTiles, setHandTiles] = useState<string[]>([]);
  const [drawnTile, setDrawnTile] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<HistoryItem | null>(null);
  const [turnCount, setTurnCount] = useState(1);
  const [currentTurnData, setCurrentTurnData] = useState<any>(null);
  
  // New state for review mode
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [nextTurnData, setNextTurnData] = useState<any>(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);

  // Initialize Game
  useEffect(() => {
    startNewGame();
  }, []);

  // Start New Game
  const startNewGame = async () => {
    const payload = {
      hand_34_array: null,
      ukeire_tile: null,
      sutehai: null,
      tile_num: null,
      tile_13_in_hand: null,
    };

    const apiResp = await callEfficiencyApi(payload);
    if (apiResp.error) {
      console.error("Failed to start game:", apiResp.error);
      return;
    }

    setTurnCount(1);
    setHistory([]);
    setSelectedAnalysis(null);
    setShowAnalysis(false);
    setNextTurnData(null);
    
    // Update state from backend
    setHandTiles(apiResp.tile_in_hand_str_list);
    setDrawnTile(apiResp.ukeire_tile_str);
    setCurrentTurnData(apiResp);
  };

  // Helper to analyze a discard without changing game state
  const analyzeDiscard = (discardIndex: number): AnalysisResult => {
    const tileInfo = currentTurnData.tile_info || [];
    const allOptions = currentTurnData.all_options || [];
    const bestOptions = currentTurnData.best_options || [];
    
    // Determine status
    let status: 'optimal' | 'suboptimal' | 'bad' = 'bad';
    if (bestOptions.includes(discardIndex)) {
        status = 'optimal';
    } else if (allOptions.includes(discardIndex)) {
        status = 'suboptimal';
    }

    // Check if user's choice is in the optimal options
    const isCorrect = allOptions.includes(discardIndex);
    
    // Get details for user's choice
    const myInfo = tileInfo[discardIndex] || {};
    const myShanten = myInfo.shanten_number ?? 99;
    const myWaitingTiles = myInfo.waiting_tiles || [];
    const myUkeireCount = (myInfo.num_waiting_tiles || []).reduce((a: number, b: number) => a + b, 0);

    // Get recommendations (tile codes for all optimal options)
    const recommendations = allOptions.map((idx: number) => {
        if (idx < 13) return currentTurnData.tile_in_hand_str_list[idx];
        return currentTurnData.ukeire_tile_str;
    });

    // Use backend provided full_hand_str
    const fullHandStr = currentTurnData.full_hand_str || "";

    // User's choice details
    const userTileCode = (discardIndex < 13) ? currentTurnData.tile_in_hand_str_list[discardIndex] : currentTurnData.ukeire_tile_str;
    const userInfo = tileInfo[discardIndex] || {};
    const userUkeire = (userInfo.num_waiting_tiles || []).reduce((a: number, b: number) => a + b, 0);
    const userWaitings = userInfo.waiting_tiles || [];
    const userWaitingCounts = userInfo.num_waiting_tiles || [];
    const userDetailedWaitings = userWaitings.map((tile: string, i: number) => ({
        tile,
        count: userWaitingCounts[i]
    }));

    const userChoice = {
        tileCode: userTileCode,
        ukeire: userUkeire,
        detailedWaitings: userDetailedWaitings
    };

    // Prepare detailed options for display using the 13+1 structure
    const rawOptions = allOptions
        .filter((idx: number) => idx !== discardIndex)
        .map((idx: number) => {
        const code = (idx < 13) ? currentTurnData.tile_in_hand_str_list[idx] : currentTurnData.ukeire_tile_str;
        const info = tileInfo[idx] || {};
        const ukeire = (info.num_waiting_tiles || []).reduce((a: number, b: number) => a + b, 0);
        const shanten = info.shanten_number;
        
        // New fields
        const waitings = info.waiting_tiles || [];
        const waitingCounts = info.num_waiting_tiles || [];
        
        // Combine them for easier rendering
        const detailedWaitings = waitings.map((tile: string, i: number) => ({
            tile,
            count: waitingCounts[i]
        }));

        return { tileCode: code, ukeire, detailedWaitings, shanten };
    });

    // Deduplicate options by tileCode
    const options = rawOptions.filter((opt: { tileCode: any; }, index: any, self: any[]) => 
        index === self.findIndex((t) => t.tileCode === opt.tileCode)
    );

    return {
      isCorrect,
      status,
      recommendation: recommendations,
      shanten: myShanten,
      ukeire: myUkeireCount,
      details: `等待牌: ${myWaitingTiles.join(', ')}`,
      fullHandStr: fullHandStr,
      allOptions: allOptions,
      tileInfo: tileInfo,
      options: options,
      userChoice: userChoice
    };
  };

  // Handle Discard
  const handleDiscard = async (tileCode: string, index: number, isDrawn: boolean) => {
    if (!currentTurnData || isLoadingNext) return;
    
    // If there is no drawn tile, we cannot discard (game over/no tiles left)
    if (!drawnTile) return;

    const discardIndex = isDrawn ? 13 : index;

    // 1. Analyze the move using currentTurnData
    const analysis = analyzeDiscard(discardIndex);

    // 2. Update History & Show Analysis
    const newHistoryItem: HistoryItem = {
      turn: turnCount,
      discardedTile: tileCode,
      result: analysis,
    };
    setHistory(prev => [...prev, newHistoryItem]);
    setSelectedAnalysis(newHistoryItem);
    setShowAnalysis(false); // Don't auto-show analysis, let user click to view
    setIsLoadingNext(true);

    // 3. Call Backend for Next Turn
    const payloadForNext = {
      hand_34_array: currentTurnData.hand_34_array,
      ukeire_tile: currentTurnData.ukeire_tile,
      sutehai: discardIndex,
      tile_num: currentTurnData.tile_num,
      tile_13_in_hand: currentTurnData.tile_13_in_hand,
    };

    const nextTurnResp = await callEfficiencyApi(payloadForNext);
    
    if (nextTurnResp.error) {
        console.error("Failed to fetch next turn:", nextTurnResp.error);
        setIsLoadingNext(false);
        return;
    }

    // 4. Auto-advance to next turn
    setHandTiles(nextTurnResp.tile_in_hand_str_list);
    setDrawnTile(nextTurnResp.ukeire_tile_str);
    setCurrentTurnData(nextTurnResp);
    setTurnCount(prev => prev + 1);
    setNextTurnData(null);
    setIsLoadingNext(false);
    // Note: We keep selectedAnalysis set so the user can see the result of their last move
  };

  // handleNextQuestion is no longer needed for manual advancement, 
  // but we can keep a simplified version if we want a "Skip" to just go to next random? 
  // No, "Skip" calls startNewGame. 
  // We can remove handleNextQuestion or leave it empty/unused.

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <HomePageHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <MainNavigation />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Game Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hand Area */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-slate-700 min-h-[300px] flex flex-col justify-center items-center relative">
              <div className="flex items-center gap-3 mb-8 self-start">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  当前手牌 (第 {turnCount} 巡)
                </h2>
                {currentTurnData?.is_tenpai && (
                  <span className="px-3 py-1 bg-indigo-500 text-white text-sm font-bold rounded-full shadow-lg">
                    听牌!
                  </span>
                )}
              </div>
              
              <div className="w-full overflow-x-auto p-4">
                <div className="flex items-end w-max mx-auto">
                  
                  {/* Hand Tiles */}
                  {handTiles.map((code, index) => (
                    <MahjongTile 
                      key={index}
                      code={code}
                      isHoverable={!!drawnTile}
                      onClick={() => drawnTile && handleDiscard(code, index, false)}
                    />
                  ))}

                  {/* Gap */}
                  <div className="w-4 lg:w-8 flex-shrink-0"></div>

                  {/* Drawn Tile */}
                  {drawnTile && (
                    <MahjongTile 
                      code={drawnTile}
                      onClick={() => handleDiscard(drawnTile, -1, true)}
                    />
                  )}

                </div>
                {!drawnTile && (
                    <div className="text-center text-red-500 font-bold mt-4">
                        牌山已空，请进入下一题
                    </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute bottom-8 right-8 flex gap-3">
                  <button 
                    onClick={startNewGame}
                    disabled={isLoadingNext}
                    className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    下一题
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
              </div>
            </div>

            {/* Discard History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                舍牌历史
              </h3>
              <div className="flex flex-wrap gap-2">
                {history.map((item, index) => (
                  <div 
                    key={index}
                    className={`
                      relative p-2 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedAnalysis === item 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-transparent hover:bg-gray-100 dark:hover:bg-slate-700'}
                    `}
                    onClick={() => setSelectedAnalysis(item)}
                  >
                    <div className="text-xs text-center text-slate-500 mb-1">
                      Turn {item.turn}
                    </div>
                    <MahjongTile 
                      code={item.discardedTile} 
                      isHoverable={false} 
                      className="w-8 h-12 lg:w-10 lg:h-14"
                    />
                    {/* Correctness Indicator */}
                    <div className={`
                      absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white
                      ${item.result.status === 'optimal' ? 'bg-green-500' : item.result.status === 'suboptimal' ? 'bg-yellow-500' : 'bg-red-500'}
                    `}>
                      {item.result.status === 'optimal' ? '✓' : item.result.status === 'suboptimal' ? '⚠' : '✕'}
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-slate-400 text-sm py-4">
                    暂无舍牌记录
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Analysis Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                切牌分析
              </h3>

              {selectedAnalysis ? (
                <div className="space-y-6">
                  {!showAnalysis ? (
                    <div className="text-center py-12">
                      <button 
                        onClick={() => setShowAnalysis(true)}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow transition-colors"
                      >
                        查看详细分析
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Full Hand Display */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            当时手牌
                          </h4>
                          <div className="flex justify-center bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg overflow-x-auto">
                              <img 
                                src={`http://localhost:8000/api/mahjong/images/${selectedAnalysis.result.fullHandStr}`} 
                                alt="Full Hand" 
                                className="h-10 lg:h-12 object-contain drop-shadow-md"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerText = '无法加载手牌图片';
                                }}
                              />
                          </div>
                      </div>

                      {/* Result Status */}
                      <div className={`
                        p-4 rounded-xl border flex items-center gap-3
                        ${selectedAnalysis.result.status === 'optimal'
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                          : selectedAnalysis.result.status === 'suboptimal'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}
                      `}>
                        <div className={`text-2xl`}>
                          {selectedAnalysis.result.status === 'optimal' ? '✓' : selectedAnalysis.result.status === 'suboptimal' ? '⚠' : '✕'}
                        </div>
                        <div>
                          <div className="font-bold">
                            {selectedAnalysis.result.status === 'optimal' 
                                ? '切牌正确' 
                                : selectedAnalysis.result.status === 'suboptimal' 
                                    ? '切牌一般' 
                                    : '切牌错误'}
                          </div>
                          <div className="text-sm opacity-80">
                            {selectedAnalysis.result.status === 'optimal' 
                                ? '这是当前效率最高的打法' 
                                : selectedAnalysis.result.status === 'suboptimal'
                                    ? '选择没有退向但有更优的选择'
                                    : '选择退向'}
                          </div>
                        </div>
                      </div>

                      {/* User Choice */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            你的选择
                          </h4>
                          <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600">
                              {/* Header: Discard Tile + Total Ukeire */}
                              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-600 pb-2 mb-1">
                                  <MahjongTile 
                                      code={selectedAnalysis.result.userChoice.tileCode} 
                                      isHoverable={false}
                                      className="h-10 lg:h-12"
                                  />
                                  <div>
                                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                          切 {selectedAnalysis.result.userChoice.tileCode}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                          <span>总进张: {selectedAnalysis.result.userChoice.ukeire} 枚</span>
                                          <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-700 dark:text-slate-300">
                                            {selectedAnalysis.result.shanten === 0 ? '听牌' : `${selectedAnalysis.result.shanten} 向听`}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Body: Detailed Waitings */}
                              <div className="flex flex-wrap gap-0">
                                  {selectedAnalysis.result.userChoice.detailedWaitings.length > 0 ? (
                                    selectedAnalysis.result.userChoice.detailedWaitings.map((w, idx) => (
                                      <div key={idx} className="flex flex-col items-center">
                                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-0.5">
                                              ×{w.count}
                                          </span>
                                          <MahjongTile 
                                              code={w.tile} 
                                              isHoverable={false}
                                              className="h-8 lg:h-9" 
                                          />
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-xs text-slate-500">无有效进张 (向听数退化或维持)</div>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* Recommendation / Other Options */}
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            {selectedAnalysis.result.isCorrect ? '其他选择' : '正确选择'}
                          </h4>
                          
                          {selectedAnalysis.result.options.length > 0 ? (
                              <div className="space-y-3">
                                  {selectedAnalysis.result.options.map((opt, i) => (
                                      <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                          {/* Header: Discard Tile + Total Ukeire */}
                                          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-600 pb-2 mb-1">
                                              <MahjongTile 
                                                  code={opt.tileCode} 
                                                  isHoverable={false}
                                                  className="h-10 lg:h-12"
                                              />
                                              <div>
                                                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                      切 {opt.tileCode}
                                                  </div>
                                                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                      <span>总进张: {opt.ukeire} 枚</span>
                                                      <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-600 rounded text-slate-700 dark:text-slate-300">
                                                        {opt.shanten === 0 ? '听牌' : `${opt.shanten} 向听`}
                                                      </span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Body: Detailed Waitings */}
                                          <div className="flex flex-wrap">
                                              {opt.detailedWaitings.map((w, idx) => (
                                                  <div key={idx} className="flex flex-col items-center">
                                                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 mb-0.5">
                                                          ×{w.count}
                                                      </span>
                                                      <MahjongTile 
                                                          code={w.tile} 
                                                          isHoverable={false}
                                                          className="h-8 lg:h-9" 
                                                      />
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-sm text-slate-500">无其他推荐</div>
                          )}
                      </div>

                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <div className="mb-2 text-4xl">🀄</div>
                  <p>请进行切牌或选择历史记录查看分析</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};


export default EfficiencyCalculationPage;

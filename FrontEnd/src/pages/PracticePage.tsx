import { Link, useLocation } from 'react-router-dom'
import { HomePageHeader, PracticeCard, MainNavigation } from '../components/homePageComp'

// Mock data for practice problems
const PRACTICE_PROBLEMS = [
  { id: 1, title: "基础牌效 - 平和型", type: "牌效率何切", difficulty: "Easy", status: "Unsolved" },
  { id: 2, title: "何切300问 - Q28", type: "何切300", difficulty: "Hard", status: "Solved" },
  { id: 3, title: "清一色多面听 - 1", type: "清一色训练", difficulty: "Hard", status: "Unsolved" },
  { id: 4, title: "牌效率 - 进张最大化", type: "牌效率何切", difficulty: "Medium", status: "Unsolved" },
  { id: 5, title: "基础牌效 - 断幺九", type: "牌效率何切", difficulty: "Easy", status: "Solved" },
  { id: 6, title: "何切300问 - Q5", type: "何切300", difficulty: "Medium", status: "Unsolved" },
  { id: 7, title: "手牌算点 - 满贯确定", type: "手牌算点", difficulty: "Medium", status: "Unsolved" },
  { id: 8, title: "何切300问 - Q1", type: "何切300", difficulty: "Medium", status: "Unsolved" },
  { id: 9, title: "清一色 - 连号型", type: "清一色训练", difficulty: "Medium", status: "Unsolved" },
  { id: 10, title: "手牌算点 - 符数计算", type: "手牌算点", difficulty: "Hard", status: "Unsolved" },
]

export default function PracticePage() {
  return (
    <>
      <HomePageHeader />
      
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* 题库入口 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">选择练习模式</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <PracticeCard 
                title="手牌算点" 
                description="计算给出的手牌的点数，提升算分速度。" 
                difficulty="Medium" 
                count={85} 
                link="/practice/point-calculation"
            />
            <PracticeCard 
                title="清一色训练" 
                description="针对多面听的清一色牌型进行专项训练。" 
                difficulty="Hard" 
                count={40} 
            />
            <PracticeCard 
                title="何切300" 
                description="来自《何切300问》的精选题目，涵盖多种复杂局面。" 
                difficulty="Medium" 
                count={300} 
            />
            <PracticeCard 
                title="牌效率何切" 
                description="适合新手的牌效练习，学习如何最大化进张。" 
                difficulty="Easy" 
                link="/practice/efficiency-calculation"
                count={150} 
            />
          </div>
        </section>

        {/* 热门挑战 */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">热门挑战</h2>
            <Link to="#" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">查看更多 →</Link>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {PRACTICE_PROBLEMS.slice(0, 5).map(problem => (
                <div key={problem.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{problem.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          problem.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          problem.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {problem.difficulty}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{problem.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors">
                    开始
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// Reusing NavItem component
const NavItem = ({ 
  label, 
  path 
}: { 
  label: string; 
  path: string 
}) => {
  const location = useLocation();
  const isActive = location.pathname === path;
  
  return (
    <Link 
      to={path}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-indigo-500 text-white' 
          : 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-700'
        }`}
    >
      {label}
    </Link>
  );
};
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage_Admin from "./pages/LoginPage_Admin"
import HomePage from "./pages/HomePage"
import NewsPage from "./pages/NewsPage"
import ForumPage from "./pages/ForumPage"
import ProfilePage from "./pages/ProfilePage"
import PracticePage from "./pages/PracticePage"
import PointCalculationPage from "./pages/PointCalculationPage"
import NewsProPage from "./pages/NewsProPage"
import NewsArchivePage from "./pages/NewsArchivePage.tsx"
import NewsCategoryPage from "./pages/NewsCategoryPage.tsx"
import NewsMLeaguePage from "./pages/NewsMLeaguePage.tsx"
import MLeagueSchedulePage from "./pages/MLeagueSchedulePage.tsx"
import { AuthProvider } from './contexts/AuthContext';
import MLeagueStatsPage from "./pages/MLeagueStatsPage.tsx"
import PlayerDetailPage from "./pages/PlayerDetailPage.tsx"
import MatchDetailPage from "./pages/MatchDetailPage.tsx"
import NewsMajsoulPage from "./pages/NewsMajsoulPage.tsx"
import NewsMajsoulDetailPage from "./pages/NewsMajsoulDetailPage.tsx"
import EfficiencyCalculationPage from "./pages/EfficiencyCalculationPage.tsx"
import NewsDetailPage from "./pages/NewsDetailPage.tsx"
import ForumPostDetailPage from "./pages/ForumPostDetailPage.tsx"
import CreatePostPage from "./pages/CreatePostPage.tsx"
import EditPostPage from "./pages/EditPostPage.tsx"
import ForumSectionPage from "./pages/ForumSectionPage.tsx"
import ForumHotPage from "./pages/ForumHotPage.tsx"
import ForumLatestPage from "./pages/ForumLatestPage.tsx"
import ForumTopicPage from "./pages/ForumTopicPage.tsx"
// import HomePage from "./pages/HomePage"
// import ProfilePage from "./pages/ProfilePage"

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* 默认重定向到登录页 */}
				<Route path="/" element={<Navigate to="/login" replace />} />
				{/* 登录页 */}
				<Route path="/login" element={<LoginPage />} />
				{/* 注册页 */}
				<Route path="/signup" element={<SignUpPage />} />
				{/* 管理员登录页 */}
				<Route path="/login/admin" element={<LoginPage_Admin />} />
				{/* 首页 */}
				<Route path="/home" element={<HomePage />} />
				{/* <Route path="/homePage" element={<HomePage />} /> */}
				{/* 新闻浏览 */}
				<Route path="/news" element={<NewsPage />} />
				{/* 论坛交流 */}
				<Route path="/forum" element={<ForumPage />} />
				<Route path="/forum/post/:title" element={<ForumPostDetailPage />} />
				<Route path="/forum/create-post" element={<CreatePostPage />} />
				<Route path="/forum/edit-post/:title" element={<EditPostPage />} />
				<Route path="/forum/section/:sectionname" element={<ForumSectionPage />} />
				<Route path="/forum/hot" element={<ForumHotPage />} />
				<Route path="/forum/latest" element={<ForumLatestPage />} />
				<Route path="/forum/topic/:topic" element={<ForumTopicPage />} />
				{/* 何切练习 */}
				<Route path="/practice" element={<PracticePage />} />
				<Route path="/practice/point-calculation" element={<PointCalculationPage />} />
				<Route path="/practice/efficiency-calculation" element={<EfficiencyCalculationPage />} />
				{/* 个人中心 */}
				<Route path="/profile" element={<ProfilePage />} />
				{/* 行业资讯 */}
				<Route path="/news/pro/:title" element={<NewsProPage />} />
				<Route path="/news/archive" element={<NewsArchivePage />} />
				<Route path="/news/category/:category" element={<NewsCategoryPage />} />
				<Route path="/news/detail/:id" element={<NewsDetailPage />} />
				{/* m-league积分 */}
				<Route path="/news/m-league" element={<NewsMLeaguePage />} />
				{/* m-league赛程安排 */}
				<Route path="/news/m-league/schedule" element={<MLeagueSchedulePage />} />
				{/* m-league详细数据 */}
				<Route path="/news/m-league/stats" element={<MLeagueStatsPage />} />
				{/* 选手详细信息 */}
				<Route path="/players/:name" element={<PlayerDetailPage />} />
				{/* 比赛详情 */}
				<Route path="/matches/:date/:teams" element={<MatchDetailPage />} />
				{/* 雀魂游戏信息 */}
				<Route path="/news/majsoul" element={<NewsMajsoulPage />} />
				{/* 雀魂游戏信息详情 */}
				<Route path="/news/majsoul/:title" element={<NewsMajsoulDetailPage />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App

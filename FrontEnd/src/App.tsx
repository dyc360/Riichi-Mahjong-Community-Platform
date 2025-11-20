import { BrowserRouter, Routes, Route, Navigate} from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage_Admin from "./pages/LoginPage_Admin"
import HomePage from "./pages/HomePage"
import NewsPage from "./pages/NewsPage"
import ForumPage from "./pages/ForumPage"
import ProfilePage from "./pages/ProfilePage"
import PracticePage from "./pages/PracticePage"
import PointCalculationPage from "./pages/PointCalculationPage"
import "./styles/App.css"
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
        {/* 新闻浏览 */}
        {/* <Route path="/news" element={<NewsPage />} /> */}
        {/* 论坛交流 */}
        {/* <Route path="/forum" element={<ForumPage />} /> */}
        {/* 何切练习 */}
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/practice/point-calculation" element={<PointCalculationPage />} />
        {/* 个人中心 */}
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

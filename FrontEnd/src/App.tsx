import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import "./styles/App.css"
// import HomePage from "./pages/HomePage"
// import ProfilePage from "./pages/ProfilePage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页 */}
        <Route path="/" element={<LoginPage />} />
        {/* 注册页 */}
        <Route path="/signup" element={<SignUpPage />} />
        {/* 首页 */}
        {/* <Route path="/" element={<HomePage />} /> */}
        {/* 个人中心 */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
      </Routes>
    </BrowserRouter>
  )
}

export default App

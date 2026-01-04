import { Link, useNavigate } from 'react-router-dom'
import { type ChangeEvent, type FormEvent, useState } from 'react'
import { getCsrfToken } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import {PasswordField, BrandHeader, HeroSection, BackgroundGlow, Prompt, PolicyFooter, SocialLogin} from '../components/loginComp'

// Shared shape for the login form data fields.
type FormState = {
  username: string
  password: string
  remember: boolean
}

type UseLoginFormResult = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  handleUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void
  handlePasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  togglePasswordVisibility: () => void
}


// Centralises login-related state and handlers so the view stays lean.
function useLoginForm(): UseLoginFormResult {
  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
    remember: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const authContext = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null);

    try {
      const response = await fetch('/api/auth/admin/login/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify({ username: form.username, password: form.password }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? '登录失败');
      }

      const { token, user } = await response.json();

      // 保存认证状态到全局authcontext
      // localStorage.setItem('authToken', token); // AuthContext handles this
      authContext.login(token, user);

      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, username: event.target.value }))
  }

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, password: event.target.value }))
  }

  const handleRememberChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, remember: event.target.checked }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  return {
    form,
    isSubmitting,
    showPassword,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
  }
}

type LoginFormProps = {
  form: FormState
  isSubmitting: boolean
  showPassword: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRememberChange: (event: ChangeEvent<HTMLInputElement>) => void
  onTogglePasswordVisibility: () => void
}

// Houses the credential inputs plus social-login affordances.
function LoginForm({
  form,
  isSubmitting,
  showPassword,
  onSubmit,
  onUsernameChange,
  onPasswordChange,
  onRememberChange,
  onTogglePasswordVisibility,
}: LoginFormProps) {
  return (
    <div className="login-card rounded-3xl border p-8 shadow-glow backdrop-blur">
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="username">
            管理员用户名
          </label>
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={form.username}
            onChange={onUsernameChange}
            className="auth-input w-full rounded-xl border px-4 py-3 text-sm placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
            placeholder="admin"
          />
        </div>

        <PasswordField
          id="password"
          label="密码"
          placeholder="输入密码"
          value={form.password}
          onChange={onPasswordChange}
          revealed={showPassword}
          onToggleReveal={onTogglePasswordVisibility}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={onRememberChange}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-400 focus:ring-indigo-400/70"
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">记住我</span>
          </label>
          <a className="font-medium dark:text-indigo-300 text-indigo-500 hover:text-indigo-200" href="#">
            忘记密码？
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-indigo-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  )
}



// Pulls everything together so layout, logic, and decoration stay focused.
function LoginPage_Admin() {
  const {
    form,
    isSubmitting,
    showPassword,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
    handleRememberChange,
    togglePasswordVisibility,
  } = useLoginForm()

  return (
    <div className="relative flex min-h-screen flex-col 
      bg-gradient-to-br from-gray-50 via-gray-100 to-indigo-100
      dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <BackgroundGlow />
      <BrandHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <HeroSection 
            welcomeMessage="欢迎访问MajHub!"
            suggestionText="使用你的管理员编号和密码登录。"
          />
          <LoginForm
            form={form}
            isSubmitting={isSubmitting}
            showPassword={showPassword}
            onSubmit={handleSubmit}
            onUsernameChange={handleUsernameChange}
            onPasswordChange={handlePasswordChange}
            onRememberChange={handleRememberChange}
            onTogglePasswordVisibility={togglePasswordVisibility}
          />
        <Prompt 
            question=''
            linkText='返回普通用户登录'
            linkTo='/login'/>
        </div>
      </main>
    </div>
  )
}

export default LoginPage_Admin